# Environment Configuration Guide

This guide explains how to switch between QuickBooks Sandbox and Production environments.

## Quick Switch Guide

### Switching to Sandbox (Development/Testing)

1. Edit `/backend/.env`:
   ```env
   ENVIRONMENT=sandbox
   ```

2. Restart the backend server:
   ```bash
   cd backend
   npm run dev
   ```

You'll see in the console:
```
🔧 QuickBooks Environment: sandbox
🔗 QuickBooks Base URL: https://sandbox-quickbooks.api.intuit.com/v3/company
```

### Switching to Production (Live Data)

1. Edit `/backend/.env`:
   ```env
   ENVIRONMENT=production
   ```

2. Make sure you have production credentials in `.env`:
   ```env
   CLIENT_ID=your_production_client_id
   CLIENT_SECRET=your_production_client_secret
   ```

3. Restart the backend server:
   ```bash
   cd backend
   npm run dev
   ```

You'll see in the console:
```
🔧 QuickBooks Environment: production
🔗 QuickBooks Base URL: https://quickbooks.api.intuit.com/v3/company
```

## Environment Variables Reference

### Backend (`/backend/.env`)

| Variable | Values | Description |
|----------|--------|-------------|
| `ENVIRONMENT` | `sandbox` or `production` | Controls which QuickBooks API to use |
| `CLIENT_ID` | Your app's client ID | Get from developer.intuit.com |
| `CLIENT_SECRET` | Your app's client secret | Get from developer.intuit.com |
| `REDIRECT_URI` | `http://localhost:3000/redirect` | OAuth callback URL |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend dev server URL |
| `SESSION_SECRET` | Random string | For session encryption |
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `development` or `production` | Node environment |

### Frontend (`/frontend/.env`)

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |
| `VITE_QBO_ENVIRONMENT` | `sandbox` or `production` | For display only |

## Important Notes

### Sandbox vs Production

**Sandbox:**
- Uses test data only
- Safe for development and testing
- Separate from your real QuickBooks company
- API: `https://sandbox-quickbooks.api.intuit.com`

**Production:**
- Uses real business data
- Requires production OAuth credentials
- Changes affect your actual QuickBooks company
- API: `https://quickbooks.api.intuit.com`

### OAuth Credentials

You need **separate credentials** for sandbox and production:

1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Create/select your app
3. Get credentials from:
   - **Sandbox keys**: Development tab
   - **Production keys**: Production tab (requires app approval)

### After Switching Environments

When you switch environments, you'll need to:

1. **Re-authenticate**: Log in again via `/login` endpoint
2. **Clear session**: Old tokens won't work with new environment
3. **Update credentials**: Make sure `CLIENT_ID` and `CLIENT_SECRET` match the environment

## Troubleshooting

### "Invalid token" errors after switching
- Clear browser cookies
- Log in again at `http://localhost:3000/login`

### Can't access production
- Ensure your app is published and approved by Intuit
- Verify production credentials are correct
- Check `ENVIRONMENT=production` in backend `.env`

### Changes not taking effect
- Restart the backend server
- Check the console for the environment log messages
