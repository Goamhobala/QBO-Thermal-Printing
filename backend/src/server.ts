/**
 * QBO Thermal Printing - Backend Server
 *
 * Express server that handles:
 * 1. QuickBooks OAuth authentication
 * 2. QuickBooks API requests (customers, invoices, etc.)
 * 3. Serving the React frontend in production mode
 */

import express from "express";
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import OAuthClient from "intuit-oauth";
import path from "path";
 


// Load environment variables from .env file
dotenv.config();

// Determine QuickBooks API base URL based on environment
const QBO_ENVIRONMENT = process.env.ENVIRONMENT || 'sandbox';
const QBO_BASE_URL = QBO_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com/v3/company'
    : 'https://sandbox-quickbooks.api.intuit.com/v3/company';

console.log(`🔧 QuickBooks Environment: ${QBO_ENVIRONMENT}`);
console.log(`🔗 QuickBooks Base URL: ${QBO_BASE_URL}`);

// Set up PostgreSQL session store with Supabase
const PgSession = connectPgSimple(expressSession);

// Supabase connection configuration
// If using connection pooling mode, you may need to use port 6543
// For direct connection (Transaction mode), use port 5432
const pgPool = new pg.Pool({
    connectionString: process.env.SUPABASE,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings optimized for Supabase
    max: 5, // Lower max connections for Supabase free tier
    min: 1, // Keep at least one connection alive
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000, // Increased to 30 seconds for slow Supabase connections
    // Supabase-specific settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Test the connection on startup
pgPool.connect()
    .then(client => {
        console.log('✅ Successfully connected to Supabase PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('❌ Failed to connect to Supabase:', err);
        console.warn('⚠️ Session store may not work. Check your SUPABASE connection string.');
        console.warn('⚠️ Make sure you are using the correct connection string format:');
        console.warn('   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
    });

console.log(`💾 Session Store: ${process.env.SUPABASE ? 'PostgreSQL (Supabase)' : 'Memory'}`);

// Initialize QuickBooks OAuth client with credentials from environment variables
const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    environment: QBO_ENVIRONMENT, // 'sandbox' or 'production'
    redirectUri: process.env.REDIRECT_URI!, // Where QuickBooks redirects after auth
})



// We'll generate the OAuth authorization URL dynamically per request
// This allows us to use unique CSRF state tokens for better security

// Helper function to generate random CSRF state token
const generateState = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Initialize Express application
const app = express();

// Trust first proxy (required for Render.com, Railway, Heroku, etc.)
// This allows Express to correctly recognize HTTPS connections behind reverse proxies
// and properly set/retrieve secure cookies for session management
app.set('trust proxy', 1);

// Configure CORS only in development (separate frontend/backend servers)
// In production, frontend is served from the same origin (monolith)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Allow cookies to be sent with requests
  }));
}

// Configure session middleware
// Sessions store OAuth tokens and company info (realmId)
const sessionStore = new PgSession({
  pool: pgPool, // Use Supabase PostgreSQL connection pool
  tableName: 'session', // Table to store sessions
  createTableIfMissing: true, // Auto-create session table
  errorLog: (error) => {
    console.error('❌ Session store error:', error);
  },
});

