# Quick Setup Script for School Picks
# This script helps new contributors get started quickly

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   School Picks - Quick Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✓ npm is installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Install root dependencies
Write-Host "1/3 Installing root dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Root dependencies installed" -ForegroundColor Green

# Install server dependencies
Write-Host "2/3 Installing server dependencies..." -ForegroundColor Cyan
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install server dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✓ Server dependencies installed" -ForegroundColor Green

# Install client dependencies
Write-Host "3/3 Installing client dependencies..." -ForegroundColor Cyan
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install client dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✓ Client dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Setup Environment Variables" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if .env exists
if (Test-Path "server/.env") {
    Write-Host "✓ server/.env already exists" -ForegroundColor Green
} else {
    Write-Host "Creating server/.env from example..." -ForegroundColor Yellow
    if (Test-Path "server/.env.example") {
        Copy-Item "server/.env.example" "server/.env"
        Write-Host "✓ Created server/.env" -ForegroundColor Green
        Write-Host "⚠  IMPORTANT: Edit server/.env and add your Supabase credentials!" -ForegroundColor Yellow
    } else {
        Write-Host "✗ server/.env.example not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit server/.env and add your Supabase credentials" -ForegroundColor White
Write-Host "2. Run database setup in Supabase (see database/MASTER_SETUP.sql)" -ForegroundColor White
Write-Host "3. Start development servers:" -ForegroundColor White
Write-Host "   npm run dev        (starts both servers)" -ForegroundColor Cyan
Write-Host "   OR" -ForegroundColor White
Write-Host "   npm run server     (backend only)" -ForegroundColor Cyan
Write-Host "   npm run client     (frontend only)" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
