#!/bin/bash

# Draco Frontend Helper Script
# This script ensures commands are run from the correct frontend directory

FRONTEND_DIR="/Users/raywalker/source/Draco/draco-nodejs/frontend"
BACKEND_DIR="/Users/raywalker/source/Draco/draco-nodejs/backend"

echo "🔧 Draco Frontend Helper Script"
echo "📁 Target directory: $FRONTEND_DIR"

# Check if we're already in the correct directory
if [ "$PWD" = "$FRONTEND_DIR" ]; then
    echo "✅ Already in correct directory: $PWD"
else
    echo "🔄 Navigating to frontend directory..."
    cd "$FRONTEND_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully navigated to: $PWD"
    else
        echo "❌ Failed to navigate to frontend directory"
        exit 1
    fi
fi

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $PWD"
    echo "💡 Make sure you're in the correct frontend directory"
    echo "🔧 Use this script from the root directory: /Users/raywalker/source/Draco"
    exit 1
fi

# Check if command is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: No command provided"
    echo "📋 Usage: ./run-frontend.sh {start|build|test|install|eject}"
    echo ""
    echo "Available commands:"
    echo "  start   - Start the development server"
    echo "  build   - Build the project for production"
    echo "  test    - Run tests"
    echo "  install - Install dependencies"
    echo "  eject   - Eject from Create React App"
    exit 1
fi

# Map commands to npm commands
case "$1" in
    "start")
        echo "🚀 Starting development server..."
        npm start
        ;;
    "build")
        echo "🔨 Building project for production..."
        npm run build
        ;;
    "test")
        echo "🧪 Running tests..."
        npm test
        ;;
    "install")
        echo "📦 Installing dependencies..."
        npm install
        ;;
    "eject")
        echo "⚠️  Ejecting from Create React App..."
        echo "💡 This action is irreversible!"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run eject
        else
            echo "❌ Eject cancelled"
            exit 0
        fi
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "📋 Available commands: start, build, test, install, eject"
        exit 1
        ;;
esac 