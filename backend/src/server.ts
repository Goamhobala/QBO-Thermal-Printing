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
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax", // CSRF protection
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

        // Redirect back to frontend after successful authentication
        res.redirect(process.env.FRONTEND_URL!)
    }
    catch (error){
        console.log(error)
        res.status(500).json({error: "Failed to create token"})
    }
})

// ==================== QUICKBOOKS API ROUTES ====================

/**
 * GET /customers
 * Fetches all customers from QuickBooks
 * TODO: Replace redirect with proper API call using stored access token
 */
app.get("/customers", (req, res)=>{
    const baseURL= "https://sandbox-quickbooks.api.intuit.com/v3/company"
    const queryStatement = "SELECT * FROM Customer"
    // Redirect to QuickBooks API (for testing - should be replaced with server-side API call)
    res.redirect(`${baseURL}/${req.session.realmId}/query?query=${queryStatement}`)
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




