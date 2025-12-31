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
import cors from "cors";
import dotenv from "dotenv";
import OAuthClient from "intuit-oauth";
import path from "path";
 


// Load environment variables from .env file
dotenv.config();

// Initialize QuickBooks OAuth client with credentials from environment variables
const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    environment: process.env.ENVIRONMENT!, // 'sandbox' or 'production'
    redirectUri: process.env.REDIRECT_URI!, // Where QuickBooks redirects after auth
})



// Generate the OAuth authorization URL
// Users will be redirected here to grant permissions
const authUri = oauthClient.authorizeUri({
    scope: [(OAuthClient as any).scopes.Accounting], // Request access to accounting data
    state: "testState" // CSRF protection token
})

// Initialize Express application
const app = express();

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
app.use(
  expressSession({
    name: "qb_thermal.sid", // Session cookie name
    secret: process.env.SESSION_SECRET!, // Secret for signing session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      httpOnly: true, // Prevent client-side JS from accessing cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: "lax", // CSRF protection
      // In development, explicitly set domain to work with Vite proxy on localhost
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      path: '/', // Cookie available for all paths
    },
  })
);

// ==================== AUTHENTICATION ROUTES ====================

/**
 * GET /login
 * Initiates QuickBooks OAuth flow by redirecting to QuickBooks authorization page
 */
app.get('/login', (req, res)=>{
    console.log(authUri)
    res.redirect(authUri)
})

/**
 * GET /redirect
 * OAuth callback endpoint - QuickBooks redirects here after user grants permissions
 * Exchanges authorization code for access tokens and stores them in session
 */
app.get("/redirect", async (req, res)=> {
    const {code, state, realmId} = req.query;

    // Validate required OAuth parameters
    if (!code || !realmId) {
        return res.status(400).json({error: "Invalid request"})
    }

    // Verify CSRF protection state token
    if (state !== "testState") {
        return res.status(400).json({error: "Invalid state"})
    }

    try {
        // Exchange authorization code for access and refresh tokens
        const authResponse = await oauthClient.createToken(req.url);
        const tokens = (authResponse as any).getJson();

        // Store tokens and company ID in session for future API calls
        req.session.realmId = realmId as string; // QuickBooks company ID
        req.session.accessToken = tokens.access_token; // Short-lived token for API calls
        req.session.refreshToken = tokens.refresh_token; // Long-lived token to get new access tokens

        console.log('✅ Session saved:', {
            realmId: req.session.realmId,
            hasAccessToken: !!req.session.accessToken,
            sessionID: req.sessionID
        });

        // Redirect back to frontend after successful authentication
        // In development, this redirects to Vite dev server which proxies API calls to backend
        // In production, frontend is served from same server (no proxy needed)
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? '/'
            : process.env.FRONTEND_URL!;
        res.redirect(redirectUrl)
    }
    catch (error){
        console.log(error)
        res.status(500).json({error: "Failed to create token"})
    }
})

const queryApi = async (queryStatement: string, realmId: string, accessToken: string) => {
    const baseURL = "https://sandbox-quickbooks.api.intuit.com/v3/company"
    const url = `${baseURL}/${realmId}/query?query=${encodeURIComponent(queryStatement)}`

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
// ==================== QUICKBOOKS API ROUTES ====================

/**
 * GET /customers
 * Fetches all customers from QuickBooks
 * Makes authenticated API call using stored access token from session
 */
app.get("/customers", async (req, res) => {
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




