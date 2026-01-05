# Valiant Picks

A sports betting app for your highschool or whatever you want. I made for my own school feel free to rebrand to whatever you want. I have mine deployed on a local server, but you can host locally or using supabase and cloudflare or anything. Instructions below are AI so I don't know how good they are.

Users create accounts, get virtual money (Valiant Bucks), and place bets on games. Admins manage games and resolve bets.

## Quick Start

### 1. Setup Database
- Create a Supabase project: https://supabase.com
- Open the SQL Editor
- Copy and run everything in `database-setup.sql`

### 2. Setup Environment Variables

Create `server/.env`:
```
PORT=5000
JWT_SECRET=change-this-to-random-text-in-production
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
NODE_ENV=development
```

### 3. Install and Run

```bash
# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start backend (Terminal 1)
npm run dev

# Start frontend (Terminal 2)
npm run client
```

Backend runs at: http://localhost:5000  
Frontend runs at: http://localhost:3000

## Features

**Users:**
- Create account and login
- Start with 1000 Valiant Bucks
- Place bets on games with confidence levels (Low/Medium/High)
- View betting history and leaderboard
- See team information

**Admins:**
- Create and manage games
- Set game results and auto-resolve bets
- Create prop bets
- Manage user accounts

## Technology

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT tokens
- **Hosting:** 
  - Backend: Railway
  - Frontend: Cloudflare Pages

## Project Structure

```
server/          → Backend code (API endpoints)
client/          → Frontend code (React app)
database-setup.sql → Database schema
```

## Need Help?

The app is ready to use. Just follow the Quick Start steps above. For production deployment, change the JWT_SECRET and use HTTPS.
