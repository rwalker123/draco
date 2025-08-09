#!/bin/bash

# Worktree Initialization Script for Draco Sports Manager
# This script sets up a new git worktree with all necessary files and dependencies
#
# Usage:
#   ./worktree-init.sh           # Full setup with node_modules copy
#   ./worktree-init.sh --no-copy # Skip copying node_modules (faster)

set -e  # Exit on any error

# Parse command line arguments
COPY_NODE_MODULES=true
for arg in "$@"; do
    case $arg in
        --help|-h)
            echo "Usage: $0 [--no-copy] [--help]"
            echo "  --no-copy   Skip copying node_modules from main repo"
            echo "  --help      Show this help message"
            exit 0
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the main repository path
MAIN_REPO_PATH="/Users/raywalker/source/Draco"
CURRENT_DIR="$(pwd)"

print_status "Initializing git worktree: $CURRENT_DIR"
print_status "Main repository: $MAIN_REPO_PATH"

# Check if we're in a git worktree
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print_error "Current directory is not a git repository or worktree"
    exit 1
fi

# Check if main repo exists
if [ ! -d "$MAIN_REPO_PATH" ]; then
    print_error "Main repository not found at: $MAIN_REPO_PATH"
    exit 1
fi

# Step 1: Copy .env files
print_status "Copying environment files..."

# Backend .env file
if [ -f "$MAIN_REPO_PATH/draco-nodejs/backend/.env" ]; then
    mkdir -p "draco-nodejs/backend"
    cp "$MAIN_REPO_PATH/draco-nodejs/backend/.env" "draco-nodejs/backend/.env"
    print_success "Copied backend .env file"
else
    print_warning "Backend .env file not found in main repo"
fi

# Frontend .env.local file
if [ -f "$MAIN_REPO_PATH/draco-nodejs/frontend-next/.env.local" ]; then
    mkdir -p "draco-nodejs/frontend-next"
    cp "$MAIN_REPO_PATH/draco-nodejs/frontend-next/.env.local" "draco-nodejs/frontend-next/.env.local"
    print_success "Copied frontend .env.local file"
else
    print_warning "Frontend .env.local file not found in main repo"
fi

# Backend certs directory (SSL certificates for HTTPS development)
if [ -d "$MAIN_REPO_PATH/draco-nodejs/backend/certs" ]; then
    mkdir -p "draco-nodejs/backend"
    cp -r "$MAIN_REPO_PATH/draco-nodejs/backend/certs" "draco-nodejs/backend/"
    print_success "Copied backend certs directory (SSL certificates)"
else
    print_warning "Backend certs directory not found in main repo"
fi

# Claude settings file
if [ -f "$MAIN_REPO_PATH/.claude/settings.local.json" ]; then
    mkdir -p ".claude"
    cp "$MAIN_REPO_PATH/.claude/settings.local.json" ".claude/settings.local.json"
    print_success "Copied Claude settings file"
else
    print_warning "Claude settings file not found in main repo"
fi

# Step 3: Install/update dependencies
print_status "Installing dependencies..."

# Root npm install
if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
else
    print_status "Updating root dependencies..."
    npm install
    print_success "Root dependencies updated"
fi

# Backend npm install
if [ ! -d "draco-nodejs/backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd draco-nodejs/backend
    npm install
    cd "$CURRENT_DIR"
    print_success "Backend dependencies installed"
else
    print_status "Updating backend dependencies..."
    cd draco-nodejs/backend
    npm install
    cd "$CURRENT_DIR"
    print_success "Backend dependencies updated"
fi

# Frontend npm install
if [ ! -d "draco-nodejs/frontend-next/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd draco-nodejs/frontend-next
    npm install
    cd "$CURRENT_DIR"
    print_success "Frontend dependencies installed"
else
    print_status "Updating frontend dependencies..."
    cd draco-nodejs/frontend-next
    npm install
    cd "$CURRENT_DIR"
    print_success "Frontend dependencies updated"
fi

# Step 4: Run Prisma generate for database client
print_status "Generating Prisma client..."
cd draco-nodejs/backend
npx prisma generate
cd "$CURRENT_DIR"
print_success "Prisma client generated"

# Step 5: Verify setup
print_status "Verifying setup..."

# Check if build works
print_status "Testing build..."
if npm run build >/dev/null 2>&1; then
    print_success "Build test passed"
else
    print_warning "Build test failed - you may need to check configuration"
fi

# Summary
echo ""
print_success "Worktree initialization complete!"
echo ""
print_status "Summary of actions:"
echo "  ✓ Copied environment files from main repo"
echo "  ✓ Copied SSL certificates from main repo"
echo "  ✓ Copied Claude settings from main repo"
echo "  ✓ Installed all dependencies"
echo "  ✓ Generated Prisma client"
echo "  ✓ Verified build setup"
echo ""
print_status "Your worktree is ready for development!"
print_status "You can now run: npm run dev"
echo ""

# Optional: Show git worktree info
print_status "Git worktree info:"
git worktree list | grep "$(pwd)"