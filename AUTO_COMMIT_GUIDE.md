# Auto-Commit Guide

This project includes automatic commit functionality to push changes to GitHub.

## Starting Auto-Commits

### Option 1: Using Node.js (Cross-platform)
```bash
npm run auto-commit
```

### Option 2: Using PowerShell (Windows)
```powershell
.\auto-commit.ps1
```

### Option 3: Using npm as daemon (Background)
```bash
npm run auto-commit-daemon
```

## How It Works

The auto-commit service:

1. **Watches for changes** - Monitors all file changes in the repository
2. **Debounces** - Waits 3 seconds after the last change before committing (to avoid committing partially written files)
3. **Checks for changes** - Every 2 seconds, checks if there are any uncommitted changes
4. **Automatically commits** - When changes are detected and the debounce time has passed:
   - Stages all changes
   - Creates a commit with timestamp
   - Pushes to GitHub (branch HEAD)
5. **Ignores certain files** - Automatically excludes:
   - `node_modules/`
   - `.git/`
   - `build/`, `dist/`
   - `.env`, `.env.local`
   - Log files
   - macOS `.DS_Store`

## Requirements

- Git must be installed and configured
- You must have GitHub credentials set up (SSH or HTTPS)
- Branch protection rules should allow force pushes (or no branch protection)

## GitHub Configuration

### 1. Set up Git Credentials

**For HTTPS:**
```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

**For SSH (recommended):**
Make sure you have an SSH key set up:
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Add the public key to GitHub Settings > SSH and GPG Keys
```

### 2. Configure Default Branch

```bash
git remote set-head origin main
```

Or if using a different branch:
```bash
git remote set-head origin <your-branch-name>
```

## Stopping Auto-Commits

Press `Ctrl+C` in the terminal running the auto-commit service.

## Troubleshooting

### "Permission denied" errors
- On macOS/Linux: Make the script executable: `chmod +x auto-commit.js`
- On Windows: Run PowerShell as Administrator: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Push is rejected
- Check branch protection rules in GitHub
- Ensure you have push access to the repository
- Verify your branch name matches what's in the script (default: `main`)

### No changes being committed
- Check that files are actually changing (not just being accessed)
- Verify git is tracking the files: `git status`
- Check if the files match ignore patterns

## Disabling Auto-Commits

To disable auto-commits, simply stop the service with `Ctrl+C`.

To temporarily disable while keeping the service running, you can stash changes:
```bash
git stash
```

## Security Notes

⚠️ **Important**: The auto-commit service commits and pushes ALL changes automatically. Consider:

1. **What gets committed**: Review ignore patterns in `auto-commit.js` or `auto-commit.ps1`
2. **Secrets**: Never commit `.env` files with real credentials
3. **Large files**: Git LFS may be needed for large binary files
4. **Conflicts**: Manual conflict resolution may be needed if pushing fails

---

For more information, see the main [README.md](README.md) or [Copilot Instructions](.github/copilot-instructions.md).
