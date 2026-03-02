#!/bin/bash

echo "=========================================="
echo "School Picks - Rewards System Setup"
echo "=========================================="
echo ""

echo "This script will guide you through setting up the rewards system."
echo ""

# Check if Supabase credentials are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  WARNING: Supabase environment variables not detected."
    echo "Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in server/.env"
    echo ""
fi

echo "📋 Step 1: Database Setup"
echo "----------------------------------------"
echo "You need to run the SQL migration in Supabase:"
echo ""
echo "1. Go to your Supabase project: https://supabase.com/dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Create a new query"
echo "4. Copy the contents of: database/rewards-system.sql"
echo "5. Paste and execute the SQL"
echo ""
read -p "Press Enter when you've completed the database setup..."

echo ""
echo "✅ Database tables should now be created:"
echo "   - daily_logins"
echo "   - wheel_spins"
echo "   - achievements"
echo "   - wheel_config"
echo ""

echo "📦 Step 2: Install Dependencies"
echo "----------------------------------------"
echo "Checking Node.js dependencies..."
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Dependencies installed"
echo ""

echo "🚀 Step 3: Start the Application"
echo "----------------------------------------"
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run client"
echo ""
echo "Or use the combined command:"
echo "  npm run dev:all"
echo ""

echo "📖 Step 4: Test the Features"
echo "----------------------------------------"
echo "Once the app is running:"
echo ""
echo "1. Login to your account"
echo "2. You should see the Daily Login Reward popup"
echo "3. Claim your reward"
echo "4. Click 'Show Daily Spin Wheel' button"
echo "5. Spin the wheel to win prizes"
echo "6. Place bets on all available games to earn the 'All Games Bet' achievement"
echo ""

echo "📚 Documentation"
echo "----------------------------------------"
echo "For complete documentation, see: REWARDS_SYSTEM.md"
echo ""

echo "✨ Setup Complete!"
echo "=========================================="
echo ""
echo "Happy betting! 🎰🎉"
