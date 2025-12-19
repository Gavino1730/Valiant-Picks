# 🎯 NEXT STEPS - READ THIS FIRST!

Your app is **fully configured for Supabase + Vercel**. Here's exactly what to do next:

## Step 1: Install @supabase/supabase-js (2 minutes)

```bash
npm install
```

This installs the Supabase dependency.

## Step 2: Create Supabase Account (3 minutes)

1. Go to **https://supabase.com**
2. Click **"Sign Up"**
3. Create account (use GitHub is easiest)
4. Create new project:
   - Name: `betting-app` (or anything)
   - Region: Choose closest to you
   - Password: Save this somewhere safe
5. Wait 2-3 minutes for initialization
6. When done, go to **Settings > API** on the left
7. **COPY these two values:**
   - `Project URL` (looks like: `https://abcd1234.supabase.co`)
   - `anon public key` (long string starting with `eyJ...`)

**Keep this page open, you'll need these in Step 4**

## Step 3: Create Database Schema (3 minutes)

1. In Supabase, click **"SQL Editor"** on the left
2. Click **"New Query"** button
3. **Open the file: `SUPABASE_SETUP.sql`** in VS Code
4. **Copy all the contents** (Ctrl+A, Ctrl+C)
5. **Paste into Supabase SQL Editor** (Ctrl+V)
6. Click **"Run"** button (should be green)
7. **Wait for it to complete** - You should see "Success" with no red errors
8. If you see errors, post them to the Supabase Discord

## Step 4: Create .env File (2 minutes)

1. In your project root, open `.env.example`
2. Copy the entire contents
3. Create new file: `.env` (same folder as package.json)
4. Paste the contents
5. Fill in the values:

```env
# From Supabase Settings > API (copy from browser)
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJ...YOUR_ANON_KEY

# From Supabase Settings > API (copy from browser) - look for "Service role key"
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR_SERVICE_KEY

# Create a random string (anything you want)
JWT_SECRET=my-super-secret-key-12345

# Keep these as-is for local development
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
```

**Important:**
- Keep `.env` file **secret** (never share it)
- `.gitignore` should already prevent it from being committed

## Step 5: Create Admin User (3 minutes)

1. Open terminal in VS Code
2. Run:
```bash
node
```

3. Paste this (one line at a time):
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('12345', 10);
console.log(hash);
```

4. **Copy the output** (will look like: `$2a$10$...`)
5. Exit Node:
```javascript
.exit
```

6. Go back to **Supabase > SQL Editor**
7. Click "New Query"
8. Paste this (replace the HASH part with what you just copied):

```sql
INSERT INTO users (id, username, password, balance, is_admin) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '$2a$10$PASTE_THE_HASH_YOU_COPIED_HERE',
  1000,
  true
);
```

9. Click **"Run"**
10. You should see "1 row affected"

✅ **Admin account created!** (username: `admin`, password: `12345`)

## Step 6: Test Locally (2 minutes)

1. **Terminal 1 - Start backend:**
```bash
npm run dev
```

You should see: `Server running on port 5000` ✅

2. **Terminal 2 - Start frontend:**
```bash
cd client
npm start
```

React should open at http://localhost:3000

3. **Test the app:**
   - Register a new account with any username/password
   - Login
   - Try placing a bet (you have 1000 Valiant Bucks)
   - Logout
   - Login as admin: `admin` / `12345`
   - Try admin features

**If everything works → Go to Step 7!**

## Step 7: Deploy to Vercel (5 minutes)

### 7a. Push code to GitHub
```bash
git add .
git commit -m "Add Supabase and Vercel deployment"
git push origin main
```

(Or `master` if that's your default branch)

### 7b. Go to Vercel

1. Go to **https://vercel.com**
2. Sign up if needed (use GitHub)
3. Click **"Add New" > "Project"**
4. Select your **"Betting"** repository
5. Click **"Import"**

### 7c. Configure Build Settings

1. **Framework**: Select **"Other"**
2. **Build Command**: Keep as-is (or paste):
   ```
   npm install && cd client && npm install && npm run build
   ```
3. **Start Command**: Keep as-is (or paste):
   ```
   node server/server.js
   ```
4. **Output Directory**: Leave blank

### 7d. Add Environment Variables

Click **"Environment Variables"** and add **each one:**

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` (from Supabase) |
| `SUPABASE_ANON_KEY` | Your anon key (from Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (from Supabase) |
| `JWT_SECRET` | Same as in your .env |
| `NODE_ENV` | `production` |
| `REACT_APP_API_URL` | Leave blank for now, update after deploy |

### 7e. Deploy!

Click **"Deploy"** button and **WAIT 3-5 MINUTES**

You'll see a URL like: `https://betting-app-abc123.vercel.app`

## Step 8: Update Frontend URL (1 minute)

1. Copy your new Vercel URL from the deployment page
2. Go to Vercel **Settings > Environment Variables**
3. Find `REACT_APP_API_URL` 
4. Update it to: `https://betting-app-abc123.vercel.app/api` (use your actual URL)
5. Click "Save"
6. Go to **Deployments** and click **"Redeploy"**
7. Wait ~2 minutes for redeployment

## Step 9: Test Production App (2 minutes)

1. Visit your Vercel URL (e.g., `https://betting-app-abc123.vercel.app`)
2. Should look like your local app
3. Try:
   - Register new account
   - Login as admin / 12345
   - Create a game (in admin panel)
   - Place a bet on the game
   - Check your balance updated

**✅ You're live!** 🎉

---

## If Anything Goes Wrong

### "Cannot find module @supabase/supabase-js"
```bash
npm install
npm install @supabase/supabase-js
```

### "Port 5000 already in use"
```bash
# Kill the process:
# Windows: Get-Process node | Stop-Process -Force
# Mac/Linux: pkill -f "node"
```

### Supabase errors in Vercel
- Check environment variables are exactly right
- Check `.env` is NOT in .gitignore (it should be)
- Click "Redeploy" to try again

### App works locally but not on Vercel
- Check `REACT_APP_API_URL` is set correctly
- Check backend API endpoint in browser dev tools (F12 > Network)
- Check Vercel function logs: go to Vercel dashboard > Deployments > latest

### "Username already exists"
- Try a different username (your first local SQLite data won't carry over)

---

## Success Checklist

- [ ] Supabase account created
- [ ] `.env` file created with values
- [ ] Database schema created (SUPABASE_SETUP.sql run)
- [ ] Admin user created manually
- [ ] App works locally (localhost:3000)
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Production app works (vercel.app URL)

---

**You're done! Your app is now live and accessible to the world!** 🌍

For additional help, see:
- `SETUP_GUIDE.md` - Detailed explanations
- `QUICKSTART_DEPLOY.md` - Alternative quick guide
- `DEPLOYMENT.md` - Troubleshooting
