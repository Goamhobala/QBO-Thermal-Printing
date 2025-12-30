# Setup and Deployment Guide

## Project Overview

This is a monorepo application for QuickBooks Online invoice creation and thermal receipt printing for Timber 4 U CC. The project uses a **single-server architecture** where the Express backend serves both the API endpoints and the built React frontend.

### Technology Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React 18 + TypeScript + Vite
- **Authentication:** QuickBooks OAuth 2.0 (intuit-oauth)
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

---

## Architecture

### Development Mode
In development, you run **two separate servers**:
- **Frontend:** Vite dev server on `http://127.0.0.1:5173` (hot reload enabled)
- **Backend:** Express server on `http://localhost:3000` (API endpoints)
- Vite proxies API calls from frontend to backend (configured in `frontend/vite.config.ts`)

### Production Mode
In production, you run **one server**:
- **Backend:** Express server on port 3000 serves:
  1. API endpoints (`/login`, `/redirect`, `/customers`, `/health`, etc.)
  2. Static React build files from `frontend/dist`
  3. Catch-all route (`*`) for React Router support

---

## Initial Setup

### Prerequisites
- Node.js 18+ and npm
- QuickBooks Developer Account
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd QBO-ThermalPrinting

# Install dependencies for all packages
npm run install:all
```

### 2. QuickBooks App Setup

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com)
2. Create a new app (or use existing)
3. Get your credentials:
   - **Client ID**
   - **Client Secret**
4. Set the redirect URI to: `http://localhost:3000/redirect`

### 3. Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# QuickBooks OAuth Credentials
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/redirect
FRONTEND_URL=http://127.0.0.1:5173

# Environment (sandbox or production)
ENVIRONMENT=sandbox

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Database (optional)
SUPABASE=your_database_connection_string_here

# Server
PORT=3000

# Node Environment
NODE_ENV=development
```

**To generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Development

### Option 1: Run Both Servers Separately (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit: `http://127.0.0.1:5173`

### Option 2: Run Both with One Command

```bash
# From project root
npm run dev
```

This runs both servers in parallel (may be harder to see logs).

---

## Production Build and Testing

### Build Everything

```bash
# From project root
npm run build
```

This will:
1. Install frontend dependencies
2. Build React app to `frontend/dist`
3. Compile TypeScript backend to `backend/dist`

### Start Production Server

```bash
# From project root
npm start
```

Visit: `http://localhost:3000`

**Note:** The production server will:
- Serve the React app at the root URL
- Handle all API routes under their respective paths
- Support React Router navigation (catch-all route)

---

## Deployment

This application is designed for single-server deployment to platforms like **Railway**, **Render**, **Heroku**, or **DigitalOcean App Platform**.

### Environment Variables (Production)

Set these in your hosting platform:

```env
NODE_ENV=production
CLIENT_ID=your_production_client_id
CLIENT_SECRET=your_production_client_secret
REDIRECT_URI=https://yourdomain.com/redirect
FRONTEND_URL=https://yourdomain.com
ENVIRONMENT=production
SESSION_SECRET=your_secure_random_string
PORT=3000
```

### Railway Deployment

