# Deployment Guide: Supabase + Vercel

## Prerequisites
- GitHub account with your repo
- Supabase account (supabase.com)
- Vercel account (vercel.com)

## Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose PostgreSQL as your database
3. Wait for the database to be created (2-3 minutes)
4. Copy your project URL and anon key from `Settings > API`

### Create Database Schema
1. Go to the SQL Editor in Supabase
2. Create a new query and run the contents of `SUPABASE_SETUP.sql`
3. This will create all necessary tables with Row Level Security policies

### Important: Create Admin User Manually
Since we removed email-based auth, you need to create the admin user manually:

1. In Supabase SQL Editor, run:
```sql
INSERT INTO users (id, username, password, balance, is_admin) 
VALUES ('your-uuid-here', 'admin', 'hashed-password-here', 1000, true);
```

2. For password hashing, use bcryptjs. Run this in Node.js:
```javascript
const bcrypt = require('bcryptjs');
const password = '12345';
const hashedPassword = bcrypt.hashSync(password, 10);
console.log(hashedPassword);
```

3. Copy the output and use it in the SQL above. Generate a UUID from [uuidgenerator.net](https://www.uuidgenerator.net/)

## Step 2: Environment Variables

Create/update `.env` file in the root directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Frontend
REACT_APP_API_URL=https://your-api-domain.com/api

# Server (optional for local dev)
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

Create `.env.local` in the `client` directory:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## Step 3: Update API Routes for Supabase

The server code has been updated to use Supabase instead of SQLite. Key changes:

- `/server/supabase.js` - Supabase client configuration
- `/server/models/User.js` - Updated to use Supabase
- `/server/models/Bet.js` - Updated to use Supabase
- All routes now use Supabase PostgreSQL queries

## Step 4: Deploy Backend to Vercel

Option A: Deploy as Node.js App (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Select your betting-app GitHub repository
4. Configure settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/server.js`
   - **Output Directory**: Leave blank
5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`
6. Deploy!

Option B: Deploy as Serverless Functions (Advanced)

Create `/api/index.js`:
```javascript
const app = require('../server/server');
module.exports = app;
```

Then deploy with serverless configuration.

## Step 5: Deploy Frontend to Vercel

1. In Vercel dashboard, your app should be set up from Step 4
2. The frontend will build automatically as part of the build command
3. Set `REACT_APP_API_URL` environment variable to your Vercel deployment URL

## Step 6: Connect Frontend to Backend

Update `client/src/App.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

The app will automatically use the deployed backend API.

## Step 7: Testing

After deployment:

1. Visit your Vercel URL
2. Register a new account (or use admin account created earlier)
3. Login and test placing bets
4. Use admin credentials (admin/12345) to create games and manage bets

## Troubleshooting

### "Cannot connect to API"
- Check that `REACT_APP_API_URL` is set correctly in Vercel environment variables
- Verify CORS is enabled in your Express server
- Check browser console for network errors

### "Database connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard for service status
- Ensure database schema was created with SUPABASE_SETUP.sql

### "Authentication errors"
- Verify JWT_SECRET is the same on backend and frontend
- Check Supabase Row Level Security policies are enabled
- Make sure admin user was created with correct UUID

## Monitoring

1. **Supabase Dashboard**: Monitor database usage and view logs
2. **Vercel Dashboard**: Monitor function calls, errors, and performance
3. **Real-time Analytics**: Available in both platforms

## Scaling

As your app grows:
- Supabase handles auto-scaling of PostgreSQL
- Vercel scales serverless functions automatically
- Add caching with Vercel's built-in CDN
- Enable database backups in Supabase

## Next Steps

1. Add custom domain to Vercel
2. Set up GitHub branch protection
3. Configure CI/CD for automated testing
4. Add monitoring/alerting
5. Set up database backups in Supabase
