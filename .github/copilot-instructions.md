# School Picks - Copilot Instructions

## Project Overview
Open-source, full-stack virtual sports betting platform template for schools and organizations. Users bet with virtual currency (default: "Campus Bucks") on games and prop bets. Admins manage games, teams, players, and resolve bets. Designed to be forked and rebranded by any school.

## Customization Placeholders
When deploying for a specific school, replace these across the codebase:
- App name: `School Picks` → e.g. `Eagle Picks`, `Titan Picks`
- Currency: `Campus Bucks` → e.g. `Eagle Bucks`, `Titan Coins`
- Primary color: `#0066cc` → your school's brand color
- Domain: `your-domain.com` → your actual domain
- Logo: `client/public/assets/logo.png` → your school logo

## Live Deployment (Your Instance)
- **Domain**: https://your-domain.com
- **Backend**: Railway (Express.js API)
- **Frontend**: Cloudflare Pages (React)
- **Database**: Supabase PostgreSQL

## Architecture
- **Backend**: Express.js REST API on Railway
- **Frontend**: React 18.2.0 with Axios on Cloudflare Pages
- **Authentication**: JWT tokens (not Supabase Auth) with bcryptjs
- **Database**: Supabase PostgreSQL with RLS policies
- **Branding**: Customizable — swap logo, primary color, currency name

## Key Features
1. **Betting System**: Confidence-based (Low 1.2x, Medium 1.5x, High 2.0x)
2. **Game Management**: Admin controls game visibility, sets outcomes
3. **Prop Bets**: Full betting interface with YES/NO options and custom odds
4. **Browse Bets**: Public page showing all available bets
5. **Teams & Players**: Team rosters, schedules, stats (JSON fields)
6. **Leaderboard**: Public rankings (filters out admin account)
7. **Balance Validation**: Prevents overbetting
8. **Transaction History**: Track all bets and winnings

## Getting Started

### Install Dependencies
```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### Setup Environment
Create `server/.env`:
```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=development
```

### Setup Database
1. Create Supabase project
2. Run **database/MASTER_SETUP.sql** in Supabase SQL Editor
3. Tables and RLS policies will be created automatically

### Run Locally
```bash
# Both servers
npm run dev
```

Server: http://localhost:5000  
Client: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account (username, email, password)
- `POST /api/auth/login` - Login (returns JWT token)

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/balance` - Update user balance (admin only)

### Games
- `GET /api/games` - Get visible games (optionalAuth - no login required)
- `POST /api/games` - Create game (admin only)
- `PUT /api/games/:id` - Update game (admin only)
- `PUT /api/games/:id/visibility` - Toggle game visibility (admin only)
- `PUT /api/games/:id/outcome` - Set game winner and auto-resolve bets (admin only)
- `DELETE /api/games/:id` - Delete game (admin only)

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID (includes schedule JSON, players JSON)
- `POST /api/teams` - Create team (admin only)
- `PUT /api/teams/:id` - Update team (admin only)

### Bets
- `POST /api/bets` - Place bet (amount, odds, game_id, bet_type)
- `GET /api/bets` - Get current user's bets
- `GET /api/bets/all` - Get all bets (admin only)
- `PUT /api/bets/:id` - Update bet status/outcome (admin only)

### Prop Bets
- `GET /api/prop-bets` - Get all active prop bets
- `POST /api/prop-bets` - Create prop bet (admin only)
- `PUT /api/prop-bets/:id` - Update prop bet (admin only)
- `POST /api/prop-bets/:id/bet` - Place bet on prop (user)

### Transactions
- `GET /api/transactions` - Get user's transaction history
- `POST /api/transactions` - Create transaction record

## Admin Features
- **Game Management**: Create, edit, delete games; toggle visibility; set outcomes
- **Team Management**: Create teams with JSON schedules and player rosters
- **Bet Management**: View all user bets, manually resolve if needed
- **User Management**: View all users, modify balances
- **Prop Bets**: Create custom prop bets with YES/NO odds
- **Statistics**: See total bets, pending, won, lost counts

## Environment Variables
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV` - Environment (development/production)

## Database Schema

### Users Table
- `id` (UUID PK), `username`, `email`, `password`, `balance` (default: 1000), `is_admin`, `created_at`, `updated_at`

### Games Table
- `id` (PK), `team_id` (FK), `team_type`, `home_team`, `away_team`, `game_date`, `game_time`, `location`, `status`, `result`, `home_score`, `away_score`, `type`, `winning_odds`, `losing_odds`, `spread`, `spread_odds`, `over_under`, `over_odds`, `under_odds`, `notes`, `is_visible` (BOOLEAN), `created_at`, `updated_at`

### Teams Table
- `id` (PK), `name`, `type`, `description`, `record_wins`, `record_losses`, `league_record`, `ranking`, `coach_name`, `coach_email`, `coach_bio`, `schedule` (JSON), `players` (JSON), `created_at`, `updated_at`

### Bets Table
- `id` (PK), `user_id` (FK), `game_id` (FK), `bet_type`, `selected_team`, `amount`, `odds`, `status` (pending/resolved), `outcome` (won/lost), `potential_win`, `created_at`, `updated_at`

### Prop Bets Table
- `id` (PK), `title`, `description`, `team_type`, `yes_odds`, `no_odds`, `expires_at`, `status` (active/resolved), `outcome`, `created_at`, `updated_at`

### Transactions Table
- `id` (PK), `user_id` (FK), `type` (bet/win), `amount`, `description`, `status`, `created_at`

## Design

### Default Color Scheme (Customize for your school)
- Primary: `#0066cc`
- Secondary: `#004f99` (darker shade for hover states)
- Background: `#f5f5f5`
- White: `#ffffff`

### Logo
- Located at: `client/public/assets/logo.png`
- Replace with your school logo (transparent PNG recommended)

## Deployment
- **Backend**: Railway
- **Frontend**: Cloudflare Pages
- **Database**: Supabase PostgreSQL
- **Domain**: Custom domain (configure in Railway + Cloudflare)

## Database Setup
- **database/MASTER_SETUP.sql**: Complete database setup (run once on a fresh Supabase project)

## Important Notes
- Always change `JWT_SECRET` in production
- Use HTTPS in production
- RLS policies use "allow all" approach — backend validates with JWT
- Game visibility toggle controls which games users can bet on
- Bet resolution automatically calculates winnings and credits user balance
- All user inputs validated server-side
- Admin account must be created through registration then promoted via SQL
- Leaderboard is public and filters out admin account
- Balance validation prevents betting more than available balance

