# Automated Testing Guide

## Overview
Comprehensive end-to-end testing suite for **Valiant Picks** using Playwright. Tests run against your live production site at https://valiantpicks.com.

## What Gets Tested

### 🔐 Authentication (auth.spec.js)
- Login/logout functionality
- User registration
- Password validation
- Session persistence
- Protected route access
- Invalid credentials handling

### 👤 User Features (user-features.spec.js)
- Dashboard display
- User profile and balance
- Statistics tracking
- Leaderboard (public rankings)
- Navigation menu
- About, Terms, How To Use pages
- Achievements, notifications
- Footer and responsive design

### 🎮 Games & Betting (games.spec.js)
- Games list display
- Betting modal/form
- Confidence levels (Low 1.2x, Medium 1.5x, High 2.0x)
- Balance validation (prevent overbetting)
- Negative/zero bet prevention
- Potential winnings calculation
- Spread and Over/Under betting
- Game filtering by type
- Bet confirmation flow

### 🎲 Prop Bets (prop-bets.spec.js)
- Prop bets list
- YES/NO betting options
- Different odds for YES vs NO
- Expiration dates
- Balance validation
- Potential winnings calculation
- Bet cancellation

### 🏀 Teams (teams.spec.js)
- Teams list display
- Team details (record, schedule, roster)
- Player information (names, positions, numbers)
- Coach information
- Team filtering by type
- Upcoming and past games
- Game scores and stats

### ⚙️ Admin Panel (admin.spec.js)
- Admin access control
- Game management (create, edit, delete)
- Game visibility toggle
- Set game outcomes and auto-resolve bets
- User management and balance updates
- View all user bets
- Team management
- Prop bet creation and resolution
- Admin statistics dashboard

### 🎁 Rewards & Achievements (rewards.spec.js)
- Daily login rewards
- Login streak tracking
- Daily reward cooldown
- Spin wheel feature
- Achievement display and progress
- Locked/unlocked achievements
- Achievement rewards
- Notifications for earned rewards
- Confetti animations
- Onboarding tutorial
- Referral program

### 💰 Transaction History (transactions.spec.js)
- Transaction list display
- Transaction types (bet, win, reward)
- Amounts and timestamps
- Positive/negative transactions
- Transaction filtering (type, date range)
- Transaction status
- Total earned/spent summaries
- Search and pagination
- Transaction persistence across sessions

## Installation

Already installed! Playwright is ready to use.

## Running Tests

### Run All Tests
```powershell
npm test
```

### Run with UI Mode (Visual Test Runner)
```powershell
npm run test:ui
```

### Run in Headed Mode (Watch Browser)
```powershell
npm run test:headed
```

### Run with Debugger
```powershell
npm run test:debug
```

### View Last Test Report
```powershell
npm run test:report
```

### Run Specific Browser
```powershell
# Chrome only
npm run test:chromium

# Firefox only
npm run test:firefox

# Safari only
npm run test:webkit
```

### Run Specific Test File
```powershell
npx playwright test tests/e2e/auth.spec.js
npx playwright test tests/e2e/games.spec.js
npx playwright test tests/e2e/admin.spec.js
```

### Run Specific Test
```powershell
npx playwright test -g "should login successfully"
```

## Test Configuration

Tests are configured in `playwright.config.js`:
- **Base URL**: https://valiantpicks.com (your live site)
- **Browsers**: Chrome, Firefox, Safari (all tested)
- **Parallel**: Sequential (prevents race conditions)
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## Test Credentials

You'll need to create test accounts on your live site:

### Regular User
- Email: testuser@valiantpicks.com
- Password: TestPassword123!

### Admin User
- Email: admin@valiantpicks.com
- Password: AdminPassword123!

**Important**: Create these accounts on https://valiantpicks.com before running tests.

## Understanding Test Results

### ✅ Passed Tests
Feature works correctly on your live site.

### ❌ Failed Tests
Issue detected - check:
1. Test output for error details
2. Screenshots in `test-results/`
3. Video recordings (if available)
4. Traces for detailed debugging

### ⏭️ Skipped Tests
Feature not available or conditional test didn't apply.

## Continuous Testing

### Manual Testing
Run tests before deploying changes:
```powershell
npm test
```

### After Deployment
Verify all features work on production:
```powershell
npm run test:headed
```

### CI/CD Integration
You can add these tests to GitHub Actions:
```yaml
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install
    npm test
```

## Troubleshooting

### Tests Failing?
1. **Check your live site**: Visit https://valiantpicks.com
2. **Verify test accounts exist**: Login manually with test credentials
3. **Check for breaking changes**: Did you modify UI elements?
4. **Network issues**: Tests require internet connection
5. **Slow loading**: Increase timeouts in playwright.config.js

### Browser Installation
If browsers aren't installed:
```powershell
npx playwright install
```

### View Debug Info
```powershell
npm run test:debug
```

### Clear Test Cache
```powershell
Remove-Item -Recurse -Force test-results
```

## Test Coverage

- ✅ **Authentication**: 100% coverage
- ✅ **User Features**: All main features
- ✅ **Betting System**: All bet types and validations
- ✅ **Prop Bets**: Full YES/NO flow
- ✅ **Teams**: Display and details
- ✅ **Admin Panel**: All management features
- ✅ **Rewards**: Daily rewards, spin wheel, achievements
- ✅ **Transactions**: Full history and filtering

## Best Practices

1. **Run tests before deploying**: Catch issues early
2. **Check failed tests carefully**: Screenshots provide context
3. **Update tests when UI changes**: Keep tests in sync with code
4. **Use headed mode for debugging**: See what's happening
5. **Test on all browsers**: Cross-browser compatibility

## What To Do With Test Results

### All Green ✅
Your site is working perfectly! Safe to deploy.

### Some Red ❌
1. Check the error message
2. View screenshots in `test-results/`
3. Run that specific test in headed mode
4. Fix the issue
5. Re-run tests

### Many Failing 🔴
Probably a breaking change or site is down:
1. Check if site is accessible
2. Verify test credentials work
3. Check for major UI changes
4. Update tests if needed

## Files Created

```
tests/
├── e2e/
│   ├── auth.spec.js           # Authentication tests
│   ├── user-features.spec.js  # User dashboard & features
│   ├── games.spec.js          # Games & betting
│   ├── prop-bets.spec.js      # Prop bets
│   ├── teams.spec.js          # Teams display
│   ├── admin.spec.js          # Admin panel
│   ├── rewards.spec.js        # Rewards & achievements
│   └── transactions.spec.js   # Transaction history
├── helpers/
│   └── test-utils.js          # Shared test utilities
└── e2e/
    └── .env.test              # Test configuration

playwright.config.js           # Playwright configuration
```

## Need Help?

- **Playwright Docs**: https://playwright.dev
- **Test Results**: `test-results/html/index.html`
- **Debug Mode**: `npm run test:debug`
- **UI Mode**: `npm run test:ui` (best for exploring tests)

---

**Ready to test!** Run `npm test` to verify everything works on your live site.
