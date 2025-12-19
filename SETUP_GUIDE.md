# Supabase + Vercel Deployment Setup

## What Was Changed

Your betting app has been updated to use **Supabase** (PostgreSQL database) instead of SQLite, making it ready for production deployment on **Vercel**.

### Files Modified:
1. **`package.json`** - Added `@supabase/supabase-js` dependency
2. **`server/supabase.js`** - New Supabase client configuration
3. **`server/models/User.js`** - Updated for Supabase queries
4. **`server/models/Bet.js`** - Updated for Supabase with game relations
5. **`server/models/Game.js`** - Updated for Supabase queries
6. **`server/models/Transaction.js`** - Updated for Supabase queries
7. **`SUPABASE_SETUP.sql`** - Database schema for Supabase (NEW)
8. **`.env.example`** - Environment variables template (UPDATED)
9. **`vercel.json`** - Vercel deployment configuration (NEW)
10. **`DEPLOYMENT.md`** - Detailed deployment guide (NEW)
11. **`QUICKSTART_DEPLOY.md`** - Quick 5-minute setup guide (NEW)

---

## Quick Setup (Do This First!)

### 1. Install Dependencies
```bash
npm install
cd client
npm install
cd ..
```

### 2. Create Supabase Project
- Go to https://supabase.com
- Sign up (free)
- Click "New Project"
- Choose organization, region, password
- Wait ~2-3 minutes for initialization
- Go to **Settings > API**
- Copy `Project URL` and `anon public key`

### 3. Create `.env` File
In the root directory, create a file named `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbG...your-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-key-here
JWT_SECRET=your-random-secret-key-12345
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run Database Schema
- In Supabase, click **SQL Editor**
- Click **New Query**
- Copy entire contents of `SUPABASE_SETUP.sql` into the editor
- Click **Run**
- Verify all tables are created (no red errors)

### 5. Create Admin User
Open terminal and run:
```bash
node
```

In Node shell:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('12345', 10);
console.log(hash);
```

Copy the output (looks like: `$2a$10$...`).

Then in Supabase SQL Editor, run:
```sql
INSERT INTO users (id, username, password, balance, is_admin) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '$2a$10$PASTE_YOUR_HASH_HERE',
  1000,
  true
);
```

Replace `$2a$10$PASTE_YOUR_HASH_HERE` with your actual hash.

### 6. Test Locally
```bash
npm run dev
```

In another terminal:
```bash
cd client
npm start
```

Visit http://localhost:3000
- Register a test account
- Login with admin/12345
- Try placing a bet

---

## Deploy to Vercel (Production)

### Prerequisites:
- GitHub account with your code pushed
- Vercel account (free at vercel.com)
- Supabase project running with schema setup

### Steps:

1. **Push to GitHub**
```bash
git add .
git commit -m "Add Supabase and Vercel deployment"
git push origin main
```

2. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Click "Add New" > "Project"
   - Select your "Betting" repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Select "Other"
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/server.js`
   - **Root Directory**: `./`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = (your anon key)
   SUPABASE_SERVICE_ROLE_KEY = (your service role key)
   JWT_SECRET = your-secret-key
   NODE_ENV = production
   REACT_APP_API_URL = https://your-vercel-app.vercel.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for deployment
   - You should get a URL like: `https://betting-app-abc123.vercel.app`

6. **Update Frontend API URL**
   - Go to Vercel Settings > Environment Variables
   - Update `REACT_APP_API_URL` to your new Vercel URL
   - Redeploy

7. **Test Production**
   - Visit your Vercel URL
   - Register account
   - Try admin login (admin / 12345)
   - Create a game and test bet placement

---

## Troubleshooting

### "Cannot connect to Supabase"
- Check `.env` has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Verify Supabase project is active (check dashboard)
- Tables should exist in SQL Editor

### "Username already exists"
- Might be leftover from local SQLite
- Create new username for testing

### "Invalid token" on admin login
- Verify admin user was created with correct bcrypt hash
- Check JWT_SECRET matches in `.env`

### Vercel deployment fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Make sure package.json has @supabase/supabase-js dependency

### 404 errors on API calls
- Verify `REACT_APP_API_URL` is set to your Vercel domain
- Check CORS is enabled in Express server
- Confirm backend is actually deployed (check Vercel logs)

---

## What's Different Now

### Before (SQLite):
- Database: Local `database.db` file
- Deployment: Complex, requires file persistence
- Scaling: Limited
- Backups: Manual

### After (Supabase):
- Database: PostgreSQL hosted on Supabase
- Deployment: Simple, no file persistence needed
- Scaling: Automatic, handles load
- Backups: Automatic, multiple versions
- Row Level Security: Built-in access control
- Real-time: Optional subscriptions available

---

## Next Steps

1. **Set Custom Domain** (optional)
   - In Vercel Settings > Domains
   - Add your domain (e.g., betting.yoursite.com)

2. **Enable GitHub Integration** (optional)
   - Link Vercel to GitHub
   - Auto-deploy on push to main branch

3. **Add Monitoring** (optional)
   - Vercel: Built-in analytics in dashboard
   - Supabase: Logs tab in SQL editor

4. **Upgrade Plans** (when needed)
   - Supabase: $25-100/month for production
   - Vercel: $20-150/month for production
   - Both have free tiers for small projects

---

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Discord Communities: Supabase & Vercel have active Discord servers

---

**Your app is now production-ready and deployed globally!** 🚀
