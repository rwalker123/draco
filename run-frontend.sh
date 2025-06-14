#!/bin/bash

# Draco Frontend Helper Script
# This script ensures commands are run from the correct frontend directory

FRONTEND_DIR="/Users/raywalker/source/Draco/draco-nodejs/frontend"

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
    exit 1
fi

echo "🚀 Executing command: $@"
echo ""

# Execute the command passed to this script
exec "$@" 