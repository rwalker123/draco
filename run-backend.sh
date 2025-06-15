#!/bin/bash

# Draco Backend Helper Script
# This script ensures commands are run from the correct backend directory

FRONTEND_DIR="/Users/raywalker/source/Draco/draco-nodejs/frontend"
BACKEND_DIR="/Users/raywalker/source/Draco/draco-nodejs/backend"

echo "🔧 Draco Backend Helper Script"
echo "📁 Target directory: $BACKEND_DIR"

# Check if we're already in the correct directory
if [ "$PWD" = "$BACKEND_DIR" ]; then
    echo "✅ Already in correct directory: $PWD"
else
    echo "🔄 Navigating to backend directory..."
    cd "$BACKEND_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully navigated to: $PWD"
    else
        echo "❌ Failed to navigate to backend directory"
        exit 1
    fi
fi

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $PWD"
    echo "💡 Make sure you're in the correct backend directory"
    echo "🔧 Use this script from the root directory: /Users/raywalker/source/Draco"
    exit 1
fi

# Check if command is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No command provided"
    echo "📋 Usage: ./run-backend.sh {start|build|dev|test|install|prisma-generate|migrate-passwords|test-passwords}"
    echo ""
    echo "Available commands:"
    echo "  start             - Start the production server"
    echo "  build             - Build the TypeScript project"
    echo "  dev               - Start development mode with nodemon"
    echo "  test              - Run tests"
    echo "  install           - Install dependencies"
    echo "  prisma-generate   - Generate Prisma client"
    echo "  migrate-passwords - Run password migration script"
    echo "  test-passwords    - Test password verification"
    exit 1
fi

# Map commands to npm commands
case "$1" in
    "start")
        echo "🚀 Starting production server..."
        npm start
        ;;
    "build")
        echo "🔨 Building TypeScript project..."
        npm run build
        ;;
    "dev")
        echo "🛠️ Starting development mode..."
        npm run dev
        ;;
    "test")
        echo "🧪 Running tests..."
        npm test
        ;;
    "install")
        echo "📦 Installing dependencies..."
        npm install
        ;;
    "prisma-generate")
        echo "🔧 Generating Prisma client..."
        npx prisma generate
        ;;
    "migrate-passwords")
        echo "🔐 Running password migration..."
        npm run migrate-passwords
        ;;
    "test-passwords")
        echo "🧪 Testing password verification..."
        npm run test-passwords
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "📋 Available commands: start, build, dev, test, install, prisma-generate, migrate-passwords, test-passwords"
        exit 1
        ;;
esac 