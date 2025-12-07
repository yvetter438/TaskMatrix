# Render → Vercel Transition Checklist

This guide helps you run both platforms simultaneously and smoothly transfer your domain.

## ✅ Current Status

- ✅ Code works on both Render and Vercel
- ✅ Render: Running at `taskmatrixx.com` (your current domain)
- ✅ Vercel: Running at `https://task-matrix-psi.vercel.app/`

## 📋 Phase 1: Get Vercel Fully Working

### 1. Set Up Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- `GOOGLE_CLIENT_ID` - Same as Render
- `GOOGLE_CLIENT_SECRET` - Same as Render  
- `SESSION_SECRET` - Same as Render
- `BASE_URL` - Set to `https://task-matrix-psi.vercel.app` (for now)
- `REDIS_URL` - **IMPORTANT**: Set up Vercel KV or use external Redis
- `NODE_ENV` - Set to `production`

### 2. Set Up Redis on Vercel

**Option A: Vercel KV (Recommended)**
1. Vercel Dashboard → Your Project → **Storage** tab
2. Click **Create Database** → Select **KV**
3. Copy the connection string
4. Set `REDIS_URL` environment variable

**Option B: Reuse Render's Redis**
- If your Render Redis is publicly accessible, you can use the same `REDIS_URL`
- This allows both platforms to share sessions (optional)

### 3. Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add Vercel redirect URI:
   - `https://task-matrix-psi.vercel.app/auth/google/callback`
   - `https://task-matrix-*.vercel.app/auth/google/callback` (for previews)

**Keep Render's URI too** (for now):
- `https://taskmatrixx.com/auth/google/callback`

### 4. Test Vercel Deployment

1. Test login flow on Vercel
2. Test task creation/editing
3. Test session persistence (refresh page)
4. Verify everything works

## 📋 Phase 2: Domain Transfer Preparation

### 1. Get Your Domain Ready

- Your domain: `taskmatrixx.com`
- Currently pointing to: Render
- Will point to: Vercel

### 2. Add Domain to Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `taskmatrixx.com`
4. Vercel will show you DNS records to update

### 3. Update DNS Records

**Before changing DNS:**
- Note down current DNS settings (in case you need to rollback)
- Vercel will provide new DNS records

**DNS Records to Update:**
- Update A/CNAME records as Vercel instructs
- This will point your domain to Vercel instead of Render

**Important:** DNS changes can take 24-48 hours to propagate globally

## 📋 Phase 3: Domain Transfer (The Switch)

### 1. Update BASE_URL in Vercel

Once DNS is pointing to Vercel:
- Update `BASE_URL` in Vercel to `https://taskmatrixx.com`

### 2. Update Google OAuth (Final)

1. Google Cloud Console → OAuth Credentials
2. Remove Render redirect URI (optional, can keep both)
3. Ensure Vercel URI is there: `https://taskmatrixx.com/auth/google/callback`

### 3. Monitor Both Platforms

- **Vercel**: Should be receiving traffic via `taskmatrixx.com`
- **Render**: Still running but not receiving traffic (backup)

### 4. Test Everything on New Domain

- ✅ Login flow
- ✅ Task operations
- ✅ Session persistence
- ✅ All features

## 📋 Phase 4: Cleanup (After Confirming Vercel Works)

### 1. Wait 1-2 Weeks

- Ensure Vercel is stable
- Monitor for any issues
- Keep Render as backup

### 2. Remove Render Redirect URI (Optional)

- Google Cloud Console → Remove Render callback
- Or keep it for emergency rollback

### 3. Shut Down Render (When Ready)

- Render Dashboard → Your Service → **Settings** → **Delete Service**
- Or just pause it (can restart if needed)

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

1. **Quick Rollback:**
   - Revert DNS records back to Render
   - DNS propagation: 24-48 hours

2. **Emergency Rollback:**
   - Render is still running
   - Just update DNS back
   - Update `BASE_URL` in Render if needed

## 📊 Running Both Simultaneously

### Current Setup:
- **Render**: `taskmatrixx.com` (production domain)
- **Vercel**: `task-matrix-psi.vercel.app` (testing)

### Both Use:
- Same Google OAuth credentials ✅
- Same Redis (if you share it) ✅
- Same codebase ✅

### Differences:
- Different `BASE_URL` (domain-specific)
- Different deployment platforms
- Sessions are separate (unless sharing Redis)

## ⚠️ Important Notes

1. **Sessions Don't Transfer**
   - Users logged into Render won't be logged into Vercel
   - They'll need to log in again after domain switch
   - This is normal and expected

2. **DNS Propagation Time**
   - Can take 24-48 hours globally
   - Some users might still hit Render during transition
   - Both platforms will work during this time

3. **Test Thoroughly**
   - Test Vercel extensively before switching DNS
   - Keep Render running as backup
   - Monitor both platforms during transition

## ✅ Success Criteria

Before shutting down Render:
- [ ] Vercel fully tested and working
- [ ] Domain successfully transferred
- [ ] All features working on Vercel
- [ ] No critical issues for 1-2 weeks
- [ ] DNS fully propagated

## 🎯 Quick Reference

**Render (Current):**
- URL: `https://taskmatrixx.com`
- Status: Production (keep running)

**Vercel (New):**
- URL: `https://task-matrix-psi.vercel.app` (testing)
- Future URL: `https://taskmatrixx.com` (after DNS switch)

**Next Steps:**
1. ✅ Get Vercel working (set up Redis, env vars)
2. ⏳ Test Vercel thoroughly
3. ⏳ Add domain to Vercel
4. ⏳ Update DNS records
5. ⏳ Monitor and verify
6. ⏳ Shut down Render (when ready)