1. **Connect Repository:**
   - Go to [Railway.app](https://railway.app)
   - Create new project from GitHub repo

2. **Configure Build:**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave empty (monorepo setup handles it)

3. **Set Environment Variables:**
   - Add all variables from above in Railway dashboard

4. **Update QuickBooks Redirect URI:**
   - Go to QuickBooks Developer Portal
   - Update redirect URI to: `https://your-railway-url.railway.app/redirect`

### Render Deployment

1. **Create Web Service:**
   - Go to [Render.com](https://render.com)
   - New → Web Service → Connect repository

2. **Configure Service:**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

3. **Environment Variables:**
   - Add all required variables in Render dashboard

4. **Update QuickBooks Redirect URI**

### General Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update `REDIRECT_URI` to production URL
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Set `ENVIRONMENT=production` (for QuickBooks production API)
- [ ] Generate secure `SESSION_SECRET`
- [ ] Update redirect URI in QuickBooks Developer Portal
- [ ] Consider using a proper session store (Redis) instead of MemoryStore

---

## Project Structure

```
QBO-ThermalPrinting/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Main Express server
│   │   └── types/
│   │       └── express-session.d.ts  # Session type definitions
│   ├── dist/                       # Compiled TypeScript output
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # Environment variables (not in git)
│   └── .env.example                # Template for .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main React component
│   │   ├── pages/                  # Page components
│   │   ├── components/             # Reusable components
│   │   ├── lib/                    # Utilities
│   │   ├── data/                   # Mock data
│   │   └── types.ts                # TypeScript types
│   ├── dist/                       # Production build output
│   ├── package.json
│   ├── vite.config.ts              # Vite configuration
│   └── tsconfig.json
├── docs/
│   └── SETUP.md                    # This file
├── package.json                    # Root package.json (convenience scripts)
└── CLAUDE.md                       # Project instructions
```

---

## API Endpoints

### Authentication
- `GET /login` - Initiates QuickBooks OAuth flow
- `GET /redirect` - OAuth callback (handles tokens)

### QuickBooks Data
- `GET /customers` - Fetch customers from QuickBooks

### System
- `GET /health` - Health check endpoint

### Frontend Routes (React Router)
- `/` - Redirects to `/invoices`
- `/invoices` - Invoice list page
- `/create-invoice` - Create new invoice
- `/edit-invoice/:id` - Edit existing invoice

---

## How Single-Server Setup Works

### Key Implementation Details

**Backend Server Configuration** (`backend/src/server.ts`):

```typescript
// Serve static files from the React app (production only)
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));

    // Handle React Router - send all non-API requests to index.html
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}
```

**Request Flow:**

1. **API Requests** (e.g., `/login`, `/customers`):
   - Match specific route handlers first
   - Return JSON responses

2. **Static Assets** (e.g., `/assets/index-abc123.js`):
   - Served by `express.static()` middleware
   - Cached by browser

3. **Page Navigation** (e.g., `/invoices`, `/create-invoice`):
   - Caught by `app.get('*')` catch-all route
   - Returns `index.html`
   - React Router takes over and shows correct component

---

## Development Tips

### Viewing Logs
```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev
```

### Clearing Build Artifacts
```bash
# Clear backend build
rm -rf backend/dist

# Clear frontend build
rm -rf frontend/dist

# Rebuild everything
npm run build
```

### Testing Production Build Locally
```bash
# Build everything
npm run build

# Start production server
npm start

# Visit http://localhost:3000
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

### Session Issues in Production
The default MemoryStore session is not suitable for production. Consider using:
- **Redis** with `connect-redis`
- **MongoDB** with `connect-mongo`
- **PostgreSQL** with `connect-pg-simple`

### QuickBooks OAuth Issues
- Verify redirect URI matches exactly (including protocol, domain, port)
- Check that CLIENT_ID and CLIENT_SECRET are correct
- Ensure ENVIRONMENT is set correctly (sandbox vs production)
- Verify app is not sandboxed in QuickBooks Developer Portal if using production

---

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong, random SESSION_SECRET
   - Rotate secrets regularly

2. **Session Management:**
   - Use secure session store in production (not MemoryStore)
   - Set `cookie.secure: true` with HTTPS
   - Consider session expiration times

3. **QuickBooks Tokens:**
   - Tokens are stored in session (temporary)
   - Implement token refresh logic for long-running sessions
   - Consider encrypting stored tokens

4. **CORS:**
   - Configure CORS properly for production
   - Only allow trusted origins

---

## Next Steps

- [ ] Implement invoice creation API endpoints
- [ ] Add thermal receipt printing functionality
- [ ] Set up proper session store (Redis)
- [ ] Add error logging (Sentry, etc.)
- [ ] Implement token refresh mechanism
- [ ] Add automated tests
- [ ] Set up CI/CD pipeline
- [ ] Add rate limiting for API endpoints

---

## Support

For QuickBooks API documentation:
- [QuickBooks API Docs](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice)
- [intuit-oauth SDK](https://github.com/intuit/oauth-jsclient)

For technical issues:
- Check the [CLAUDE.md](../CLAUDE.md) file for project-specific instructions
- Review Express and React documentation
