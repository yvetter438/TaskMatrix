# Migration Guide: Render → Vercel

This guide will help you migrate your Task Matrix app from Render to Vercel.

## ✅ What's Already Done

- ✅ Server.js updated for Vercel serverless
- ✅ API route structure created (`api/index.js`)
- ✅ Vercel configuration file (`vercel.json`)

## 📋 Step-by-Step Migration

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Your Project

```bash
vercel link
```

This will:
- Ask you to create a new project or link to existing
- Set up `.vercel` directory with project settings

### 4. Set Up Environment Variables

You need to migrate all environment variables from Render to Vercel:

#### Required Environment Variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Session
SESSION_SECRET=your_random_session_secret

# Base URL (update to your Vercel domain)
BASE_URL=https://your-project.vercel.app

# Redis (if using external Redis)
REDIS_URL=your_redis_url

# Node Environment
NODE_ENV=production
```

#### Option A: Set via Vercel Dashboard
1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development**

#### Option B: Set via CLI
```bash
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add SESSION_SECRET
vercel env add BASE_URL
vercel env add REDIS_URL
vercel env add NODE_ENV
```

### 5. Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel URL to **Authorized redirect URIs**:
   - `https://your-project.vercel.app/auth/google/callback`
   - `https://your-project-*.vercel.app/auth/google/callback` (for preview deployments)

### 6. Set Up Redis (Choose One)

#### Option A: Vercel KV (Recommended for Vercel)
Vercel offers a built-in Redis-compatible key-value store:

1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click **Create Database** → Select **KV**
3. Copy the connection string
4. Set `REDIS_URL` environment variable to this connection string

#### Option B: External Redis (Upstash, Redis Cloud, etc.)
- Use your existing Redis URL
- Make sure it's accessible from Vercel's serverless functions
- Update `REDIS_URL` environment variable

### 7. Deploy to Vercel

#### First Deployment
```bash
vercel --prod
```

#### Future Deployments
Vercel will auto-deploy on git push if connected to your repo, or:
```bash
vercel --prod
```

### 8. Update Your Domain (Optional)

If you have a custom domain:
1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `BASE_URL` environment variable

## 🔍 Differences: Render vs Vercel

| Feature | Render | Vercel |
|---------|--------|--------|
| **Deployment** | Git push or manual | Git push (auto) or CLI |
| **Server Type** | Long-running process | Serverless functions |
| **Sessions** | FileStore (local) or Redis | Redis only (no file system) |
| **Environment** | Dashboard or `.env` | Dashboard or CLI |
| **Scaling** | Manual | Automatic |
| **Cold Starts** | None | Possible (first request) |

## ⚠️ Important Notes

### Session Storage
- **FileStore won't work on Vercel** (no persistent file system)
- **Must use Redis** for sessions in production
- Local development still uses FileStore

### Cold Starts
- First request after inactivity may be slower (~1-2 seconds)
- Subsequent requests are fast
- Redis connection is reused across invocations

### Function Timeout
- Vercel free tier: 10 seconds
- Vercel Pro: 60 seconds
- Your app should complete most requests well within this

### Environment Variables
- Update `BASE_URL` to your Vercel domain
- Make sure all secrets are set in Vercel dashboard

## 🧪 Testing Locally

Test your Vercel setup locally:

```bash
vercel dev
```

This will:
- Simulate Vercel's serverless environment
- Use environment variables from `.vercel/.env.local`
- Run on `http://localhost:3000`

## 🐛 Troubleshooting

### Issue: Sessions not persisting
- **Solution**: Ensure `REDIS_URL` is set and Redis is accessible
- Check Vercel logs for Redis connection errors

### Issue: OAuth redirect not working
- **Solution**: Update Google OAuth redirect URIs to include Vercel domain
- Check `BASE_URL` environment variable

### Issue: Cold start timeouts
- **Solution**: Optimize Redis connection (already done - connection is reused)
- Consider upgrading to Vercel Pro for longer timeouts

### Issue: Static files not loading
- **Solution**: Check `vercel.json` routes configuration
- Ensure `/public` route is correctly configured

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)

## ✅ Post-Migration Checklist

- [ ] All environment variables migrated
- [ ] Google OAuth redirect URIs updated
- [ ] Redis configured and accessible
- [ ] First deployment successful
- [ ] Test login flow
- [ ] Test task creation/editing
- [ ] Test session persistence (refresh page)
- [ ] Custom domain configured (if applicable)
- [ ] Remove Render deployment (optional)

## 🎉 You're Done!

Your app should now be running on Vercel. The migration maintains all functionality while gaining:
- Automatic scaling
- Global CDN
- Better performance
- Free tier with generous limits


