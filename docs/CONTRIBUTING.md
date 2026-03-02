# Contributing to School Picks

First off, thank you for considering contributing to School Picks! 🎉

It's people like you that make this project a great tool for schools and communities.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/yourusername/school-picks/issues) to avoid duplicates.

When you create a bug report, include as many details as possible:

**Use the Bug Report Template:**
- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)
- Error messages or console logs

**Example:**
```
Title: Balance not updating after successful bet placement

Steps to reproduce:
1. Login as user with 1000 balance
2. Place bet of 100 on Team A
3. Bet is successful but balance still shows 1000

Expected: Balance should show 900
Actual: Balance remains at 1000

Environment: Chrome 120, Windows 11, Node 18.17.0
Error in console: [paste error]
```

### Suggesting Enhancements

We welcome feature requests! Before submitting:

1. **Check existing suggestions** in [Issues](https://github.com/yourusername/school-picks/issues)
2. **Check the roadmap** in [FUTURE_IMPROVEMENTS.txt](FUTURE_IMPROVEMENTS.txt)

When suggesting enhancements, include:
- Clear, descriptive title
- Detailed explanation of the feature
- Why this feature would be useful
- Possible implementation approach
- Mockups or examples (if applicable)

### Pull Requests

We actively welcome pull requests!

#### Before You Submit

1. **Discuss major changes** - Open an issue first for significant changes
2. **Check existing PRs** - Avoid duplicating work
3. **Follow coding standards** - See below

#### Pull Request Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/school-picks.git
   cd school-picks
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   # Start both servers
   npm run dev
   
   # Test in browser
   # Verify no console errors
   # Test on mobile view
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add user profile avatars"
   git push origin feature/your-feature-name
   ```

5. **Submit Pull Request**
   - Use the PR template
   - Link related issues
   - Describe what changed and why
   - Add screenshots for UI changes
   - Request review

#### PR Review Process

- Maintainers will review within 1-2 weeks
- Address any feedback or requested changes
- Once approved, your PR will be merged!

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Git

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/school-picks.git
   cd school-picks
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

2. **Setup Environment**
   Create `server/.env`:
   ```env
   PORT=5000
   JWT_SECRET=dev-secret-key-change-in-production
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   NODE_ENV=development
   ```

3. **Setup Database**
   - Create Supabase project
   - Run `database/database-setup.sql`

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Create Admin Account**
   - Register through UI
   - Promote to admin via Supabase SQL:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
   ```

---

## Coding Standards

### JavaScript/React

**General Principles**
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic
- Avoid deeply nested code

**Example:**
```javascript
// ❌ Bad
const x = u.filter(i => i.a > 100);

// ✅ Good
const highValueBets = userBets.filter(bet => bet.amount > 100);
```

**React Components**
```javascript
// Component structure
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

function ComponentName({ prop1, prop2 }) {
  // 1. State declarations
  const [data, setData] = useState([]);
  
  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // 3. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 4. Render helpers
  const renderItem = (item) => {
    return <div key={item.id}>{item.name}</div>;
  };
  
  // 5. Main render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

**Error Handling**
```javascript
// Always handle errors gracefully
try {
  const response = await apiClient.post('/endpoint', data);
  // Success handling
} catch (error) {
  console.error('Operation failed:', error);
  // User-friendly error message
  setError('Something went wrong. Please try again.');
}
```

### CSS

**Naming Convention**
```css
/* Use BEM-style naming */
.component-name { }
.component-name__element { }
.component-name--modifier { }

/* Example */
.bet-card { }
.bet-card__title { }
.bet-card__amount { }
.bet-card--selected { }
```

**Organization**
```css
/* 1. Layout */
.component {
  display: flex;
  position: relative;
}

/* 2. Box model */
.component {
  width: 100%;
  padding: 1rem;
  margin: 0 auto;
}

/* 3. Visual */
.component {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
}

/* 4. Typography */
.component {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
}

/* 5. Responsive */
@media (max-width: 768px) {
  .component {
    padding: 0.5rem;
  }
}
```

### Backend (Express.js)

**Route Structure**
```javascript
// routes/resource.js
const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET all (public or authenticated)
router.get('/', async (req, res) => {
  try {
    // Logic
    res.json({ data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  // Logic with validation
});

// PUT update (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  // Logic
});

module.exports = router;
```

**Database Queries**
```javascript
// Always use parameterized queries
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value); // ✅ Safe from SQL injection

// Never use string concatenation
// const query = `SELECT * FROM table WHERE id = ${userId}`; // ❌ Dangerous
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(betting): add prop bet support with YES/NO options

Added ability for admins to create proposition bets with custom odds.
Users can now bet YES or NO on custom propositions.

Closes #123

---

fix(dashboard): resolve balance update race condition

Fixed issue where rapid bet placement could result in incorrect balance
due to race condition in async balance fetching.

Fixes #456

---

docs(readme): update installation instructions

Added more detailed steps for Supabase setup and environment configuration.
```

**Best Practices:**
- Use present tense: "add feature" not "added feature"
- Capitalize first letter after type
- No period at the end of subject
- Body explains what and why, not how
- Reference issues/PRs in footer

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

**User Flows**
- [ ] Registration with valid/invalid data
- [ ] Login/logout functionality
- [ ] Place bet with sufficient balance
- [ ] Place bet with insufficient balance (should fail)
- [ ] View betting history
- [ ] Check leaderboard updates

**Admin Flows**
- [ ] Create new game
- [ ] Toggle game visibility
- [ ] Set game outcome and verify auto-resolution
- [ ] Create prop bet
- [ ] Adjust user balance

**UI/UX**
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test mobile responsiveness (DevTools)
- [ ] Check for console errors
- [ ] Verify loading states
- [ ] Test error messages display correctly

**Edge Cases**
- [ ] Bet on game that starts in 5 minutes
- [ ] Multiple rapid bets
- [ ] Negative balance attempts
- [ ] Extremely large numbers
- [ ] Special characters in inputs

### Automated Testing (Future)

We welcome contributions to add:
- Unit tests (Jest)
- Integration tests
- E2E tests (Cypress)

---

## Questions?

- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/school-picks/discussions)
- 📧 **Email**: your-email@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/school-picks/issues)

---

## Recognition

Contributors will be:
- Listed in [CHANGELOG.md](CHANGELOG.md)
- Recognized in release notes
- Added to contributors list (if significant contribution)

---

Thank you for contributing! 🎉 Every contribution, no matter how small, makes a difference!
