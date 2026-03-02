# Documentation Index

Welcome to School Picks documentation! This page helps you find the information you need quickly.

---

## 📚 Getting Started

**New to the project? Start here:**

1. [README.md](../README.md) - Project overview and quick start
2. [Installation Guide](../README.md#quick-start) - Step-by-step setup instructions
3. [Environment Setup](../server/.env.example) - Configure your development environment

---

## 📖 Core Documentation

### For All Users

- **[README.md](../README.md)** - Main project documentation
  - Project overview
  - Features list
  - Quick start guide
  - Technology stack
  - Customization guide

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
  - What's new in each version
  - Breaking changes
  - Migration guides

- **[LICENSE](LICENSE)** - MIT License terms

### For Developers

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
  - Development setup
  - Coding standards
  - Pull request process
  - Commit guidelines
  - Testing checklist

- **[API.md](API.md)** - Complete API reference
  - All endpoints documented
  - Request/response examples
  - Authentication guide
  - Error codes

- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines
  - Expected behavior
  - Reporting process
  - Enforcement guidelines

### For Admins & Deployers

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
  - Step-by-step deployment
  - Environment configuration
  - Database setup
  - Custom domain setup
  - Monitoring & maintenance
  - Troubleshooting

- **[SECURITY.md](SECURITY.md)** - Security policy
  - How to report vulnerabilities
  - Security best practices
  - Current protections
  - Security checklist

---

## 🗂️ Project Structure

### Root Directory
```
school-picks/
├── 📄 README.md              ← Project overview (start here)
├── 📄 LICENSE                ← MIT license
├── 📄 package.json           ← Root dependencies
├── 📄 .gitignore             ← Git ignore rules
├── 📄 setup.ps1              ← Windows setup script
├── 📄 setup.sh               ← Unix setup script
├── 📁 docs/                  ← All documentation (you are here)
│   ├── README.md             ← Docs index
│   ├── QUICK_START.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   ├── CHANGELOG.md
│   ├── SECURITY.md
│   ├── CODE_OF_CONDUCT.md
│   └── PROJECT_SUMMARY.md
├── 📁 .github/               ← GitHub configurations
├── 📁 client/                ← React frontend
├── 📁 server/                ← Express backend
└── 📁 database/              ← SQL scripts
```

### Client (Frontend)
```
client/
├── 📄 package.json           ← Frontend dependencies
├── 📄 .env.example           ← Environment template
├── 📁 public/                ← Static assets
│   ├── index.html
│   └── assets/
│       └── logo.png
└── 📁 src/
    ├── App.js                ← Main app component
    ├── 📁 components/        ← React components
    ├── 📁 styles/            ← CSS stylesheets
    └── 📁 utils/             ← Utility functions
```

### Server (Backend)
```
server/
├── 📄 package.json           ← Backend dependencies
├── 📄 .env.example           ← Environment template
├── 📄 server.js              ← Main server file
├── 📁 middleware/            ← Express middleware
├── 📁 models/                ← Database models
└── 📁 routes/                ← API endpoints
```

### Database
```
database/
├── database-setup.sql        ← Main database setup
├── migrations-consolidated.sql
└── *.sql                     ← Various migrations
```

---

## 🔍 Quick Reference

### Common Tasks

**Setting up for the first time:**
1. See [Quick Start](../README.md#quick-start)
2. Run setup script: `.\setup.ps1` (Windows) or `./setup.sh` (Unix)

**Contributing code:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Follow coding standards
3. Submit pull request

**Deploying to production:**
1. Follow [DEPLOYMENT.md](DEPLOYMENT.md)
2. Check [Security Checklist](SECURITY.md#security-checklist)
3. Review [Post-Deployment](DEPLOYMENT.md#post-deployment)

**Reporting issues:**
1. **Check [existing issues](https://github.com/yourusername/school-picks/issues)**
2. Use appropriate issue template
3. Provide all requested information

### API Quick Links

- [Authentication Endpoints](API.md#authentication)
- [Betting Endpoints](API.md#bets)
- [Game Management](API.md#games)
- [User Management](API.md#users)
- [Error Responses](API.md#error-responses)

### Configuration Files

- `server/.env` - Backend environment variables ([example](server/.env.example))
- `client/.env.production` - Frontend production config ([example](client/.env.example))
- `database/database-setup.sql` - Database initialization

---

## 💡 How-To Guides

### Development

- **Run locally**: `npm run dev` (both servers) or separate with `npm run server` and `npm run client`
- **Install dependencies**: `npm run install-all` or use setup scripts
- **Build for production**: `npm run build`
- **Check for security issues**: `npm audit`

### Database

- **Initial setup**: Run `database/database-setup.sql` in Supabase SQL Editor
- **Create admin**: See [Deployment Guide - Create Admin](DEPLOYMENT.md#step-5-create-admin-user)
- **Backup database**: Follow [Backup Strategy](DEPLOYMENT.md#backup-strategy)

### Customization

- **Change branding**: Update logo, colors, and text (see [Customization Guide](../README.md#customization--rebranding))
- **Modify odds**: Update bet multipliers in game creation logic
- **Add new features**: Follow [Contributing Guide](CONTRIBUTING.md)

---

## 🆘 Troubleshooting

Common issues and solutions:

1. **"Cannot connect to backend"**
   - Check API URL in `client/src/utils/axios.js`
   - Verify backend is running on correct port
   - See [Troubleshooting Guide](DEPLOYMENT.md#troubleshooting)

2. **"Database connection failed"**
   - Verify Supabase credentials in `server/.env`
   - Check Supabase project status
   - Ensure database setup script has been run

3. **"Permission denied"**
   - Check RLS policies in Supabase
   - Verify user authentication
   - See [Security Documentation](SECURITY.md)

4. **Build errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (needs v18+)
   - Review error messages in console

For more help, see:
- [Deployment Troubleshooting](DEPLOYMENT.md#troubleshooting)
- [GitHub Issues](https://github.com/yourusername/school-picks/issues)
- [GitHub Discussions](https://github.com/yourusername/school-picks/discussions)

---

## 📞 Getting Help

- 🐛 **Bug Reports**: [Create an issue](https://github.com/yourusername/school-picks/issues/new?template=bug_report.yml)
- 💡 **Feature Requests**: [Create an issue](https://github.com/yourusername/school-picks/issues/new?template=feature_request.yml)
- 📚 **Documentation Issues**: [Create an issue](https://github.com/yourusername/school-picks/issues/new?template=documentation.yml)
- 💬 **Questions**: [Start a discussion](https://github.com/yourusername/school-picks/discussions)
- 🔒 **Security**: Email security concerns privately (see [SECURITY.md](SECURITY.md))

---

## 🔗 External Resources

### Technologies Used
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

### Learning Resources
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn)

---

## 📊 Project Status

- **Current Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: January 14, 2026
- **License**: MIT
- **Maintained**: Yes

---

## 🎯 Roadmap

See [FUTURE_IMPROVEMENTS.txt](FUTURE_IMPROVEMENTS.txt) for planned features and enhancements.

**Upcoming highlights:**
- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Achievement system with badges
- Multi-sport support
- Mobile app (React Native)

---

**Need something else?** Open a [discussion](https://github.com/yourusername/school-picks/discussions) or check the [README](../README.md)!
