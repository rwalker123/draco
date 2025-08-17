#!/bin/bash

# Start Worktree Production Script
# Reads port registry and starts backend and frontend with assigned ports

set -e  # Exit on any error

# Source common functions
source "$(dirname "$0")/common-functions.sh"

# Get the current worktree path
CURRENT_DIR="$(pwd)"

# Check if we're in a git worktree
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print_error "Current directory is not a git repository or worktree"
    exit 1
fi


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

print_status "Starting production servers with worktree-specific ports..."
print_status "Current worktree: $(basename "$CURRENT_DIR")"
print_status "Backend port: $BACKEND_PORT"
print_status "Frontend port: $FRONTEND_PORT"
echo ""

# Export environment variables for the child processes
export PORT="$BACKEND_PORT"
export FRONTEND_PORT="$FRONTEND_PORT"

print_status "Starting backend on port $BACKEND_PORT..."
cd "$MAIN_REPO_PATH/draco-nodejs/backend"
npm run start:port &
BACKEND_PID=$!
cd "$CURRENT_DIR"

print_status "Starting frontend on port $FRONTEND_PORT..."
cd "$MAIN_REPO_PATH/draco-nodejs/frontend-next"
npm run start:port &
FRONTEND_PID=$!
cd "$CURRENT_DIR"

print_success "Production servers started!"
print_status "Backend: https://localhost:$BACKEND_PORT"
print_status "Frontend: https://localhost:$FRONTEND_PORT"
echo ""
print_status "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
