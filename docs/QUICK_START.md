# ⚡ Quick Start Guide

Get **School Picks** running in minutes.

## 1. Clone & Install

```bash
git clone https://github.com/yourusername/school-picks.git
cd school-picks
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Or use the automated setup script:

```bash
# Windows
.\setup.ps1

# macOS / Linux
./setup.sh
```

---

## 2. Configure Environment

Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

Fill in your values:

```env
PORT=5000
JWT_SECRET=replace-this-with-a-long-random-string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=development
```

> Find your Supabase URL and key at **Project Settings → API** in your Supabase dashboard.

---

## 3. Set Up the Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor**
3. Paste and run the contents of `database/MASTER_SETUP.sql`
4. All tables, policies, and defaults are created automatically

---

## 4. Run Locally

```bash
# Both servers at once (recommended)
npm run dev

# Or separately:
npm run server   # Terminal 1 — http://localhost:5000
npm run client   # Terminal 2 — http://localhost:3000
```

---

## 5. Create Your Admin Account

1. Register an account through the app UI at `http://localhost:3000`
2. Promote it to admin in Supabase SQL Editor:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'your-admin-email@example.com';
```

---

## 6. Customize Your Branding

| What to change | Where |
|---|---|
| App name | Search & replace `School Picks` across `client/src/` |
| Logo | Replace `client/public/assets/logo.png` |
| Primary color | Edit `--primary-color` in `client/src/App.css` |
| Currency name | Edit `client/src/utils/currency.js` |
| Starting balance | Change the default in `database/MASTER_SETUP.sql` |

---

## 7. Add Your First Game

1. Log in as admin
2. Navigate to the **Admin Panel**
3. Click **Games → Create Game**
4. Fill in teams, date, time, and odds
5. Toggle **Visibility** to make it live for users

---

## Common Admin Tasks

### Resolve a Game
1. Admin Panel → Games → find the game
2. Click **Set Outcome** → pick the winning team
3. All winning bets are paid out automatically

### Adjust a User's Balance
Admin Panel → Users → find the user → **Edit Balance**

### Create a Prop Bet
Admin Panel → Prop Bets → **Create Prop Bet** → set YES/NO odds and expiry

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend won't start | Check `server/.env` values are correct |
| Database errors | Re-run `MASTER_SETUP.sql` in Supabase SQL Editor |
| Frontend blank screen | Confirm backend is running on port 5000 |
| "Not authorized" errors | Confirm your `JWT_SECRET` is set and not empty |

---

## Next Steps

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deploy to Railway + Cloudflare Pages
- **[API.md](API.md)** — Full API reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Add features and contribute back

