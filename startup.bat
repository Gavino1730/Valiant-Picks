@echo off
REM Valiant Picks - Startup Script for Windows

setlocal enabledelayedexpansion

echo.
echo ================================
echo    Valiant Picks - Startup
echo ================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo ================================
echo     Starting Valiant Picks
echo ================================
echo.

REM Kill any existing node processes on our ports
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo Starting services...
echo.

REM Start backend - FIRST
echo [1/2] Starting Backend on port 5000...
start "Valiant Picks - Backend" cmd /k "title Backend API 5000 && node server/server.js"

REM Wait 8 seconds for backend to fully start
echo Waiting 8 seconds for backend to initialize...
timeout /t 8 /nobreak

REM Start user frontend
echo [2/2] Starting User Site on port 3000...
start "Valiant Picks - User Site" cmd /k "title User Site 3000 && cd client && npm start"

echo.
echo ========================================
echo Startup Complete!
echo.
echo User Site: http://localhost:3000
echo.
echo Features:
echo   - Regular user login (create account or login)
echo   - Admin login (click Admin button in top right)
echo   - Admin username: admin
echo   - Admin password: 12345
echo.
echo Backend running on: http://localhost:5000
echo.
echo Please wait 15-20 seconds for services to fully start.
echo ========================================
echo.
