#!/bin/bash
# Setup script for auto-commit on macOS/Linux

echo "🔄 Valiant Picks Auto-Commit Setup"
echo "===================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git is installed"

# Check current directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Please run this script from the Valiant Picks root directory"
    exit 1
fi

echo "✅ Running from Valiant Picks root directory"

# Check git configuration
echo ""
echo "📋 Checking Git configuration..."

GIT_USER=$(git config --global user.name)
GIT_EMAIL=$(git config --global user.email)

if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ]; then
    echo "⚠️  Git not fully configured. Setting up..."
    
    read -p "Enter your name: " GIT_USER
    read -p "Enter your email: " GIT_EMAIL
    
    git config --global user.name "$GIT_USER"
    git config --global user.email "$GIT_EMAIL"
    
    echo "✅ Git configured"
else
    echo "✅ Git configured for: $GIT_USER <$GIT_EMAIL>"
fi

# Check remote configuration
echo ""
echo "🔗 Checking remote configuration..."

REMOTE=$(git remote get-url origin)
if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote configured"
    read -p "Enter GitHub repository URL: " REMOTE
    git remote add origin "$REMOTE"
    echo "✅ Remote added: $REMOTE"
else
    echo "✅ Remote configured: $REMOTE"
fi

# Set default branch
echo ""
echo "🌿 Checking default branch..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "✅ Current branch: $BRANCH"

# Make scripts executable
echo ""
echo "🔐 Setting up permissions..."
chmod +x auto-commit.js auto-commit.ps1 2>/dev/null

echo "✅ Scripts are executable"

# Summary
echo ""
echo "✨ Setup Complete!"
echo ""
echo "To start auto-commits, run:"
echo ""
echo "   npm run auto-commit"
echo ""
echo "Or directly run:"
echo ""
echo "   node auto-commit.js"
echo ""
echo "For more information, see AUTO_COMMIT_GUIDE.md"
echo ""
