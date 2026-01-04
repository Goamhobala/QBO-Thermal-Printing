# Redis Session Store Migration Guide

## Why We Migrated from Supabase PostgreSQL to Upstash Redis

### The Problem
- **Supabase free tier** only supports IPv6 for direct connections and Session pooler
- **Render.com free tier** doesn't support outbound IPv6 connections
- **Transaction pooler** (which has IPv4) is incompatible with persistent session stores
- Result: `ENETUNREACH` errors when trying to connect to Supabase

### The Solution
- **Upstash Redis** offers a free tier with:
  - ✅ IPv4 support (works on Render.com)
  - ✅ 10,000 commands/day (plenty for sessions)
  - ✅ 256MB storage
  - ✅ Faster than PostgreSQL for session data
  - ✅ Purpose-built for session storage

---

## Setup Instructions

### 1. Create Upstash Redis Database

1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign up for a free account
3. Click **Create Database**
4. Choose settings:
   - **Name:** `qbo-thermal-sessions` (or any name)
   - **Type:** Regional
   - **Region:** Choose closest to your Render.com deployment (e.g., `us-east-1` if Render is in US East)
   - **TLS:** Enabled (recommended)
5. Click **Create**
6. Copy the **Redis URL** (starts with `redis://` or `rediss://`)
   - Format: `redis://default:password@endpoint.upstash.io:port`

### 2. Update Environment Variables

#### For Local Development

Update your `.env` file:
```bash
REDIS_URL=redis://default:your_password@your-endpoint.upstash.io:6379
```

#### For Production (Render.com)

1. Go to your Render.com dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update environment variable:
   - **Key:** `REDIS_URL`
   - **Value:** Your Upstash Redis URL from step 1
5. Click **Save Changes** (this will trigger a redeploy)

### 3. Remove Old Supabase Environment Variable (Optional)

Since we no longer use Supabase, you can remove the `SUPABASE` environment variable from Render.com:

1. In Render.com Environment tab
2. Find `SUPABASE` variable
3. Click delete/remove
4. Save changes

---

## What Changed

### Dependencies
- ❌ Removed: `connect-pg-simple`, `pg`, `@types/pg`, `@types/connect-pg-simple`
- ✅ Added: `connect-redis` (includes `redis` client automatically)

### Code Changes

#### [backend/src/server.ts](backend/src/server.ts)

**Imports changed:**
```typescript
// Old
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

// New
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
```

**Connection setup changed:**
```typescript
// Old: PostgreSQL Pool
const pgPool = new pg.Pool({
    connectionString: process.env.SUPABASE,
    ssl: { rejectUnauthorized: false },
    // ... pool settings
});

// New: Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
});
```

**Session store changed:**
```typescript
// Old
const sessionStore = new PgSession({
  pool: pgPool,
  tableName: 'session',
  createTableIfMissing: true,
});

// New
store: new RedisStore({
  client: redisClient,
  prefix: 'qb_session:',
  ttl: 30 * 24 * 60 * 60, // 30 days in seconds
}),
```

---

## Testing

### 1. Test Locally (Optional)

If you want to test locally with Redis:

1. Set `REDIS_URL` in your local `.env` file
2. Start the dev server: `npm run dev`
3. Check logs for: `✅ Successfully connected to Redis (Upstash)`
4. Test the OAuth flow

**Note:** For local development, Redis is optional. If `REDIS_URL` is not set, sessions will be stored in memory (lost on restart).

### 2. Test in Production

After deploying to Render.com:

1. Check deployment logs for:
   ```
   🔄 Connecting to Redis...
   ✅ Successfully connected to Redis (Upstash)
   💾 Session Store: Redis (Upstash)
   ```

2. Test the OAuth flow:
   - Navigate to your app
   - Click login
   - Complete QuickBooks authentication
   - Should redirect successfully without "Invalid state token" error

3. Verify sessions persist:
   - After successful login, close browser
   - Open again and navigate to your app
   - Should still be logged in (session persisted in Redis)

---

## Troubleshooting

### ❌ Error: `ENOTFOUND` or `ECONNREFUSED`

**Cause:** Invalid Redis URL or Upstash database not accessible

**Fix:**
1. Double-check `REDIS_URL` in Render.com environment variables
2. Ensure you copied the full URL from Upstash dashboard
3. Verify Upstash database is active (not paused/deleted)

### ❌ Error: `AUTH failed`

**Cause:** Incorrect password in Redis URL

**Fix:**
1. Go to Upstash dashboard
2. Copy the Redis URL again (passwords sometimes get truncated)
3. Update `REDIS_URL` in Render.com

### ❌ Still getting "Invalid state token" error

**Cause:** Session not persisting (Redis connection issue)

**Fix:**
1. Check Render.com logs for Redis connection errors
2. Verify `trust proxy` configuration is present in server.ts:
   ```typescript
   app.set('trust proxy', 1);
   ```
3. Check debug logs show `secure: true` and `oauthState` present

### ⚠️ Warning: Sessions lost on server restart (development)

**Cause:** Not using Redis in development (in-memory sessions)

**Fix:** Set `REDIS_URL` in your local `.env` file if you want persistent sessions locally

---

## Benefits of Redis Over PostgreSQL for Sessions

| Feature | PostgreSQL (Supabase) | Redis (Upstash) |
|---------|----------------------|-----------------|
| **Speed** | ~10-50ms per read | ~1-5ms per read |
| **Purpose** | General database | Session/cache optimized |
| **IPv4 Support (Free)** | ❌ No | ✅ Yes |
| **Connection Overhead** | Higher (connection pooling) | Lower (persistent connection) |
| **Free Tier Limits** | 500MB storage | 256MB storage |
| **Session Expiry** | Manual cleanup needed | Automatic TTL |

---

## Rollback Plan

If you need to rollback to Supabase PostgreSQL:

1. Checkout the previous branch:
   ```bash
   git checkout main
   ```

2. Redeploy to Render.com

**Note:** You'll still have the IPv6 connection issues unless you:
- Upgrade to Supabase Pro (IPv4 support), OR
- Upgrade Render.com plan (IPv6 support)

---

## Next Steps

1. ✅ Create Upstash Redis database
2. ✅ Add `REDIS_URL` to Render.com environment
3. ✅ Deploy and test OAuth flow
4. ✅ Verify sessions persist across browser sessions
5. ✅ Monitor Upstash dashboard for usage (should stay well under free tier limits)

---

## Questions?

- Upstash Docs: https://docs.upstash.com/redis
- connect-redis Docs: https://github.com/tj/connect-redis
- Redis Commands: https://redis.io/commands

**This migration should completely fix your connection timeout and CSRF state token errors!** 🎉
