<div align="center">
  <img src="client/public/assets/logo.png" alt="School Picks Logo" width="200"/>
  
  # School Picks
  
  ### 🏀 A Full-Stack Virtual Sports Betting Platform for Schools & Organizations
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg)](https://supabase.com/)
  
  [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)
  
</div>

---

## 📖 About

**School Picks** is an open-source, fully customizable virtual sports betting platform designed for schools, clubs, or any organization to run fun, consequence-free betting games with their community. Users receive virtual currency ("Campus Bucks" — rename to anything you like) to place confidence-based bets on games, compete on leaderboards, and track their history.

This platform is **a blank template** — swap in your school name, logo, colors, and sports in minutes.

### 🎯 Key Highlights

- **Virtual Currency System** - Safe, fun betting with no real money
- **Confidence-Based Betting** - Low (1.2x), Medium (1.5x), High (2.0x) multipliers
- **Admin Dashboard** - Complete control over games, teams, and user management
- **Real-time Leaderboard** - Competitive rankings to drive engagement
- **Prop Bets** - Custom proposition bets with YES/NO options
- **Mobile Responsive** - Works seamlessly on all devices
- **Automated Bet Resolution** - Set game outcomes and auto-calculate winnings

---

## ✨ Features

### For Users
- 🎮 **Create Account & Login** - Secure JWT authentication
- 💰 **Virtual Currency** - Start with 1,000 Campus Bucks (rename to anything)
- 🎲 **Confidence Betting** - Choose Low/Medium/High risk levels
- 📊 **Live Leaderboard** - See top performers in real-time
- 📜 **Betting History** - Track all your bets and transactions
- 🏆 **Prop Bets** - Bet on custom propositions with YES/NO options
- 📱 **Mobile Friendly** - Fully responsive design
- 🔔 **Notifications** - Get updates on game outcomes

### For Admins
- ⚙️ **Game Management** - Create, edit, delete, and toggle visibility
- 🏀 **Team Management** - Manage rosters, schedules, and stats
- 🎯 **Bet Resolution** - Set outcomes and auto-calculate winnings
- 👥 **User Management** - View users and adjust balances
- 📈 **Analytics Dashboard** - Track betting statistics
- 🎭 **Prop Bet Creation** - Create custom proposition bets
- 🔒 **Access Control** - Admin-only features with role-based auth

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Supabase Account** - [Create free account](https://supabase.com)

### Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/yourusername/school-picks.git
cd school-picks
```

2️⃣ **Set up Supabase Database**
- Create a new Supabase project at [supabase.com](https://supabase.com)
- Open the SQL Editor in your Supabase dashboard
- Copy and run the SQL from `database/database-setup.sql`
- This will create all tables, relationships, and RLS policies

3️⃣ **Configure Environment Variables**

Create `server/.env` file:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=development
```

> 💡 **Tip**: Find your Supabase URL and key in Project Settings → API

4️⃣ **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

5️⃣ **Start Development Servers**

**Option A: Start both servers at once** (Recommended)
```bash
npm run dev
```

**Option B: Start separately**
```bash
# Terminal 1 - Backend Server
npm run server

# Terminal 2 - Frontend Client
npm run client
```

6️⃣ **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

7️⃣ **Create Admin Account**
- Register a new account through the UI
- Run this SQL in Supabase to promote to admin:
```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

---

## 📚 Documentation

### Project Structure

```
school-picks/
├── 📁 client/               # React frontend application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── styles/         # CSS stylesheets
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── 📁 server/              # Express.js backend API
│   ├── middleware/         # Auth, error handling
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── server.js          # Main server file
│   └── package.json
│
├── 📁 database/            # SQL scripts and migrations
│   ├── database-setup.sql # Main setup script
│   └── migrations/        # Database migrations
│
├── 📁 .github/            # GitHub specific files
│   ├── ISSUE_TEMPLATE/    # Issue templates
│   └── copilot-instructions.md
│
├── 📄 README.md           # You are here
├── 📄 LICENSE             # MIT License
├── 📄 package.json        # Root dependencies
│
└── 📁 docs/               # All documentation
    ├── README.md          # Docs index
    ├── QUICK_START.md     # Getting started guide
    ├── API.md             # API reference
    ├── DEPLOYMENT.md      # Deployment guide
    ├── CONTRIBUTING.md    # Contribution guidelines
    ├── CHANGELOG.md       # Version history
    ├── SECURITY.md        # Security policy
    └── CODE_OF_CONDUCT.md # Community guidelines
```

### Additional Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - How to deploy to production
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[Security Policy](docs/SECURITY.md)** - Security guidelines
- **[Changelog](docs/CHANGELOG.md)** - Version history

---

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **Axios** - HTTP client
- **React Router** - Navigation
- **CSS3** - Styling (no frameworks, custom design)
- **Cloudflare Pages** - Hosting

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Railway** - Hosting

### Database
- **Supabase** - PostgreSQL database hosting
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Security policies

### DevOps
- **Git** - Version control
- **GitHub** - Repository hosting
- **Concurrently** - Run multiple npm scripts
- **dotenv** - Environment variable management

---

## 🎨 Customization & Rebranding

This project is designed to be easily customizable for your organization:

### 1. **Brand Name & Logo**
- Replace logo in `client/public/assets/logo.png` with your school logo
- Search & replace `School Picks` across the codebase with your app name
- Update `client/public/index.html` title and meta tags
- Update `package.json` name field

### 2. **Color Scheme**
Edit `client/src/App.css` (or `client/src/styles/design-system.css`):
```css
:root {
  --primary-color: #0066cc;      /* Change to your school/brand color */
  --secondary-color: #004f99;    /* Darker shade for hover states */
  --background: #f5f5f5;
}
```

### 3. **Virtual Currency Name**
- Default template value: "Campus Bucks"
- Change in: `client/src/utils/currency.js`
- Update references throughout components to match your chosen name (e.g. "Eagle Bucks", "Titan Coins", etc.)

### 4. **Starting Balance**
- Default: 1,000 virtual bucks
- Change in: `database/database-setup.sql` (users table default value)

### 5. **Odds Multipliers**
Current confidence levels:
- Low: 1.2x
- Medium: 1.5x
- High: 2.0x

Modify in game creation logic and database schema.

---

## 📱 Usage Guide

### For Users

1. **Register Account** - Create account with username, email, password
2. **Browse Games** - View upcoming and active games
3. **Place Bets** - Select team, choose confidence level, enter amount
4. **Track Progress** - View your betting history and current balance
5. **Check Leaderboard** - See where you rank against other users
6. **Prop Bets** - Bet YES or NO on custom propositions

### For Admins

1. **Create Games** - Add new games with teams, dates, and odds
2. **Manage Visibility** - Toggle which games users can bet on
3. **Set Outcomes** - Mark winners and auto-resolve all bets
4. **Create Prop Bets** - Add custom proposition bets
5. **Manage Users** - View users and adjust balances if needed
6. **View Analytics** - See betting statistics and platform activity

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Row Level Security (RLS) policies
- ✅ Input validation on client and server
- ✅ Rate limiting (recommended for production)

See [docs/SECURITY.md](docs/SECURITY.md) for detailed security information.

---

## 🚢 Deployment

### Recommended Setup
- **Frontend**: Cloudflare Pages (Free tier available)
- **Backend**: Railway ($5/month recommended)
- **Database**: Supabase (Free tier available)

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Quick Production Checklist
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS for production domain
- [ ] Set up custom domain
- [ ] Enable rate limiting
- [ ] Configure monitoring/logging
- [ ] Set up database backups
- [ ] Review and harden RLS policies

---

## 🤝 Contributing

We welcome contributions! Please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Pull request process
- Coding standards
- Testing guidelines

---

## 🐛 Known Issues

See [BUG_REPORT.md](BUG_REPORT.md) for current known issues and their status.

---

## 📝 Changelog

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for version history and release notes.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ℹ️ License and copyright notice required

---

## 👏 Acknowledgments

- Built as an open template for any school or organization
- Inspired by the need for safe, fun virtual sports betting in schools
- Thanks to all contributors and testers

---

## 📞 Support

- 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/school-picks/issues)
- 💡 **Feature Requests**: [Open an issue](https://github.com/yourusername/school-picks/issues)
- 📧 **Email**: your-email@example.com
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/school-picks/discussions)

---

## 🗺️ Roadmap

See [FUTURE_IMPROVEMENTS.txt](FUTURE_IMPROVEMENTS.txt) for planned features and enhancements.

### Upcoming Features
- 🔄 Real-time notifications with WebSockets
- 📊 Advanced analytics and betting trends
- 🎯 Achievement system and badges
- 📱 Progressive Web App (PWA) support
- 🌐 Multi-sport support
- 🎨 Theme customization
- 📧 Email notifications

---

<div align="center">
  
  **⭐ If you find this project useful, please consider giving it a star on GitHub! ⭐**
  
  Made with ❤️ for schools everywhere — fork it, brand it, run it.
  
  [Your Name](https://github.com/yourusername)
  
</div>
