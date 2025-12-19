# Valiant Picks Betting Platform

A full-stack betting website where users place bets with virtual Valiant Bucks. Built with React frontend and Express.js backend.

## Quick Start

**Windows:**
```bash
./startup.bat
```

**Mac/Linux:**
```bash
chmod +x startup.sh
./startup.sh
```

App opens automatically on http://localhost:3000

## Login

### Regular User
- Click "Register" to create account
- Use username and password to login

### Admin
- Click "Admin" button (top right of login screen)
- Username: `admin`
- Password: `12345`

## What You Get

✅ User registration and JWT authentication  
✅ Place bets with odds management  
✅ Admin panel for user and bet management  
✅ Transaction history and balance tracking  
✅ Valiant Bucks virtual currency system  

## Architecture

| Component | Port | Tech Stack |
|-----------|------|-----------|
| Backend API | 5000 | Express.js, SQLite3 |
| Frontend | 3000 | React, Axios |

## Project Structure

```
betting/
├── server/                 # Express backend
│   ├── server.js          # Main server
│   ├── database.js        # SQLite setup
│   ├── routes/            # API endpoints
│   ├── models/            # DB models
│   ├── middleware/        # Auth & utilities
│   ├── package.json
│   └── .env
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/        # CSS
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── startup.bat            # Windows start
├── startup.sh             # Mac/Linux start
├── database.db            # SQLite database
├── package.json
└── README.md
```

## API Endpoints

**Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

**Users**
- `GET /api/users/profile` - Get current user
- `GET /api/users` - All users (admin only)
- `PUT /api/users/:id/balance` - Update balance (admin only)

**Bets**
- `POST /api/bets` - Place bet
- `GET /api/bets` - User's bets
- `GET /api/bets/all` - All bets (admin only)
- `PUT /api/bets/:id` - Update bet status (admin only)

**Transactions**
- `GET /api/transactions` - Transaction history
- `POST /api/transactions` - Create transaction

## Database Schema

**Users Table**
- `id` (PK), `username`, `email`, `password`, `balance` (1000 default), `is_admin`, `created_at`, `updated_at`

**Bets Table**
- `id` (PK), `user_id` (FK), `amount`, `odds`, `status`, `outcome`, `potential_win`, `created_at`, `updated_at`

**Transactions Table**
- `id` (PK), `user_id` (FK), `type`, `amount`, `description`, `status`, `created_at`

## Environment Variables

Create `server/.env`:
```
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Color Scheme

- Primary Blue: #004f9e (Valiant Blue)
- Dark Blue: #003d7a
- Background: #f5f5f5
- White: #ffffff

## Manual Startup (If Auto-Start Fails)

### Terminal 1 - Backend
```bash
cd server
npm install
npm start
```

### Terminal 2 - Frontend
```bash
cd client
npm install
npm start
```

## Troubleshooting

**Port already in use?**
The startup script automatically kills processes on ports 5000 and 3000. If you still get errors:
```powershell
# Windows - Kill all Node processes
Get-Process node | Stop-Process -Force
```

**Backend not responding?**
Wait 8-10 seconds after startup for the backend to fully initialize.

**Dependencies missing?**
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Deployment

- **Backend**: Railway.app, Render.com, or Heroku
- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Full-Stack**: Railway or Render (supports both simultaneously)

## Key Features

- **Virtual Currency**: Users start with 1000 Valiant Bucks
- **Bet System**: Place bets with custom odds, track potential winnings
- **Admin Controls**: Manage users, set bet outcomes, adjust balances
- **JWT Security**: Secure token-based authentication
- **Transaction Tracking**: Complete history of all user transactions
- **Responsive Design**: Works on desktop and mobile

## Notes

- First user created can be made admin by database modification
- Bet resolution automatically calculates and credits winnings
- All inputs validated server-side
- Use strong JWT_SECRET in production
- Enable HTTPS in production environments
