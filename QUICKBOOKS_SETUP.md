# QuickBooks Production App Setup - Quick Reference

## URLs to Configure in QuickBooks Developer Portal

Once you deploy to Railway and get your domain (e.g., `timber4u-qb.up.railway.app`), configure these in your QuickBooks app settings:

### Required App URLs

```
App URL:              https://YOUR-DOMAIN.up.railway.app
Launch URL:           https://YOUR-DOMAIN.up.railway.app
Disconnect URL:       https://YOUR-DOMAIN.up.railway.app
Privacy Policy URL:   https://YOUR-DOMAIN.up.railway.app/privacy-policy.html
End User Agreement:   https://YOUR-DOMAIN.up.railway.app/end-user-agreement.html
```

### OAuth Redirect URI

```
Redirect URI:         https://YOUR-DOMAIN.up.railway.app/redirect
```

**CRITICAL**: This must match EXACTLY what you set in the `REDIRECT_URI` environment variable in Railway.

---

## QuickBooks App Configuration Checklist

### Basic Information
- [ ] **App Name**: Timber 4 U CC QuickBooks Thermal Printing
- [ ] **App Description**: Internal tool for creating invoices and printing thermal receipts
- [ ] **Industry**: Retail / Timber Sales
- [ ] **Company**: Timber 4 U CC
- [ ] **Location**: South Africa

### Keys and Credentials
- [ ] Copy **Production Client ID** → Save to Railway environment variable
- [ ] Copy **Production Client Secret** → Save to Railway environment variable

### Scopes (Permissions Required)
- [x] **Accounting** - Required for:
  - Reading and creating invoices
  - Reading customers
  - Reading items/products
  - Reading tax codes and rates

### App URLs (After Railway Deployment)
- [ ] App URL
- [ ] Launch URL
- [ ] Disconnect URL
- [ ] Privacy Policy URL
- [ ] End User Agreement URL

### OAuth Configuration
- [ ] Redirect URI (must match Railway environment variable)

---

## Environment Variables Template for Railway

```bash
# Copy your Production keys from QuickBooks
CLIENT_ID=ABxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Update with your actual Railway domain
REDIRECT_URI=https://YOUR-ACTUAL-DOMAIN.up.railway.app/redirect
FRONTEND_URL=https://YOUR-ACTUAL-DOMAIN.up.railway.app

# MUST be 'production' for live QuickBooks
ENVIRONMENT=production
NODE_ENV=production

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
SESSION_SECRET=GENERATE_A_NEW_STRONG_SECRET_HERE

# Your Supabase connection string
SUPABASE=postgresql://postgres.xxxxx:password@aws-x-xx-xxxx-x.pooler.supabase.com:6543/postgres

PORT=3000
```

---

## Deployment Workflow

### Step-by-Step Order

1. **Deploy to Railway**
   - Push code to GitHub
   - Connect Railway to repo
   - Wait for first deployment
   - Get your Railway domain

2. **Update Environment Variables in Railway**
   - Add all variables listed above
   - Use your actual Railway domain
   - Redeploy

3. **Configure QuickBooks App**
   - Add all URLs with your Railway domain
   - Add redirect URI
   - Save settings

4. **Test**
   - Visit your app URL
   - Click "Connect to QuickBooks"
   - Authorize
   - Create a test invoice

---

## Testing Checklist

### Before Going Live
- [ ] Health endpoint responds: `/health`
- [ ] Privacy policy loads: `/privacy-policy.html`
- [ ] End user agreement loads: `/end-user-agreement.html`
- [ ] QuickBooks OAuth flow works
- [ ] Can load customers from QuickBooks
- [ ] Can load items from QuickBooks
- [ ] Can create invoice in QuickBooks
- [ ] Invoice appears in QuickBooks Online
- [ ] Thermal receipt prints correctly
- [ ] Session persists after Railway restart

### Production Verification
- [ ] Using production QuickBooks company (NOT sandbox)
- [ ] Using production API keys (NOT sandbox)
- [ ] ENVIRONMENT=production in Railway
- [ ] HTTPS working (Railway handles this)
- [ ] Session data stored in Supabase
- [ ] All legal documents accessible

---

## Common Mistakes to Avoid

1. ❌ Using sandbox credentials with ENVIRONMENT=production
2. ❌ Redirect URI mismatch between QuickBooks and Railway
3. ❌ Forgetting to redeploy after changing environment variables
4. ❌ Not updating QuickBooks URLs after getting Railway domain
5. ❌ Using weak SESSION_SECRET
6. ❌ Exposing credentials in Git commits

---

## Quick Command Reference

### Generate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Test Local Build
```bash
cd backend
npm run build
npm start
```

### View Railway Logs
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

---

## Support Resources

- **QuickBooks Developer Docs**: https://developer.intuit.com/app/developer/qbo/docs/get-started
- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **OAuth Troubleshooting**: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0

---

## Production Go-Live Checklist

### Pre-Launch
- [ ] All environment variables set in Railway
- [ ] Legal documents reviewed and contact info added
- [ ] QuickBooks app fully configured
- [ ] Railway domain secured
- [ ] SSL certificate active (automatic with Railway)
- [ ] Database connection tested

### Launch
- [ ] Test with real QuickBooks company
- [ ] Create test invoice
- [ ] Verify in QuickBooks Online
- [ ] Print test thermal receipt
- [ ] Monitor Railway logs for errors

### Post-Launch
- [ ] Document the Railway URL for team
- [ ] Train staff on new system
- [ ] Set up regular backups
- [ ] Monitor usage and costs
- [ ] Schedule quarterly security reviews

---

**Status**: Ready for Production Deployment ✅

**Next Action**: Deploy to Railway and get your domain name, then configure QuickBooks with the URLs above.
