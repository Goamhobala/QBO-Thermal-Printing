# Production Deployment Guide

This guide walks you through deploying the Timber 4 U CC QuickBooks Thermal Printing app to production - **100% FREE**.

## Prerequisites

- [ ] QuickBooks Developer account with production app credentials
- [ ] Supabase account with PostgreSQL database (you already have this)
- [ ] Render.com account (FREE - no credit card needed)
- [ ] Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Get QuickBooks Production Credentials

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com)
2. Navigate to your app dashboard
3. Click on your app (or create a new one for production)
4. Go to **"Production Keys"** tab (NOT Sandbox Keys)
5. Copy your:
   - **Client ID**
   - **Client Secret**
6. Add Redirect URIs:
   - `https://your-app-name.onrender.com/redirect`
   - (You'll get the actual Render URL in Step 3)

---

## Step 2: Configure QuickBooks App Settings

In your QuickBooks app settings, you need to provide these required URLs:

### App URLs (Required by QuickBooks)

After deploying to Render (Step 3), your URLs will be:

- **App URL**: `https://your-app-name.onrender.com`
- **Launch URL**: `https://your-app-name.onrender.com`
- **Disconnect URL**: `https://your-app-name.onrender.com`
- **Privacy Policy URL**: `https://your-app-name.onrender.com/privacy-policy.html`
- **End User Agreement URL**: `https://your-app-name.onrender.com/end-user-agreement.html`

### Scopes (Permissions)

Select these scopes in QuickBooks settings:
- ✅ **Accounting** (to access invoices, customers, items)

---

## Step 3: Deploy to Render.com (FREE)

### 3.1 Create Render Web Service

1. Go to [Render.com](https://render.com) and sign up (FREE, no credit card)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:
   - **Name**: `timber4u-qb-thermal` (or your choice)
   - **Region**: Frankfurt (closest to South Africa) or Singapore
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free**
5. Click **"Create Web Service"**

### 3.2 Configure Environment Variables

While the service is deploying, go to **Environment** tab and add:

```bash
# QuickBooks Production Credentials
CLIENT_ID=your_production_client_id_from_step_1
CLIENT_SECRET=your_production_client_secret_from_step_1
REDIRECT_URI=https://YOUR-SERVICE-NAME.onrender.com/redirect
FRONTEND_URL=https://YOUR-SERVICE-NAME.onrender.com

# Environment
ENVIRONMENT=production
NODE_ENV=production

# Session Secret - Generate a new one!
# Run this command to generate: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
SESSION_SECRET=your_generated_session_secret

# Supabase PostgreSQL
SUPABASE=postgresql://postgres.qraknmrvtpvshgrpltow:9S1TBYB7PxskNAUo@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

### 3.3 Get Your Render Domain

After adding environment variables:
1. Look at the top of the dashboard - your URL will be displayed
2. Format: `https://YOUR-SERVICE-NAME.onrender.com`
3. Go back to **Environment** tab and update:
   - `REDIRECT_URI=https://YOUR-ACTUAL-DOMAIN.onrender.com/redirect`
   - `FRONTEND_URL=https://YOUR-ACTUAL-DOMAIN.onrender.com`
4. Click **"Save Changes"**

### 3.4 Wait for Deployment

Render will automatically redeploy with new environment variables:
1. Watch the **Logs** tab for deployment progress
2. First deployment takes ~3-5 minutes
3. Look for "Server started on port" message
4. Status should change to "Live"

---

## Step 4: Update QuickBooks Settings with Render URLs

Now that you have your Render domain:

1. Go back to [QuickBooks Developer Portal](https://developer.intuit.com)
2. Update your app settings with the actual URLs:
   - **Redirect URI**: `https://your-actual-domain.onrender.com/redirect`
   - **Privacy Policy**: `https://your-actual-domain.onrender.com/privacy-policy.html`
   - **End User Agreement**: `https://your-actual-domain.onrender.com/end-user-agreement.html`
3. Save changes

---

## Step 5: Verify Deployment

### 5.1 Check Health Endpoint

Visit: `https://your-app-name.up.railway.app/health`

Expected response:
```json
{"status": "ok"}
```

### 5.2 Check Legal Documents

- Privacy Policy: `https://your-app-name.up.railway.app/privacy-policy.html`
- End User Agreement: `https://your-app-name.up.railway.app/end-user-agreement.html`

### 5.3 Test QuickBooks Authentication

1. Visit your app: `https://your-app-name.up.railway.app`
2. Click "Connect to QuickBooks"
3. Authorize with your **production QuickBooks company**
4. Verify you're redirected back successfully
5. Test creating an invoice

---

## Step 6: Database Setup

The session table will be automatically created in Supabase on first run (via `createTableIfMissing: true`).

To verify the session table was created:

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. You should see a `session` table with columns:
   - `sid` (session ID)
   - `sess` (session data)
   - `expire` (expiration timestamp)

---

## Step 7: Monitor and Test

### Check Railway Logs

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Test Complete Flow

1. ✅ Connect to QuickBooks
2. ✅ Load customers
3. ✅ Load items
4. ✅ Create an invoice
5. ✅ Print thermal receipt
6. ✅ Verify invoice appears in QuickBooks

---

## Important Security Notes

### Production Checklist

- [ ] Using production QuickBooks credentials (NOT sandbox)
- [ ] `ENVIRONMENT=production` in Railway variables
- [ ] `NODE_ENV=production` in Railway variables
- [ ] Strong `SESSION_SECRET` generated
- [ ] HTTPS enabled (Railway does this automatically)
- [ ] Secure cookies enabled (`secure: true` when NODE_ENV=production)
- [ ] Session data stored in PostgreSQL (NOT in-memory)

### Session Storage

✅ **Production**: Uses Supabase PostgreSQL
- Sessions persist across server restarts
- Sessions expire after 30 days of inactivity
- Automatic table creation

❌ **Development**: Used in-memory storage (now upgraded)

---

## Troubleshooting

### Issue: "Invalid client credentials"
**Fix**: Verify you're using production keys, not sandbox keys

### Issue: "Redirect URI mismatch"
**Fix**: Ensure the redirect URI in QuickBooks matches exactly: `https://your-domain/redirect`

### Issue: Session lost after server restart
**Fix**: Verify `SUPABASE` environment variable is set correctly in Railway

### Issue: "Cannot connect to database"
**Fix**: Check Supabase connection string format and ensure Supabase allows Railway's IP

### Issue: Legal documents return 404
**Fix**: Ensure frontend build completed successfully. Check Railway logs.

---

## Rolling Back

If you need to rollback to a previous deployment:

1. Go to Railway dashboard
2. Click **Deployments**
3. Find a previous successful deployment
4. Click **"Rollback to this version"**

---

## Updating the App

To deploy changes:

1. Commit and push to your Git repository
2. Railway will automatically detect changes and redeploy
3. Monitor the deployment logs
4. Verify the health endpoint after deployment

---

## Cost Estimates

### Railway
- **Free Tier**: $5 of free usage per month
- **Pro Plan**: $20/month for production apps
- Estimated cost: ~$5-10/month for small business use

### Supabase
- **Free Tier**: 500MB database, 2GB bandwidth
- **Pro Plan**: $25/month if you exceed free tier

**Total**: ~$5-35/month depending on usage

---

## Support

If you encounter issues:

1. Check Railway logs for errors
2. Verify all environment variables are set correctly
3. Test the health endpoint
4. Review QuickBooks API logs in developer portal

---

## Next Steps After Deployment

1. **Test thoroughly** with production QuickBooks data
2. **Set up monitoring** (Railway provides basic metrics)
3. **Regular backups** of Supabase database
4. **Document any custom workflows** for your team
5. **Train staff** on using the thermal printing system

---

## Contact Information for Legal Documents

**IMPORTANT**: Update the legal documents with actual contact information:

Edit these files before final deployment:
- `frontend/public/privacy-policy.html` (line with contact details)
- `frontend/public/end-user-agreement.html` (line with contact details)

Add:
- Company registration number
- Physical address
- Email address
- Phone number

---

## Security Best Practices

1. **Never commit** `.env` files to Git
2. **Rotate secrets** periodically (SESSION_SECRET, OAuth tokens)
3. **Monitor** Railway logs for suspicious activity
4. **Keep dependencies updated**: `npm audit` and `npm update`
5. **Backup** Supabase database regularly
6. **Use strong passwords** for all services
7. **Enable 2FA** on QuickBooks, Supabase, and Railway accounts

---

**Deployment Status**: Ready for Production ✅

Generated: 2026-01-02
