# Changelog

All notable changes to School Picks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Achievement system with badges
- Multi-sport support
- Email notifications
- Progressive Web App (PWA) support
- Automated tests (Jest, Cypress)

---

## [1.0.0] - Initial Release

### Initial Release 🎉

The first production-ready release of School Picks!

### Added

#### Core Features
- **User Authentication**
  - Secure registration and login with JWT tokens
  - Password hashing with bcrypt
  - Profile management
  - Session persistence

- **Betting System**
  - Confidence-based betting (Low 1.2x, Medium 1.5x, High 2.0x)
  - Bet on game winners, point spreads, over/under
  - Real-time balance updates
  - Betting history with filtering
  - Balance validation to prevent overbetting

- **Proposition Bets**
  - Custom prop bets with YES/NO options
  - Flexible odds configuration
  - Expiration times
  - Separate resolution system

- **Game Management**
  - Create and edit games with full details
  - Toggle game visibility for users
  - Set game outcomes and auto-resolve bets
  - Support for multiple sports types
  - Game scheduling with dates and times

- **Team Management**
  - Team profiles with rosters
  - Schedule management (JSON format)
  - Player information with stats
  - Coach details and bios
  - Win/loss records and rankings

- **Leaderboard**
  - Public rankings by balance
  - Real-time updates
  - Filters admin accounts
  - Displays username and total balance

- **Admin Panel**
  - Complete game management interface
  - User management and balance adjustments
  - Betting statistics and analytics
  - Prop bet creation and management
  - Bet resolution tools

- **Transaction System**
  - Complete transaction history
  - Track bets, wins, and adjustments
  - Transaction types and descriptions
  - Status tracking

#### User Interface
- Responsive design for mobile and desktop
- Clean, modern UI with customizable branding
  - Swap logo, primary color, and currency name to match your school
- Intuitive navigation
- Loading states and error handling
- Toast notifications for user feedback
- Confirmation dialogs for important actions
- Bet confirmation modal
- Onboarding modal for new users

#### Technical Infrastructure
- **Frontend**: React 18.2.0 with custom CSS
- **Backend**: Express.js REST API
- **Database**: Supabase PostgreSQL with RLS policies
- **Authentication**: JWT with refresh token support
- **Deployment**: 
  - Backend on Railway
  - Frontend on Cloudflare Pages
  - Database on Supabase
- **Security**: 
  - Password hashing
  - SQL injection protection
  - XSS protection
  - CORS configuration
  - Input validation

### Security
- Implemented Row Level Security (RLS) policies
- Server-side input validation
- Protected admin routes with middleware
- Secure password requirements
- JWT token expiration

### Documentation
- Comprehensive README.md
- API documentation
- Deployment guide
- Contributing guidelines
- Code of conduct
- Security policy

---

## [0.9.0] - Beta

### Added
- Beta testing with early users
- Bug reporting system
- Performance monitoring
- Error logging to database

### Fixed
- Balance restoration race condition
- Multiple rapid bet placement issues
- Game visibility toggle bugs
- Leaderboard admin filtering
- Mobile responsiveness issues
- Transaction history pagination

### Changed
- Improved error messages
- Enhanced loading states
- Optimized database queries
- Better mobile navigation

---

## [0.8.0] - Alpha

### Added
- Initial alpha release
- Core betting functionality
- Basic admin panel
- Simple leaderboard
- Game creation and management

### Known Issues
- Balance update delays
- Some mobile UI issues
- Limited error handling
- No transaction history

---

## Version History Summary

- **v1.0.0** - Production release
- **v0.9.0** - Beta testing phase
- **v0.8.0** - Alpha release
- **v0.1.0** - Initial development

---

## Migration Guides

### Upgrading from Beta (0.9.x) to v1.0.0

**Database Changes:**
```sql
-- Run these migrations if upgrading from beta
-- (Most beta testers should already have these)

-- Add missing columns if they don't exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
```

**Environment Variables:**
- Ensure `NODE_ENV=production` is set
- Verify all Supabase credentials
- Update JWT_SECRET to production value

**Code Changes:**
- No breaking API changes
- Frontend automatically compatible

---

## Breaking Changes

### v1.0.0
- **None** - First stable release

### Future Considerations
When breaking changes are introduced, they will be clearly documented here with:
- Description of the change
- Reason for the change
- Migration path
- Affected endpoints/components

---

## Contributors

Thank you to everyone who contributed to v1.0.0:

- **Gavin** - Project creator, lead developer
- **Beta Testers** - Early adopters and student testers
- **Contributors** - See [GitHub Contributors](https://github.com/yourusername/school-picks/graphs/contributors)

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Reporting bugs
- Suggesting features
- Submitting pull requests
- Code standards

---

## Versioning Strategy

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (1.x.0) - New features, backwards compatible
- **PATCH** (1.0.x) - Bug fixes, backwards compatible

### Release Schedule
- **Major releases**: As needed for significant changes
- **Minor releases**: Monthly (new features)
- **Patch releases**: As needed (bug fixes)

---

## Support

For questions about specific versions or upgrade help:
- Open an [issue](https://github.com/yourusername/school-picks/issues)
- Check the [discussions](https://github.com/yourusername/school-picks/discussions)
- Email: your-email@example.com

---

[Unreleased]: https://github.com/yourusername/school-picks/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/school-picks/releases/tag/v1.0.0
[0.9.0]: https://github.com/yourusername/school-picks/releases/tag/v0.9.0
[0.8.0]: https://github.com/yourusername/school-picks/releases/tag/v0.8.0
