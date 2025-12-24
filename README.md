# Valiant Picks - Sports Betting Platform

A full-stack sports betting web application for Valiant Academy basketball teams, where users bet with virtual Valiant Bucks on games and prop bets.

## 🚀 Live Deployment

- **Production**: https://valiantpicks.com
- **Backend API**: Railway (Node.js/Express)
- **Frontend**: Cloudflare Pages (React)
- **Database**: Supabase PostgreSQL

## 🎯 Features

### User Features
- **Account System**: Registration, login with JWT authentication
- **Virtual Currency**: Start with 1000 Valiant Bucks
- **Confidence Betting**: Low (1.2x), Medium (1.5x), High (2.0x) multipliers
- **Dashboard**: Stats overview, quick betting, recent bets, upcoming games
- **Browse Bets**: View all available games with detailed information
- **My Bets**: Track all placed bets with status and outcomes
- **Leaderboard**: Public rankings (filters out admin accounts)
- **Teams Page**: View team rosters, schedules, and stats
- **Notifications**: Real-time updates on bet outcomes
- **Mobile Responsive**: Full mobile and desktop support

### Admin Features
- **Game Management**: Create, edit, delete games with visibility toggle
- **Seed Games**: Import from team schedules with duplicate prevention
- **Bulk Actions**: Show all, hide all, delete all games
- **Bet Resolution**: Set game outcomes and auto-calculate winnings
- **Team Management**: Update team info, rosters, and schedules
- **User Management**: View all users and modify balances
- **Prop Bets**: Create custom proposition bets with YES/NO options
- **Statistics**: View betting activity and user engagement

## 🛠 Tech Stack

### Frontend
- React 18.2.0
- Axios for API requests
- Custom CSS with responsive design
- JWT token management
- Error boundaries

### Backend
- Node.js with Express.js
- Supabase PostgreSQL database
- JWT authentication with bcryptjs
- Rate limiting (express-rate-limit)
- CORS enabled for production domains
- RESTful API architecture

### Database
- Supabase PostgreSQL
- Row Level Security (RLS) policies
- JSON fields for schedules and rosters
- Transaction history tracking

## 📦 Project Structure

```
Betting/
├── client/                 # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── assets/        # Logo and images
│   └── src/
│       ├── components/    # React components
│       ├── styles/        # CSS files
│       ├── utils/         # Axios, currency formatting
│       ├── App.js
│       └── index.js
├── server/                # Express backend
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── server.js        # Entry point
│   └── supabase.js      # Database connection
├── .github/
│   └── copilot-instructions.md
├── FINAL_DEPLOYMENT.sql  # Database setup script
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
- Railway account (for backend)
- Cloudflare account (for frontend)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Betting
```

2. **Install dependencies**
```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

3. **Setup Environment Variables**

Create `server/.env`:
```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Setup Database**
- Create a Supabase project
- Run `FINAL_DEPLOYMENT.sql` in Supabase SQL Editor
- Tables and RLS policies will be created automatically

5. **Run Locally**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

Server: http://localhost:5000  
Client: http://localhost:3000

## 🔄 Auto-Commit to GitHub

The project includes automatic commit functionality to keep GitHub in sync with your development.

### Quick Start
```bash
# Using Node.js (cross-platform)
npm run auto-commit

# Using PowerShell (Windows)
.\auto-commit.ps1
```

The auto-commit service:
- ✅ Watches for file changes
- ✅ Debounces to avoid incomplete commits (3 second wait)
- ✅ Automatically commits and pushes every change
- ✅ Ignores build files, dependencies, and environment files
- ✅ Works in the background

For detailed setup and troubleshooting, see [AUTO_COMMIT_GUIDE.md](AUTO_COMMIT_GUIDE.md).

## 🌐 Production Deployment

### Backend (Railway)
1. Create new project in Railway
2. Connect GitHub repository
3. Set environment variables:
   - `PORT=5000`
   - `JWT_SECRET` (generate strong key)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://valiantpicks.com`
4. Set root directory to `/server`
5. Build command: `npm install`
6. Start command: `npm start`

### Frontend (Cloudflare Pages)
1. Create new Pages project
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `build`
   - Root directory: `/client`
4. Environment variables:
   - `REACT_APP_API_URL=https://your-railway-url.railway.app/api`
   - `NODE_VERSION=18`
5. Custom domain: Configure DNS for valiantpicks.com

### Database (Supabase)
1. Create project and run FINAL_DEPLOYMENT.sql
2. Enable RLS policies (already in script)
3. Copy URL and anon key to Railway environment

## 📊 Database Schema

### Tables
- `users` - User accounts, balances, admin status
- `games` - Basketball games with betting odds
- `teams` - Team information with JSON schedules/rosters
- `bets` - User bets with outcomes
- `prop_bets` - Custom proposition bets
- `transactions` - Bet and win history
- `notifications` - User notifications

## 🎨 Design System

### Colors
- Primary Blue: #004f9e
- Dark Blue: #003d7a
- Gold: #ffd700
- Green: #66bb6a
- Red: #ef5350
- Background: #0f1419

### Typography
- Headers: System fonts
- Body: 0.95rem base size
- Responsive scaling

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Rate limiting on all routes
- CORS configuration
- Input validation
- SQL injection prevention (parameterized queries)
- XSS protection

## 📱 Mobile Responsiveness

- Breakpoints: 1200px, 768px, 480px
- Touch-friendly buttons
- Optimized layouts for all screen sizes
- Smooth animations and transitions

## 🧪 Testing

```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Games
- `GET /api/games` - Get visible games
- `GET /api/games/admin/all` - Get all games (admin)
- `POST /api/games` - Create game (admin)
- `PUT /api/games/:id` - Update game (admin)
- `DELETE /api/games/:id` - Delete game (admin)

### Bets
- `GET /api/bets` - Get user's bets
- `POST /api/bets` - Place bet
- `GET /api/bets/all` - Get all bets (admin)

### Users
- `GET /api/users/profile` - Get current user
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id/balance` - Update balance (admin)

## 🐛 Known Issues

None currently. Report issues via GitHub.

## 🚀 Future Enhancements

- Live game updates
- Push notifications
- Betting history analytics
- Social features (comments, sharing)
- Mobile app (React Native)
- Advanced statistics
- Multi-sport support

## 👥 Admin Setup

1. Register first account through UI
2. In Supabase SQL Editor, run:
```sql
UPDATE users SET is_admin = true WHERE email = 'your-admin-email@example.com';
```

## 📄 License

Private - Valiant Academy Internal Use

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Valiant Academy**
