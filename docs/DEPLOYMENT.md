# Deployment Guide

Complete guide to deploying School Picks to production.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Cloudflare Pages)](#frontend-deployment-cloudflare-pages)
- [Custom Domain Setup](#custom-domain-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)
- [Alternative Deployment Options](#alternative-deployment-options)

---

## Overview

**Recommended Production Stack:**
- **Frontend**: Cloudflare Pages (Free tier, automatic SSL)
- **Backend**: Railway ($5/month, automatic SSL)
- **Database**: Supabase (Free tier with 500MB storage)
- **Domain**: Custom domain (optional, ~$12/year)

**Estimated Monthly Cost:** $5-10 (depending on usage)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account (for code hosting)
- [ ] Supabase account (for database)
- [ ] Railway account (for backend hosting)
- [ ] Cloudflare account (for frontend hosting)
- [ ] Domain name (optional but recommended)
- [ ] Production-ready code committed to GitHub

---

## Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose organization or create new one
4. Configure project:
   - **Name**: school-picks-prod (or whatever you like)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for most schools

### Step 2: Run Database Setup

1. Open **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy entire contents of `database/database-setup.sql`
4. Click **Run** to execute
5. Verify tables created in **Table Editor**

### Step 3: Get Connection Details

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (keep secret!)
   ```

### Step 4: Security Configuration

1. Go to **Authentication** → **Settings**
2. Disable email confirmations (we use JWT, not Supabase Auth)
3. Go to **Database** → **Roles**
4. Verify RLS policies are active

### Step 5: Create Admin User

After deployment, you'll need to:
1. Register account through your app
2. Run this SQL in Supabase:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin@email.com';
```

---

## Backend Deployment (Railway)

### Step 1: Prepare Repository

1. Ensure `server/.env` is in `.gitignore` (it should be)
2. Commit all changes to GitHub
3. Push to your repository

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your `school-picks` repository

### Step 3: Configure Railway Service

1. Railway will detect Node.js automatically
2. Click on your service
3. Go to **Settings**:
   - **Service Name**: school-picks-api
   - **Root Directory**: `server`
   - **Start Command**: `node server.js`
   - **Watch Paths**: `server/**`

### Step 4: Set Environment Variables

1. Go to **Variables** tab
2. Add these variables:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate-strong-random-string-here>
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Generate JWT_SECRET:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64
```

### Step 5: Deploy

1. Railway will automatically deploy
2. Monitor deployment in **Deployments** tab
3. Check logs for any errors
4. Once deployed, copy your Railway URL:
   ```
   https://school-picks-api.railway.app
   ```

### Step 6: Configure CORS

1. In `server/server.js`, update CORS configuration:
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-domain.com',
    'https://your-pages-project.pages.dev'
  ],
  credentials: true
}));
```

2. Commit and push changes
3. Railway will auto-redeploy

---

## Frontend Deployment (Cloudflare Pages)

### Step 1: Prepare Frontend

1. Update API URL in `client/src/utils/axios.js`:
```javascript
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://school-picks-api.railway.app/api',
  withCredentials: true,
});
```

2. Create `client/.env.production`:
```env
REACT_APP_API_URL=https://school-picks-api.railway.app/api
```

3. Commit changes and push to GitHub

### Step 2: Build Locally (Test)

```bash
cd client
npm run build
# Test the build
npx serve -s build
```

Verify everything works at `http://localhost:3000`

### Step 3: Create Cloudflare Pages Project

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **Workers & Pages** → **Create application** → **Pages**
3. Connect to GitHub
4. Select your `school-picks` repository
5. Configure build:
   - **Project name**: school-picks
   - **Production branch**: main
   - **Framework preset**: Create React App
   - **Build command**: `cd client && npm install && npm run build`
   - **Build output directory**: `client/build`

### Step 4: Environment Variables

1. In Cloudflare Pages project settings
2. Go to **Settings** → **Environment variables**
3. Add for **Production**:
```
REACT_APP_API_URL=https://school-picks-api.railway.app/api
```

### Step 5: Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (3-5 minutes)
3. You'll get a URL like: `https://school-picks.pages.dev`
4. Test your application!

### Step 6: Configure Headers

Create `client/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Create `client/public/_redirects`:
```
/*    /index.html   200
```

---

## Custom Domain Setup

### Option 1: Domain on Cloudflare

1. Buy domain through Cloudflare Registrar
2. In Pages project → **Custom domains** → **Set up a custom domain**
3. Enter your domain: `your-domain.com`
4. Cloudflare will automatically configure DNS
5. SSL certificate is automatic and free

### Option 2: External Domain

1. Add domain to Cloudflare (free)
2. Update nameservers at your registrar
3. In Pages project → **Custom domains** → add domain
4. Follow Cloudflare instructions for DNS setup

### Backend Domain (Optional)

To use custom domain for API (e.g., `api.your-domain.com`):

1. In Railway project → **Settings** → **Domains**
2. Add custom domain
3. Add CNAME record in Cloudflare DNS:
   ```
   api.your-domain.com -> your-project.railway.app
   ```
4. Update frontend API URL to `https://api.your-domain.com`

---

## Environment Variables

### Complete Reference

**Backend (Railway):**
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<64-char-random-hex-string>
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

**Frontend (Cloudflare Pages):**
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

### Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use different JWT secrets for dev/prod
- ✅ Rotate secrets every 90 days
- ✅ Store secrets in password manager
- ✅ Use environment variables, not hardcoded values

---

## Post-Deployment

### 1. Create Admin Account

1. Visit your deployed site
2. Register a new account
3. In Supabase SQL Editor:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

### 2. Test All Features

- [ ] User registration and login
- [ ] Placing bets
- [ ] Admin panel access
- [ ] Creating games
- [ ] Setting game outcomes
- [ ] Leaderboard updates
- [ ] Mobile responsiveness

### 3. Seed Initial Data

1. Login as admin
2. Create teams
3. Add initial games
4. Test bet resolution flow

### 4. Monitor First Week

- Check Railway logs daily
- Monitor Supabase database usage
- Test from multiple devices
- Gather user feedback

---

## Monitoring & Maintenance

### Railway Monitoring

1. **Logs**: Railway dashboard → Deployments → View logs
2. **Metrics**: Monitor CPU, memory, network usage
3. **Alerts**: Set up deployment failure notifications

### Supabase Monitoring

1. **Database**: Monitor storage, active connections
2. **API**: Check request count, error rate
3. **Logs**: Review query logs for slow queries

### Cloudflare Analytics

1. **Page views**: Track user engagement
2. **Performance**: Monitor load times
3. **Security**: Check for threats/attacks

### Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review database performance
- **Quarterly**: Update dependencies, security patches
- **Yearly**: Rotate JWT secret

---

## Troubleshooting

### Frontend Shows "Network Error"

**Problem**: Can't connect to backend  
**Solutions**:
1. Check API URL in browser console
2. Verify CORS settings in backend
3. Check Railway deployment status
4. Test API directly: `curl https://your-api.railway.app/api/health`

### Backend Crashes on Startup

**Problem**: Railway deployment fails  
**Solutions**:
1. Check Railway logs for error message
2. Verify all environment variables are set
3. Check package.json scripts
4. Test locally with production env vars

### Database Connection Fails

**Problem**: Can't connect to Supabase  
**Solutions**:
1. Verify Supabase URL and key
2. Check Supabase project status
3. Verify IP allowlist (should be disabled for serverless)
4. Test connection with Supabase client tool

### CORS Errors

**Problem**: "Blocked by CORS policy"  
**Solutions**:
1. Add frontend domain to CORS whitelist
2. Ensure `credentials: true` in axios config
3. Verify backend CORS middleware configuration
4. Check for trailing slashes in URLs

### Users Can't Login

**Problem**: Login fails after deployment  
**Solutions**:
1. Verify JWT_SECRET is set correctly
2. Check password hashing is working
3. Test API endpoint directly
4. Check browser console for errors
5. Verify database user table has data

### High Database Usage

**Problem**: Approaching Supabase free tier limits  
**Solutions**:
1. Review and optimize queries
2. Add database indexes
3. Implement query result caching
4. Consider upgrading Supabase plan
5. Archive old completed games/bets

---

## Alternative Deployment Options

### Vercel (Frontend)

**Pros**: Easy deployment, good performance  
**Cons**: More expensive than Cloudflare for static sites

```bash
npm i -g vercel
cd client
vercel --prod
```

### Heroku (Backend)

**Pros**: Simple deployment, good documentation  
**Cons**: More expensive than Railway, slower cold starts

Create `Procfile` in root:
```
web: cd server && node server.js
```

Deploy:
```bash
heroku create school-picks-api
git push heroku main
```

### DigitalOcean App Platform

**Pros**: Fixed pricing, good for scaling  
**Cons**: More expensive for small projects

### Self-Hosted (VPS)

**Pros**: Full control, potentially cheaper at scale  
**Cons**: Requires DevOps knowledge, maintenance burden

Recommended for:
- Schools with IT departments
- Projects with specific compliance needs
- Very high traffic (1000+ concurrent users)

---

## SSL/HTTPS Configuration

Both Railway and Cloudflare Pages provide automatic SSL certificates.

**Verify HTTPS is working:**
1. Visit your site with `https://`
2. Check for padlock icon in browser
3. Run SSL test: https://www.ssllabs.com/ssltest/

**Force HTTPS in backend:**
```javascript
// server/server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## Backup Strategy

### Database Backups (Supabase)

**Automatic**: Supabase provides automatic daily backups (free tier: 7 days)

**Manual Backup**:
1. Go to Supabase → Database → Backups
2. Click **Create backup**
3. Download backup SQL file

**Backup Schedule**:
- Daily automatic (Supabase handles this)
- Weekly manual backup (download to local storage)
- Before major changes (manual)

### Code Backups

- Use Git tags for releases
- Create GitHub releases
- Keep production branches protected

---

## Scaling Considerations

### When to Scale

Upgrade when experiencing:
- Slow page loads (>3 seconds)
- Database connection errors
- Railway memory/CPU limits
- Supabase storage/bandwidth limits

### Scaling Options

**Database (Supabase)**:
- Free: 500 MB storage, 2 GB bandwidth
- Pro ($25/mo): 8 GB storage, 50 GB bandwidth
- Add indexes for large tables
- Implement caching

**Backend (Railway)**:
- Hobby: $5/mo (512 MB RAM)
- Pro: $20/mo (2 GB RAM)
- Enable auto-scaling
- Add Redis for session storage

**Frontend (Cloudflare Pages)**:
- Free tier handles massive traffic
- Consider Cloudflare CDN optimization
- Implement service worker caching

---

## Security Checklist

Before going live:

- [ ] Changed default JWT_SECRET
- [ ] Enabled HTTPS everywhere
- [ ] Configured CORS properly
- [ ] Sanitized all user inputs
- [ ] Set secure password requirements
- [ ] Enabled Supabase RLS policies
- [ ] Removed debug/console.log statements
- [ ] Set up error logging (not console)
- [ ] Implemented rate limiting
- [ ] Reviewed all admin-only endpoints
- [ ] Set up monitoring/alerts
- [ ] Configured CSP headers
- [ ] Disabled directory listing
- [ ] Set secure cookie flags

---

## Launch Checklist

Final steps before announcing:

- [ ] All tests passing
- [ ] Admin account created and tested
- [ ] Sample games/teams created
- [ ] Mobile tested on iOS and Android
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Error handling working correctly
- [ ] Leaderboard displaying properly
- [ ] Email admin credentials to yourself
- [ ] Document admin procedures
- [ ] Set up monitoring alerts
- [ ] Prepare user onboarding instructions
- [ ] Create social media graphics
- [ ] Write launch announcement

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: https://github.com/yourusername/school-picks/issues

---

**Congratulations!** 🎉 Your School Picks platform is now live!

Remember to:
- Monitor logs regularly
- Keep dependencies updated
- Backup database weekly
- Collect user feedback
- Iterate and improve

Good luck with your launch! 🚀
