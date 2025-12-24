# Recent Updates - December 24, 2025

## 🐛 Bug Fixes

### 1. ✅ Game Disappearing After Update
**Issue**: When admin updated a game's score/status to "completed", the game would disappear from the games list.

**Root Cause**: The backend `Game.getAll()` method was filtering out games with `status === 'completed'` using `.neq('status', 'completed')`.

**Fix**: Removed the status filter from [server/models/Game.js](server/models/Game.js#L54-L62)
- Games now appear in the list regardless of status
- Completed games remain visible for reference

---

## 🔄 New Features

### 2. ✅ Auto-Commit to GitHub
Set up automatic commits to GitHub whenever files change.

**Files Added**:
- [auto-commit.js](auto-commit.js) - Node.js version (cross-platform)
- [auto-commit.ps1](auto-commit.ps1) - PowerShell version (Windows)
- [package.json](package.json) - Root package.json with scripts
- [AUTO_COMMIT_GUIDE.md](AUTO_COMMIT_GUIDE.md) - Detailed setup guide

**How to Use**:
```bash
npm run auto-commit        # Node.js version
.\auto-commit.ps1          # PowerShell version
```

**Features**:
- Watches for file changes
- 3-second debounce to avoid incomplete commits
- Automatically stages, commits, and pushes
- Ignores node_modules, .git, build files, and .env files
- Graceful shutdown with Ctrl+C

---

## 📋 Changes Summary

### Backend Changes
- [Game.js](server/models/Game.js) - Fixed game filtering issue

### Frontend Changes
- No frontend changes required for game fix

### Root Level Changes
- [package.json](package.json) - Created with auto-commit scripts
- [auto-commit.js](auto-commit.js) - Node.js auto-commit service
- [auto-commit.ps1](auto-commit.ps1) - PowerShell auto-commit service
- [AUTO_COMMIT_GUIDE.md](AUTO_COMMIT_GUIDE.md) - Setup documentation
- [README.md](README.md) - Updated with auto-commit section

---

## ✨ Testing Checklist

- [ ] Update a game's score and mark it as completed - should stay visible
- [ ] Start auto-commit service and make a file change - should auto-commit within ~5 seconds
- [ ] Stop auto-commit with Ctrl+C - should exit gracefully
- [ ] Check GitHub - should see new commits appearing

---

## 📚 Documentation

See [AUTO_COMMIT_GUIDE.md](AUTO_COMMIT_GUIDE.md) for:
- Detailed setup instructions
- GitHub credential configuration
- Troubleshooting common issues
- Security considerations
