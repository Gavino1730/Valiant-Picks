#!/bin/bash

# Quick Setup Script for School Picks (Unix/Linux/macOS)
# This script helps new contributors get started quickly

echo "================================================"
echo "   School Picks - Quick Setup Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo -e "${RED}  Please install Node.js from: https://nodejs.org${NC}"
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm is installed: v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm is not installed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install root dependencies
echo -e "${CYAN}1/3 Installing root dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install root dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Root dependencies installed${NC}"

# Install server dependencies
echo -e "${CYAN}2/3 Installing server dependencies...${NC}"
cd server
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install server dependencies${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ Server dependencies installed${NC}"

# Install client dependencies
echo -e "${CYAN}3/3 Installing client dependencies...${NC}"
cd client
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install client dependencies${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ Client dependencies installed${NC}"

echo ""
echo "================================================"
echo "   Setup Environment Variables"
echo "================================================"

# Check if .env exists
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ server/.env already exists${NC}"
else
    echo -e "${YELLOW}Creating server/.env from example...${NC}"
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo -e "${GREEN}✓ Created server/.env${NC}"
        echo -e "${YELLOW}⚠  IMPORTANT: Edit server/.env and add your Supabase credentials!${NC}"
    else
        echo -e "${RED}✗ server/.env.example not found${NC}"
    fi
fi

echo ""
echo "================================================"
echo -e "${GREEN}   Setup Complete!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit server/.env and add your Supabase credentials"
echo "2. Run database setup in Supabase (see database/MASTER_SETUP.sql)"
echo "3. Start development servers:"
echo -e "   ${CYAN}npm run dev${NC}        (starts both servers)"
echo "   OR"
echo -e "   ${CYAN}npm run server${NC}     (backend only)"
echo -e "   ${CYAN}npm run client${NC}     (frontend only)"
echo ""
echo "For more information, see README.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
