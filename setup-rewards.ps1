# School Picks - Rewards System Setup
# PowerShell version for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "School Picks - Rewards System Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will guide you through setting up the rewards system."
Write-Host ""

# Check if Supabase credentials are set
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
    Write-Host "⚠️  WARNING: Supabase environment variables not detected." -ForegroundColor Yellow
    Write-Host "Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in server/.env"
    Write-Host ""
}

Write-Host "📋 Step 1: Database Setup" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "You need to run the SQL migration in Supabase:"
Write-Host ""
Write-Host "1. Go to your Supabase project: https://supabase.com/dashboard"
Write-Host "2. Navigate to the SQL Editor"
Write-Host "3. Create a new query"
Write-Host "4. Copy the contents of: database\rewards-system.sql"
Write-Host "5. Paste and execute the SQL"
Write-Host ""
Read-Host "Press Enter when you've completed the database setup"

Write-Host ""
Write-Host "✅ Database tables should now be created:" -ForegroundColor Green
Write-Host "   - daily_logins"
Write-Host "   - wheel_spins"
Write-Host "   - achievements"
Write-Host "   - wheel_config"
Write-Host ""

Write-Host "📦 Step 2: Install Dependencies" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "Checking Node.js dependencies..."
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "Installing server dependencies..."
Set-Location server
npm install
Set-Location ..

# Install client dependencies
Write-Host "Installing client dependencies..."
Set-Location client
npm install
Set-Location ..

Write-Host ""
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 3: Start the Application" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "To start the application:"
Write-Host ""
Write-Host "Terminal 1 (Backend):"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Terminal 2 (Frontend):"
Write-Host "  npm run client"
Write-Host ""
Write-Host "Or use the combined command:"
Write-Host "  npm run dev:all"
Write-Host ""

Write-Host "📖 Step 4: Test the Features" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "Once the app is running:"
Write-Host ""
Write-Host "1. Login to your account"
Write-Host "2. You should see the Daily Login Reward popup"
Write-Host "3. Claim your reward"
Write-Host "4. Click 'Show Daily Spin Wheel' button"
Write-Host "5. Spin the wheel to win prizes"
Write-Host "6. Place bets on all available games to earn the 'All Games Bet' achievement"
Write-Host ""

Write-Host "📚 Documentation" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "For complete documentation, see: REWARDS_SYSTEM.md"
Write-Host ""

Write-Host "✨ Setup Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy betting! 🎰🎉" -ForegroundColor Yellow
