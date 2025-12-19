#!/bin/bash
# Valiant Picks - Startup Script for Mac/Linux

echo ""
echo "================================"
echo "    Valiant Picks - Startup"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "================================"
echo "     Starting Valiant Picks"
echo "================================"
echo ""
echo "Backend API will start on: http://localhost:5000"
echo "User Site will start on: http://localhost:3000"
echo ""
echo "Opening two terminal tabs..."
echo ""

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript <<EOF
tell application "Terminal"
    create window with default settings
    delay 0.5
    tell the last window
        create tab with default settings
        delay 0.5
        tell tab 1
            do script "cd '$PWD' && node server/server.js"
        end tell
        tell tab 2
            do script "cd '$PWD' && sleep 8 && cd client && npm start"
        end tell
    end tell
end tell
EOF
else
    # For Linux - using gnome-terminal or xterm
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$PWD' && node server/server.js; exec bash" &
        sleep 8
        gnome-terminal -- bash -c "cd '$PWD' && cd client && npm start; exec bash" &
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$PWD' && node server/server.js" &
        sleep 8
        xterm -e "cd '$PWD' && cd client && npm start" &
    else
        # Fallback: run in same terminal (user can open another)
        node server/server.js &
        sleep 8
        cd client && npm start
    fi
fi

echo ""
echo "All services are starting!"
echo ""
echo "User Site: http://localhost:3000"
echo ""
echo "Features:"
echo "  - Regular user login (create account or login)"
echo "  - Admin login (click Admin button in top right)"
echo "  - Admin username: admin"
echo "  - Admin password: 12345"
echo ""


