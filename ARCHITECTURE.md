# 📊 System Architecture Overview

## Your Betting App - Before vs After

### BEFORE (Local SQLite)
```
┌─────────────────────────────────────┐
│  Your Computer                      │
├─────────────────────────────────────┤
│                                     │
│  Frontend: React (localhost:3000)  │
│       ↕                             │
│  Backend: Express (localhost:5000) │
│       ↕                             │
│  Database: SQLite (database.db)    │
│                                     │
│  Problems:                          │
│  • Can't share with friends        │
│  • No backups                       │
│  • Slow                             │
│  • Can't scale                      │
└─────────────────────────────────────┘
```

### AFTER (Supabase + Vercel)
```
┌──────────────────────────────────────────────────────────────────┐
│  GLOBAL INTERNET                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User's Browser (anywhere in the world)                         │
│         ↕ HTTPS (secure)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Vercel CDN (Global)                                        │ │
│  │ - Frontend: React (built & deployed)                       │ │
│  │ - Backend: Express.js (running as functions)              │ │
│  │ URL: https://betting-app-abc.vercel.app                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↕ Secure connection                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Supabase (PostgreSQL Database)                             │ │
│  │ - Users table                                              │ │
│  │ - Games table                                              │ │
│  │ - Bets table                                               │ │
│  │ - Transactions table                                       │ │
│  │ - Row Level Security (RLS)                                │ │
│  │ - Automatic backups                                        │ │
│  │ - Auto-scaling                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Benefits:                                                       │
│  ✅ Accessible from anywhere                                    │
│  ✅ Auto-scaling to handle traffic                             │
│  ✅ Automatic daily backups                                    │
│  ✅ 99.99% uptime SLA                                          │
│  ✅ Global CDN (fast everywhere)                               │
│  ✅ Secure with HTTPS                                          │
│  ✅ Row-level access control                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Placing a Bet (User Perspective)
```
1. User clicks "Place Bet" on betting-app-xyz.vercel.app
2. Frontend (React) sends POST to /api/bets
3. Vercel routes to Express backend
4. Backend validates:
   - User has enough balance ✓
   - Game exists ✓
   - Bet amount is positive ✓
5. Backend creates bet in Supabase
6. Backend deducts from user balance
7. Backend creates transaction record
8. Frontend receives response
9. Frontend updates UI with new balance
10. Bet appears in "My Bets" list
```

### Admin Creating a Game
```
1. Admin logs in with admin/12345
2. Admin clicks "Create Game" in admin panel
3. Admin fills in:
   - Team (Men's or Women's Basketball)
   - Home Team (e.g., "VC Men")
   - Date & Time
   - Winning Odds (e.g., 1.5x)
   - Losing Odds (e.g., 2.0x)
   - Spread, Over/Under (optional)
4. Frontend sends to /api/games (admin only)
5. Backend validates user is admin
6. Backend creates game in Supabase
7. Game appears in games list for all users
8. Users can now place bets on this game
```

### Settling a Bet
```
1. Admin goes to admin panel > "Manage Bets"
2. Admin sees all pending bets
3. Admin clicks bet and selects "Won" or "Lost"
4. Backend updates bet status & outcome
5. If "Won":
   - Calculate winnings = bet_amount × odds
   - Add to user's balance
   - Create transaction record
6. User's balance updates immediately
7. Bet shows as "Won" or "Lost" in their history
```

## Database Schema (Supabase PostgreSQL)

```sql
USERS TABLE
├── id (UUID) ← Primary Key
├── username (TEXT) 
├── password (TEXT) ← bcrypted
├── balance (REAL) ← Valiant Bucks
├── is_admin (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

GAMES TABLE
├── id (BIGINT) ← Primary Key
├── team_type (TEXT) ← "Mens" or "Womens"
├── home_team (TEXT)
├── away_team (TEXT)
├── game_date (TEXT)
├── game_time (TEXT)
├── location (TEXT)
├── status (TEXT) ← "upcoming", "completed"
├── winning_odds (REAL)
├── losing_odds (REAL)
├── spread (REAL) ← Optional spread betting
├── spread_odds (REAL)
├── over_under (REAL)
├── over_odds (REAL)
├── under_odds (REAL)
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

BETS TABLE
├── id (BIGINT) ← Primary Key
├── user_id (UUID) ← Foreign Key → users.id
├── game_id (BIGINT) ← Foreign Key → games.id
├── bet_type (TEXT) ← "moneyline", "spread", "over-under"
├── selected_team (TEXT) ← Which team they bet on
├── amount (REAL) ← How much they wagered
├── odds (REAL) ← Payout odds
├── status (TEXT) ← "pending", "resolved"
├── outcome (TEXT) ← "won", "lost", NULL
├── potential_win (REAL) ← amount × odds
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

TRANSACTIONS TABLE
├── id (BIGINT) ← Primary Key
├── user_id (UUID) ← Foreign Key → users.id
├── type (TEXT) ← "bet", "win", "admin_credit"
├── amount (REAL)
├── description (TEXT)
├── status (TEXT) ← "completed", "pending"
└── created_at (TIMESTAMP)

ADMIN_LOGS TABLE
├── id (BIGINT) ← Primary Key
├── admin_id (UUID) ← Foreign Key → users.id
├── action (TEXT) ← What admin did
├── details (TEXT)
└── created_at (TIMESTAMP)
```

## Technology Stack

```
FRONTEND
├── React 18
├── Axios (HTTP client)
├── CSS3 (custom styling)
└── No build: JSX compiled at runtime

BACKEND
├── Node.js
├── Express.js (REST API)
├── bcryptjs (password hashing)
├── jsonwebtoken (JWT auth)
└── @supabase/supabase-js (database client)

DATABASE
├── PostgreSQL (Supabase)
├── Row Level Security (RLS)
├── Automatic backups
└── Real-time subscriptions available

DEPLOYMENT
├── Vercel (Frontend + Backend)
├── Supabase (Database)
├── GitHub (Source control)
└── HTTPS/TLS (encrypted)
```

## Traffic Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER VISITS https://betting-app-xyz.vercel.app             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │ Vercel Global CDN            │
        │ (serves static files quickly)│
        │ ← HTML/CSS/JS loaded          │
        └──────────────────┬───────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ React App Initializes in Browser    │
        │ ← User can see login screen         │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ User Login Request                   │
        │ POST /api/auth/login                │
        │ {username, password}                │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ Vercel Routes to Backend (Express)  │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ Backend queries Supabase            │
        │ SELECT * FROM users WHERE ...       │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ Supabase checks Row Level Security  │
        │ & returns user data                 │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ Backend validates password          │
        │ & returns JWT token                 │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────↓──────────────────┐
        │ React stores JWT in localStorage    │
        │ & redirects to dashboard            │
        │ ← User logged in! ✅                │
        └──────────────────────────────────────┘
```

## Scaling Plan

### Current (Free Tier)
- Vercel: 100GB/month data
- Supabase: 500MB database
- Handle: ~10,000 users

### Growing (Paid Tier)
- Vercel Pro: $20/month
- Supabase: $25/month
- Handle: ~100,000 users

### Production (Enterprise)
- Vercel: Enterprise plan
- Supabase: Enterprise plan
- Handle: Millions of users

All scaling is automatic - you just pay for what you use!

---

**Your app is built on industry-standard, proven technology used by startups and enterprises worldwide.**
