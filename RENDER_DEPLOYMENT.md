# Render.com Deployment Guide (100% FREE)

**Quick guide for deploying to Render.com with zero cost**

---

## Why Render.com?

- ✅ **100% FREE** - no credit card needed
- ✅ 750 hours/month free (enough for 24/7)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificates
- ✅ Perfect for internal tools
- ⚠️ Spins down after 15 min idle (30-second wake-up)
- ✅ Use UptimeRobot to keep awake during business hours (also free)

---

## Quick Deployment (20 minutes)

### 1. Create Render Account
- Go to https://render.com
- Sign up (FREE, no credit card)
- Connect your GitHub account

### 2. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your repository
3. Configure:
   ```
   Name: timber4u-qb-thermal
   Region: Frankfurt (or Singapore)
   Branch: main
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   Plan: Free
   ```
4. Click **"Create Web Service"**

### 3. Add Environment Variables

Go to **Environment** tab and add:

```bash
CLIENT_ID=<from_quickbooks_production_keys>
CLIENT_SECRET=<from_quickbooks_production_keys>
REDIRECT_URI=https://YOUR-SERVICE-NAME.onrender.com/redirect
FRONTEND_URL=https://YOUR-SERVICE-NAME.onrender.com
ENVIRONMENT=production
NODE_ENV=production
SESSION_SECRET=<generate_with_command_below>
SUPABASE=postgresql://postgres.qraknmrvtpvshgrpltow:9S1TBYB7PxskNAUo@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Click **"Save Changes"**

### 4. Get Your URL

Your service URL will be:
```
https://YOUR-SERVICE-NAME.onrender.com
```

Copy it and update the environment variables:
- `REDIRECT_URI=https://YOUR-ACTUAL-URL.onrender.com/redirect`
- `FRONTEND_URL=https://YOUR-ACTUAL-URL.onrender.com`

### 5. Configure QuickBooks

In QuickBooks Developer Portal (https://developer.intuit.com):

1. Go to Production Keys
2. Add these URLs:
   ```
   App URL:            https://YOUR-URL.onrender.com
   Launch URL:         https://YOUR-URL.onrender.com
   Disconnect URL:     https://YOUR-URL.onrender.com
   Privacy Policy:     https://YOUR-URL.onrender.com/privacy-policy.html
   End User Agreement: https://YOUR-URL.onrender.com/end-user-agreement.html
   Redirect URI:       https://YOUR-URL.onrender.com/redirect
   ```
3. Enable **Accounting** scope
4. Save changes

### 6. Test Deployment

Visit: `https://YOUR-URL.onrender.com/health`

Should return: `{"status":"ok"}`

**Note**: First load may take ~30 seconds if app was sleeping.

---

## Keep App Awake (Optional but Recommended)

### Use UptimeRobot (FREE)

1. Go to https://uptimerobot.com and sign up (free)
2. Click **"Add New Monitor"**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Timber4U QB
   - **URL**: `https://YOUR-URL.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
4. Click **"Create Monitor"**

**Result**: App stays awake 24/7, no wait times!

**Free tier usage:**
- 5-min pings = 288/day = ~8,640/month
- Render limit: 750 hours/month running time
- Your usage: ~175 hours (business hours) or ~744 hours (24/7 with UptimeRobot)
- **Still 100% FREE** ✅

---

## Troubleshooting

### App is slow/unresponsive
- **Cause**: App is sleeping (free tier behavior)
- **Fix**: Wait 30 seconds for wake-up, or set up UptimeRobot

### Build fails
- **Check logs**: Render Dashboard → Logs tab
- **Common issue**: Missing dependencies
- **Fix**: Ensure all packages are in package.json

### Environment variables not working
- **Fix**: Click "Save Changes" after adding variables
- **Fix**: Check for typos in variable names
- **Fix**: Render auto-redeploys when you save changes

### QuickBooks OAuth fails
- **Redirect URI mismatch**: Ensure QuickBooks URI matches Render domain exactly
- **Invalid credentials**: Using sandbox keys instead of production keys

### Session lost
- **Check**: SUPABASE environment variable is set correctly
- **Check**: Render logs for database connection errors

---

## Cost Breakdown

| Service | Cost | Why? |
|---------|------|------|
| Render.com | $0 | Free tier: 750 hours/month |
| UptimeRobot | $0 | Free tier: 50 monitors |
| Supabase | $0 | Free tier: 500MB database |
| QuickBooks API | $0 | Free API access |
| **Total** | **$0/month** | ✅ |

---

## Render Free Tier Limits

- **Hours**: 750 hours/month (31 days × 24 hours = 744 hours)
- **Bandwidth**: Generous for internal tools
- **SSL**: Included free
- **Custom domains**: Available on free tier
- **Auto-deploy**: Included

**Your usage:**
- Business hours only (7h/day, 25 days): ~175 hours = **23% of limit**
- 24/7 with UptimeRobot: ~744 hours = **99% of limit** (still free!)

---

## Updating Your App

When you push changes to GitHub:
1. Render auto-detects changes
2. Automatically rebuilds and redeploys
3. Watch progress in Logs tab
4. Deployment takes ~3-5 minutes

---

## Monitoring

### View Logs
1. Go to Render Dashboard
2. Select your service
3. Click **"Logs"** tab
4. Real-time logs appear here

### Check Status
- Dashboard shows "Live" when running
- Shows "Deploy" when building
- Shows error message if failed

---

## Production Checklist

Before going live:
- [ ] Environment variables all set
- [ ] QuickBooks configured with Render URLs
- [ ] Using production QuickBooks keys (NOT sandbox)
- [ ] ENVIRONMENT=production
- [ ] NODE_ENV=production
- [ ] Health endpoint returns OK
- [ ] Legal documents load
- [ ] OAuth flow works
- [ ] Can create test invoice
- [ ] UptimeRobot configured (optional but recommended)

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **QuickBooks Docs**: https://developer.intuit.com
- **Project Docs**: See QUICK_START.md for step-by-step guide

---

**Status**: Ready to deploy! 🚀

**Time to deploy**: 20-30 minutes

**Cost**: $0/month forever ✅
