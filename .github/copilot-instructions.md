# Valiant Picks - Copilot Instructions

## Project Overview
This is a full-stack betting website built with Node.js/Express backend and React frontend using SQLite database. Users can place bets with virtual Valiant Bucks, and admins control odds and bet settlements.

## Architecture
- **Backend**: Express.js REST API with SQLite3 database
- **Frontend**: React with Axios for API calls
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Database**: SQLite3 with users, bets, transactions, and admin_logs tables
- **Branding**: Valiant Picks with #004f9e blue and white color scheme

## Key Features
1. User registration and JWT-based authentication
2. Place bets with odds set by admin
3. Transaction tracking for balance management (starting balance: 1000 Valiant Bucks)
4. Admin panel for bet management and settlement
5. User balance management by admin
6. Real-time balance updates

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
```bash
cp server/.env.example server/.env
# Edit server/.env if needed (default PORT=5000)
```

### Run Locally
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
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

### Bets
- `POST /api/bets` - Place a new bet (amount, odds)
- `GET /api/bets` - Get current user's bets
- `GET /api/bets/all` - Get all bets (admin only)
- `PUT /api/bets/:id` - Update bet status/outcome (admin only)

### Transactions
- `GET /api/transactions` - Get user's transaction history
- `POST /api/transactions` - Create transaction record

## Admin Features
- **Bet Management**: View all user bets, set outcomes (won/lost), resolve bets
- **User Management**: View all users, modify balances
- **Statistics**: See total bets, pending, won, lost counts

## Environment Variables
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Database Schema

### Users Table
- `id` (PK), `username`, `email`, `password`, `balance` (default: 1000 Valiant Bucks), `is_admin`, `created_at`, `updated_at`

### Bets Table
- `id` (PK), `user_id` (FK), `amount`, `odds`, `status` (pending/resolved), `outcome` (won/lost), `potential_win`, `created_at`, `updated_at`

### Transactions Table
- `id` (PK), `user_id` (FK), `type` (bet/win), `amount`, `description`, `status`, `created_at`

## Design

### Color Scheme
- Primary Blue: #004f9e
- Secondary: #003d7a (darker blue for hover states)
- Background: #f5f5f5
- White: #ffffff

### Logo
- Located at: `/client/public/assets/logo.png`
- Displays in navbar with "Valiant Picks" text

## Deployment
- **Backend**: Railway.app, Render.com, or Heroku (Node.js + SQLite)
- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Full-stack**: Railway or Render (supports both simultaneously)

## Important Notes
- Always change `JWT_SECRET` in production
- Use HTTPS in production
- First user created becomes admin (modify database directly if needed)
- Bet resolution automatically calculates winnings and credits user balance
- All user inputs validated server-side
