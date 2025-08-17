#!/bin/bash

# Stop Worktree Ports Script
# Kills only the processes running on the current worktree's assigned ports
# Leaves other worktrees' servers running

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
    print_warning "Port registry not found, falling back to default ports"
    # Fallback to default ports if registry doesn't exist
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
        print_warning "Current worktree not found in port registry, falling back to default ports"
        BACKEND_PORT=3001
        FRONTEND_PORT=4001
    else
        BACKEND_PORT=$(echo "$WORKTREE_PORTS" | jq -r '.backend')
        FRONTEND_PORT=$(echo "$WORKTREE_PORTS" | jq -r '.frontend')
        
        if [ "$BACKEND_PORT" = "null" ] || [ "$FRONTEND_PORT" = "null" ]; then
            print_warning "Invalid port assignment in registry, falling back to default ports"
            BACKEND_PORT=3001
            FRONTEND_PORT=4001
        fi
    fi
fi

print_status "Stopping processes for current worktree only..."
print_status "Current worktree: $(basename "$CURRENT_DIR")"
print_status "Backend port: $BACKEND_PORT"
print_status "Frontend port: $FRONTEND_PORT"
echo ""

# Function to kill processes on a specific port
kill_processes_on_port() {
    local port=$1
    local port_type=$2
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        print_status "Stopping $port_type processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        print_success "Stopped $port_type processes on port $port"
    else
        print_status "No $port_type processes found on port $port"
    fi
}

# Kill processes on current worktree's ports only
kill_processes_on_port "$BACKEND_PORT" "backend"
kill_processes_on_port "$FRONTEND_PORT" "frontend"

echo ""
print_success "Worktree-specific processes stopped!"
print_status "Other worktrees' servers remain running"
print_status "To stop all processes, use: npm run stop:all"
