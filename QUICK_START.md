# Quick Start - Production Deployment

**Time Required**: 20-30 minutes
**Difficulty**: Easy
**Cost**: 100% FREE (no credit card needed)

---

## Before You Start

Have these ready:
- [ ] GitHub account with this code pushed
- [ ] Render account (FREE: https://render.com)
- [ ] QuickBooks Developer account (FREE: https://developer.intuit.com)
- [ ] Supabase connection string (you have: `SUPABASE` env variable)

---

## Step 1: Deploy to Render (5 mins)

1. Go to https://render.com and sign up (FREE, no credit card)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `timber4u-qb-thermal` (or your choice)
   - **Region**: Frankfurt (closest to South Africa)
   - **Branch**: `main`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free**
5. Click **"Create Web Service"**
6. Wait for deployment (~3-5 minutes)
7. Copy your Render URL from the dashboard
   - Example: `timber4u-qb-thermal.onrender.com`

---

## Step 2: Add Environment Variables (5 mins)

In Render dashboard, go to **Environment** tab, add these:

```bash
CLIENT_ID=get_from_quickbooks_in_step_3
CLIENT_SECRET=get_from_quickbooks_in_step_3
REDIRECT_URI=https://YOUR-RENDER-URL.onrender.com/redirect
FRONTEND_URL=https://YOUR-RENDER-URL.onrender.com
ENVIRONMENT=production
NODE_ENV=production
SESSION_SECRET=GENERATE_WITH_COMMAND_BELOW
SUPABASE=postgresql://postgres.qraknmrvtpvshgrpltow:9S1TBYB7PxskNAUo@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Important**: Replace `YOUR-RENDER-URL` with your actual Render domain from Step 1 (e.g., `timber4u-qb-thermal`).

Click **"Save Changes"** - Render will auto-redeploy.

---

## Step 3: Get QuickBooks Production Keys (5 mins)

1. Go to https://developer.intuit.com
2. Sign in and go to **Dashboard**
3. Click on your app (or create new app)
4. Switch to **"Production"** section (top tabs)
5. Click **"Keys & credentials"**
6. Copy **Client ID** and **Client Secret**
7. Go back to Render Environment tab and update:
   - `CLIENT_ID=your_copied_client_id`
   - `CLIENT_SECRET=your_copied_client_secret`
8. Click **"Save Changes"**

---

## Step 4: Configure QuickBooks App URLs (5 mins)

Still in QuickBooks Developer Portal:

1. Click **"Settings"** for your app
2. Add these URLs (use your actual Render domain):

```
App URL:              https://YOUR-RENDER-URL.onrender.com
Launch URL:           https://YOUR-RENDER-URL.onrender.com
Disconnect URL:       https://YOUR-RENDER-URL.onrender.com
Privacy Policy:       https://YOUR-RENDER-URL.onrender.com/privacy-policy.html
End User Agreement:   https://YOUR-RENDER-URL.onrender.com/end-user-agreement.html
```

3. In **"OAuth"** section, add:
```
Redirect URI:         https://YOUR-RENDER-URL.onrender.com/redirect
```

4. In **"Scopes"**, enable:
   - ✅ Accounting

5. Click **"Save"**

---

## Step 5: Test Your Deployment (5 mins)

### 5.1 Health Check
Visit: `https://YOUR-RENDER-URL.onrender.com/health`

Should see: `{"status":"ok"}`

**Note**: First request may take ~30 seconds if the app was sleeping (spins down after 15 min idle on free tier).

### 5.2 Legal Documents
- Privacy: `https://YOUR-RENDER-URL.onrender.com/privacy-policy.html`
- Agreement: `https://YOUR-RENDER-URL.onrender.com/end-user-agreement.html`

Both should load successfully.

### 5.3 Full Test
1. Visit: `https://YOUR-RENDER-URL.onrender.com`
2. Click **"Connect to QuickBooks"**
3. Authorize with your **production** QuickBooks company
4. You should be redirected back to the app
5. Try loading customers
6. Try creating a test invoice
7. Verify invoice appears in QuickBooks Online
8. Print a thermal receipt

---

## Step 6: (Optional) Keep App Awake During Business Hours

Render free tier spins down after 15 minutes of inactivity. To keep it awake during business hours:

### Use UptimeRobot (FREE)

1. Go to https://uptimerobot.com and sign up (free)
2. Click **"Add New Monitor"**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Timber4U QB
   - **URL**: `https://YOUR-RENDER-URL.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
4. Click **"Create Monitor"**

**Result**: Your app stays awake 24/7, no 30-second wait times!

**Usage**:
- 5-min pings = 288 requests/day = ~8,640 requests/month
- Well under Render's 750 hour/month limit
- Still 100% FREE

---

## Troubleshooting

### Error: "Invalid client credentials"
- You're using sandbox keys instead of production keys
- Check Step 3 - make sure you copied from "Production" tab

### Error: "Redirect URI mismatch"
- QuickBooks URI doesn't match Render environment variable
- Verify both are EXACTLY the same (check https://, no trailing slash)

### Error: "Cannot connect"
- Check Render logs: Dashboard → Logs tab
- Verify all environment variables are set
- Try manual deploy: Dashboard → Manual Deploy

### Legal documents show 404
- Frontend build may have failed
- Check Render build logs
- Verify `frontend/public/` directory has the HTML files

### App is slow/times out
- App may be sleeping (free tier spins down after 15 min)
- Wait 30 seconds for wake-up
- Or set up UptimeRobot (Step 6) to keep it awake

---

## That's It! 🎉

Your app is now live in production - **100% FREE**!

**Your Production URL**: `https://YOUR-RENDER-URL.onrender.com`

---

## Next Steps

- [ ] **Set up UptimeRobot** (Step 6): Keep app awake during business hours
- [ ] **Update legal docs**: Add your actual contact info to privacy-policy.html and end-user-agreement.html
- [ ] **Bookmark your app**: Save the Render URL
- [ ] **Train your team**: Show them how to use the app
- [ ] **Enable backups**: Configure Supabase automatic backups

---

## Need More Help?

- **Detailed guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **QuickBooks setup**: See [QUICKBOOKS_SETUP.md](QUICKBOOKS_SETUP.md)
- **Overview**: See [PRODUCTION_READY.md](PRODUCTION_READY.md)

---

## Cost Breakdown

- **Render.com**: $0 (FREE tier - 750 hours/month)
- **UptimeRobot**: $0 (FREE tier - 50 monitors)
- **Supabase**: $0 (FREE tier - 500MB database)
- **QuickBooks API**: $0 (FREE)
- **Total**: **$0/month** 🎉

---

## Free Tier Limits

You're well within all free tier limits:
- **Render**: 750 hours/month (you use ~175 hours = 23%)
- **Supabase**: 500MB storage (session data = <1MB)
- **UptimeRobot**: 50 monitors, 5-min intervals (you use 1)

---

**Status**: Ready to deploy! Follow steps 1-6 above. ✅
