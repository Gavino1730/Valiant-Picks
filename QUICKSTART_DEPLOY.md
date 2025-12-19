# Quick Start: Deploy to Supabase + Vercel

## 1. Create Supabase Project (5 minutes)
- Go to https://supabase.com
- Click "New Project"
- Choose your region
- Set a strong database password
- Wait for it to initialize
- Go to Settings > API
- Copy your `URL` and `anon key`

## 2. Create Database Schema (2 minutes)
- In Supabase, click "SQL Editor"
- Click "New Query"
- Copy and paste entire contents of `SUPABASE_SETUP.sql`
- Click "Run"
- Verify no errors

## 3. Create Admin User (1 minute)
Open a Node terminal and run:
```bash
cd Betting
node
```

Then in Node:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('12345', 10);
console.log(hash);
```

Copy the output. Then in Supabase SQL Editor run:
```sql
INSERT INTO users (id, username, password, balance, is_admin) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'PASTE_HASH_HERE', 1000, true);
```

## 4. Set Up Environment Variables
Create `.env` in root directory:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-12345
NODE_ENV=production
REACT_APP_API_URL=https://your-vercel-domain.com/api
```

## 5. Push to GitHub
```bash
git add .
git commit -m "Add Supabase and Vercel deployment"
git push
```

## 6. Deploy Backend to Vercel (5 minutes)
- Go to https://vercel.com
- Click "Add New..." > "Project"
- Select your betting-app repository
- Add environment variables (copy from .env file)
- Click "Deploy"
- Wait ~2-3 minutes for deployment
- Copy your deployment URL (e.g., https://betting-app-123.vercel.app)

## 7. Update Frontend API URL
In Vercel project settings:
- Go to Settings > Environment Variables
- Add: `REACT_APP_API_URL` = `https://your-vercel-domain.com/api`
- Redeploy

## 8. Test Your App
- Visit your Vercel URL
- Register a new account
- Try placing a bet
- Login as admin (username: admin, password: 12345)
- Create a game from admin panel

## 9. Add Custom Domain (Optional)
In Vercel:
- Settings > Domains
- Add your domain (e.g., betting.yoursite.com)
- Follow DNS instructions from your domain provider

---

**Need Help?**
- Check DEPLOYMENT.md for detailed troubleshooting
- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