app.use(
  expressSession({
    store: sessionStore,
    name: "qb_thermal.sid", // Session cookie name
    secret: process.env.SESSION_SECRET!, // Secret for signing session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      httpOnly: true, // Prevent client-side JS from accessing cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection - 'lax' works for same-site and OAuth redirects
      path: '/', // Cookie available for all paths
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Parse JSON request bodies
app.use(express.json());

// ==================== AUTHENTICATION ROUTES ====================

/**
 * GET /login
 * Initiates QuickBooks OAuth flow by redirecting to QuickBooks authorization page
 * Generates a unique CSRF state token for each login attempt
 */
app.get('/login', (req, res) => {
    // Generate a unique state token for CSRF protection
    const state = generateState();

    // Store the state in the session so we can verify it on callback
    req.session.oauthState = state;

    // Save session before redirecting to ensure state is stored
    req.session.save((err) => {
        if (err) {
            console.error('❌ Failed to save OAuth state:', err);
            return res.status(500).send('Failed to initiate login. Please try again.');
        }

        // Generate the OAuth authorization URL with the unique state
        const authUri = oauthClient.authorizeUri({
            scope: [(OAuthClient as any).scopes.Accounting],
            state: state
        });

        console.log('🔐 Initiating OAuth with state:', state);
        res.redirect(authUri);
    });
})

/**
 * GET /redirect
 * OAuth callback endpoint - QuickBooks redirects here after user grants permissions
 * Exchanges authorization code for access tokens and stores them in session
 */
app.get("/redirect", async (req, res)=> {
    const {code, state, realmId} = req.query;

    // Debug logging to verify session retrieval and cookie handling
    console.log('🔍 Session debug:', {
        sessionID: req.sessionID,
        oauthState: req.session.oauthState,
        hasSession: !!req.session,
        cookieHeader: req.headers.cookie,
        secure: req.secure,
        protocol: req.protocol
    });

    // Validate required OAuth parameters
    if (!code || !realmId) {
        return res.status(400).send('Invalid OAuth callback: Missing code or realmId')
    }

    // Verify CSRF protection state token
    const expectedState = req.session.oauthState;
    if (!expectedState || state !== expectedState) {
        console.error('❌ CSRF state mismatch:', { expected: expectedState, received: state });
        return res.status(403).send('Invalid state token. Possible CSRF attack. Please try logging in again.')
    }

    // Clear the state from session now that we've verified it
    delete req.session.oauthState;

    try {
        // Construct the full callback URL
        // In production (Render), req.url only contains path, not full URL
        // We need to build the complete URL that QuickBooks sent us back to
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}${req.url}`;

        console.log('🔍 OAuth callback details:', {
            reqUrl: req.url,
            protocol,
            host,
            fullUrl,
            hasCode: !!code,
            hasRealmId: !!realmId
        });

        // Exchange authorization code for access and refresh tokens
        const authResponse = await oauthClient.createToken(fullUrl);
        const tokens = (authResponse as any).getJson();

        // Store tokens and company ID in session for future API calls
        req.session.realmId = realmId as string; // QuickBooks company ID
        req.session.accessToken = tokens.access_token; // Short-lived token for API calls
        req.session.refreshToken = tokens.refresh_token; // Long-lived token to get new access tokens

        console.log('💾 Attempting to save session to database...');

        // Explicitly save session before redirecting
        // This ensures the session is written to the database before we send the response
        // We use a timeout to handle slow Supabase connections
        let saveTimeout: NodeJS.Timeout;
        let sessionSaved = false;

        const saveTimeoutPromise = new Promise((_, reject) => {
            saveTimeout = setTimeout(() => {
                if (!sessionSaved) {
                    reject(new Error('Session save timeout after 15 seconds'));
                }
            }, 15000); // 15 second timeout
        });

        const savePromise = new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                sessionSaved = true;
                clearTimeout(saveTimeout);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        Promise.race([savePromise, saveTimeoutPromise])
            .then(() => {
                console.log('✅ Session saved successfully:', {
                    realmId: req.session.realmId,
                    hasAccessToken: !!req.session.accessToken,
                    sessionID: req.sessionID
                });

                // Redirect back to frontend after successful authentication
                // In development, this redirects to Vite dev server which proxies API calls to backend
                // In production, frontend is served from same server (no proxy needed)
                const redirectUrl = process.env.NODE_ENV === 'production'
                    ? '/home'
                    : process.env.FRONTEND_URL!;
                res.redirect(redirectUrl);
            })
            .catch((err) => {
                console.error('❌ Session save error:', err);
                // Even if save fails, the session might still be in memory
                // Try to redirect anyway, as the session might work for this request
                console.warn('⚠️ Attempting redirect despite save error...');
                const redirectUrl = process.env.NODE_ENV === 'production'
                    ? '/home'
                    : process.env.FRONTEND_URL!;
                res.redirect(redirectUrl);
            });
    }
    catch (error){
        console.log(error)
        res.status(500).json({error: "Failed to create token"})
    }
})

const queryApi = async (queryStatement: string, realmId: string, accessToken: string) => {
    const url = `${QBO_BASE_URL}/${realmId}/query?query=${encodeURIComponent(queryStatement)}`

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

const createEntity = async (entityType: string, entityData: any, realmId: string, accessToken: string) => {
    const url = `${QBO_BASE_URL}/${realmId}/${entityType}`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entityData)
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
}
/**
 * GET /auth/status
 * Check if user is authenticated
 */
app.get('/auth/status', (req, res) => {
    const isAuthenticated = !!(req.session.accessToken && req.session.realmId);
    res.json({
        authenticated: isAuthenticated,
        sessionID: req.sessionID
    });
});

// ==================== QUICKBOOKS API ROUTES ====================

/**
 * GET /customers
 * Fetches all customers from QuickBooks
 * Makes authenticated API call using stored access token from session
 */
app.get("/customers", async (req, res) => {
    console.log('📊 /customers request:', {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        session: req.session,
        hasAccessToken: !!req.session.accessToken,
        hasRealmId: !!req.session.realmId,
        cookies: req.headers.cookie
    });

    if (!req.session.accessToken || !req.session.realmId) {
        return res.status(401).json({error: "Not authenticated. Please login first."})
    }

    try {
        const data = await queryApi(
            "SELECT * FROM Customer",
            req.session.realmId,
            req.session.accessToken
        )
        res.json(data)
    } catch (error) {
        console.error("Error fetching customers:", error)
        res.status(500).json({error: "Failed to fetch customers from QuickBooks"})
    }
})

app.get("/items", async (req, res) => {
    if (!req.session.accessToken || !req.session.realmId) {
        return res.status(401).json({error: "Not authenticated. Please login first."})
    }

    try {
        const data = await queryApi(
            "SELECT * FROM Item",
            req.session.realmId,
            req.session.accessToken
        )
        res.json(data)
    } catch (error) {
        console.error("Error fetching items:", error)
        res.status(500).json({error: "Failed to fetch items from QuickBooks"})
    }
})

app.get("/taxcodes", async (req, res) => {
    if (!req.session.accessToken || !req.session.realmId) {
        return res.status(401).json({error: "Not authenticated. Please login first."})
    }

    try {
        const data = await queryApi(
            "SELECT * FROM TaxCode",
            req.session.realmId,
            req.session.accessToken
        )
        res.json(data)
    } catch (error) {
        console.error("Error fetching tax codes:", error)
        res.status(500).json({error: "Failed to fetch tax codes from QuickBooks"})
    }
})

app.get("/taxrates", async (req, res) => {
    if (!req.session.accessToken || !req.session.realmId) {
        return res.status(401).json({error: "Not authenticated. Please login first."})
    }

    try {
        const data = await queryApi(
            "SELECT * FROM TaxRate",
            req.session.realmId,
            req.session.accessToken
        )
        res.json(data)
    } catch (error) {
        console.error("Error fetching tax rates:", error)
        res.status(500).json({error: "Failed to fetch tax rates from QuickBooks"})
    }
})

app.get("/invoices", async (req, res)=>{
    if (!req.session.accessToken || !req.session.realmId){
        return res.status(401).json({error: "Not authenticated. Please login first."})
    }
    try{
        const data = await queryApi(
            "SELECT * FROM Invoice",
            req.session.realmId,
            req.session.accessToken
        )
        res.json(data)
    }
    catch (error){
        console.error("Error fetching invoices:", error)
        res.status(500).json({error: "Failed to fetch invoices from QuickBooks"})
    }
})

/**
 * POST /invoices
 * Create a new invoice in QuickBooks
 */
app.post("/invoices", async (req, res) => {
    if (!req.session.accessToken || !req.session.realmId) {
        return res.status(401).json({ error: "Not authenticated. Please login first." })
    }

    try {
        const invoiceData = req.body
        console.log('Received invoice data:', JSON.stringify(invoiceData, null, 2))

        // Validate required fields
        if (!invoiceData.CustomerRef || !invoiceData.Line || invoiceData.Line.length === 0) {
            return res.status(400).json({
                error: "Invalid invoice data. CustomerRef and at least one Line item are required."
            })
        }

        console.log('Sending to QuickBooks API...')
        const data = await createEntity(
            "invoice",
            invoiceData,
            req.session.realmId,
            req.session.accessToken
        )

        console.log('QuickBooks response:', JSON.stringify(data, null, 2))
        res.json(data)
    } catch (error) {
        console.error("Error creating invoice:", error)
        res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create invoice in QuickBooks"
        })
    }
})

// ==================== SYSTEM ROUTES ====================

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 */
app.get('/health', (req, res)=>{
    res.json({status: "ok"})
})

// ==================== FRONTEND SERVING (PRODUCTION ONLY) ====================

/**
 * In production, serve the built React app from the backend
 * This enables single-server deployment where Express handles both API and frontend
 *
 * Development uses separate servers:
 * - Frontend: Vite dev server on port 5173 (hot reload)
 * - Backend: Express server on port 3000 (API only)
 */
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');

    // Serve static files (JS, CSS, images, etc.)
    app.use(express.static(frontendPath));

    // Catch-all route: Send index.html for all non-API routes
    // This allows React Router to handle client-side routing
    // Must come AFTER all API routes to avoid conflicts
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// ==================== START SERVER ====================

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on port 3000");
});




