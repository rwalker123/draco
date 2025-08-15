#!/bin/bash

# Start Worktree Development Script
# Reads port registry and starts backend and frontend with assigned ports

set -e  # Exit on any error

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

# Get the current worktree path
CURRENT_DIR="$(pwd)"

# Check if we're in a git worktree
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print_error "Current directory is not a git repository or worktree"
    exit 1
fi

# Function to find the main repository path
find_main_repo() {
    local current="$1"
    local max_depth=10
    local depth=0
    
    while [ "$depth" -lt "$max_depth" ] && [ "$current" != "/" ]; do
        if [ -f "$current/.git" ] || [ -d "$current/.git" ]; then
            # Check if this is the main repo (has the worktree-ports.json)
            if [ -f "$current/draco-nodejs/.worktree-ports.json" ]; then
                echo "$current"
                return 0
            fi
        fi
        current=$(dirname "$current")
        depth=$((depth + 1))
    done
    
    return 1
}

# Find the main repository
MAIN_REPO_PATH=$(find_main_repo "$CURRENT_DIR")
if [ -z "$MAIN_REPO_PATH" ]; then
    print_error "Could not find main repository path"
    exit 1
fi

REGISTRY_PATH="$MAIN_REPO_PATH/draco-nodejs/.worktree-ports.json"

# Check if registry exists
if [ ! -f "$REGISTRY_PATH" ]; then
    print_warning "Port registry not found, using default ports"
    BACKEND_PORT=3001
    FRONTEND_PORT=4001
else
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_error "jq is required for port management. Please install jq to continue."
        exit 1
    fi
    
    # Get current worktree's port assignment
    WORKTREE_PORTS=$(jq -r ".worktrees[\"$CURRENT_DIR\"] | {backend: .backendPort, frontend: .frontendPort}" "$REGISTRY_PATH" 2>/dev/null)
    
    if [ "$WORKTREE_PORTS" = "null" ] || [ -z "$WORKTREE_PORTS" ]; then
        print_warning "Current worktree not found in port registry, using default ports"
        BACKEND_PORT=3001
        FRONTEND_PORT=4001
    else
        BACKEND_PORT=$(echo "$WORKTREE_PORTS" | jq -r '.backend')
        FRONTEND_PORT=$(echo "$WORKTREE_PORTS" | jq -r '.frontend')
        
        if [ "$BACKEND_PORT" = "null" ] || [ "$FRONTEND_PORT" = "null" ]; then
            print_warning "Invalid port assignment in registry, using default ports"
            BACKEND_PORT=3001
            FRONTEND_PORT=4001
        fi
    fi
fi

print_status "Starting development servers with worktree-specific ports..."
print_status "Current worktree: $(basename "$CURRENT_DIR")"
print_status "Backend port: $BACKEND_PORT"
print_status "Frontend port: $FRONTEND_PORT"
echo ""

# Export environment variables for the child processes
export PORT="$BACKEND_PORT"
export FRONTEND_PORT="$FRONTEND_PORT"

print_status "Starting backend on port $BACKEND_PORT..."
cd "$MAIN_REPO_PATH/draco-nodejs/backend"
npm run dev:port &
BACKEND_PID=$!
cd "$CURRENT_DIR"

print_status "Starting frontend on port $FRONTEND_PORT..."
cd "$MAIN_REPO_PATH/draco-nodejs/frontend-next"
npm run dev:port &
FRONTEND_PID=$!
cd "$CURRENT_DIR"

print_success "Development servers started!"
print_status "Backend: https://localhost:$BACKEND_PORT"
print_status "Frontend: https://localhost:$FRONTEND_PORT"
echo ""
print_status "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
