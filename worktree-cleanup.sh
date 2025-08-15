#!/bin/bash

# Worktree Port Registry Cleanup Script
# This script cleans up inactive worktrees and validates the port registry
#
# Usage:
#   ./worktree-cleanup.sh           # Clean up inactive worktrees
#   ./worktree-cleanup.sh --dry-run # Show what would be cleaned up

set -e  # Exit on any error

# Parse command line arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--help]"
            echo "  --dry-run   Show what would be cleaned up without doing it"
            echo "  --help      Show this help message"
            exit 0
            ;;
    esac
    shift
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
REGISTRY_PATH="$MAIN_REPO_PATH/draco-nodejs/.worktree-ports.json"

print_status "Starting worktree port registry cleanup..."

# Check if registry exists
if [ ! -f "$REGISTRY_PATH" ]; then
    print_error "Port registry not found at: $REGISTRY_PATH"
    exit 1
fi

# Function to check if worktree directory exists
worktree_exists() {
    local worktree_path="$1"
    [ -d "$worktree_path" ]
}

# Function to check if worktree is still a valid git worktree
is_valid_worktree() {
    local worktree_path="$1"
    cd "$worktree_path" 2>/dev/null && git rev-parse --is-inside-work-tree >/dev/null 2>&1
}

# Function to check if worktree is active (has been used recently)
is_active_worktree() {
    local worktree_path="$1"
    local last_active="$2"
    
    # Convert ISO timestamp to Unix timestamp
    local last_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S.%3NZ" "$last_active" "+%s" 2>/dev/null || 
                          date -d "$last_active" "+%s" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    local current_timestamp=$(date "+%s")
    local time_diff=$((current_timestamp - last_timestamp))
    local inactive_threshold=$((24 * 60 * 60)) # 24 hours in seconds
    
    [ $time_diff -lt $inactive_threshold ]
}

# Function to check for port conflicts
check_port_conflicts() {
    local registry_data="$1"
    local conflicts=()
    
    # Extract all ports from registry
    local backend_ports=$(echo "$registry_data" | jq -r '.worktrees[] | .backendPort' 2>/dev/null)
    local frontend_ports=$(echo "$registry_data" | jq -r '.worktrees[] | .frontendPort' 2>/dev/null)
    
    # Check for duplicate ports
    local duplicate_backend=$(echo "$backend_ports" | sort | uniq -d)
    local duplicate_frontend=$(echo "$frontend_ports" | sort | uniq -d)
    
    if [ -n "$duplicate_backend" ]; then
        conflicts+=("Duplicate backend ports: $duplicate_backend")
    fi
    
    if [ -n "$duplicate_frontend" ]; then
        conflicts+=("Duplicate frontend ports: $duplicate_frontend")
    fi
    
    echo "${conflicts[@]}"
}

# Load registry data
print_status "Loading port registry..."
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq to continue."
    exit 1
fi

registry_data=$(cat "$REGISTRY_PATH")
if [ $? -ne 0 ]; then
    print_error "Failed to read registry file"
    exit 1
fi

# Check for port conflicts
print_status "Checking for port conflicts..."
conflicts=$(check_port_conflicts "$registry_data")
if [ ${#conflicts[@]} -gt 0 ]; then
    print_warning "Port conflicts detected:"
    for conflict in "${conflicts[@]}"; do
        echo "  - $conflict"
    done
else
    print_success "No port conflicts detected"
fi

# Analyze worktrees
print_status "Analyzing worktrees..."
worktrees_to_remove=()
worktrees_to_update=()

# Get all worktree entries
worktree_entries=$(echo "$registry_data" | jq -r '.worktrees | to_entries[] | [.key, .value.lastActive, .value.status] | @tsv' 2>/dev/null)

if [ -n "$worktree_entries" ]; then
    while IFS=$'\t' read -r worktree_path last_active status; do
        print_status "Checking worktree: $worktree_path"
        
        # Check if worktree directory exists
        if ! worktree_exists "$worktree_path"; then
            print_warning "Worktree directory not found: $worktree_path"
            worktrees_to_remove+=("$worktree_path")
            continue
        fi
        
        # Check if it's still a valid git worktree
        if ! is_valid_worktree "$worktree_path"; then
            print_warning "Invalid git worktree: $worktree_path"
            worktrees_to_remove+=("$worktree_path")
            continue
        fi
        
        # Check if worktree is active
        if ! is_active_worktree "$worktree_path" "$last_active"; then
            print_warning "Inactive worktree: $worktree_path (last active: $last_active)"
            worktrees_to_remove+=("$worktree_path")
        else
            print_success "Active worktree: $worktree_path"
            worktrees_to_update+=("$worktree_path")
        fi
    done <<< "$worktree_entries"
else
    print_status "No worktrees found in registry"
fi

# Show cleanup summary
echo ""
if [ ${#worktrees_to_remove[@]} -gt 0 ]; then
    print_warning "Worktrees to be removed:"
    for worktree in "${worktrees_to_remove[@]}"; do
        echo "  - $worktree"
    done
else
    print_success "No worktrees need to be removed"
fi

if [ ${#worktrees_to_update[@]} -gt 0 ]; then
    print_status "Active worktrees:"
    for worktree in "${worktrees_to_update[@]}"; do
        echo "  - $worktree"
    done
fi

# Perform cleanup if not dry run
if [ "$DRY_RUN" = true ]; then
    echo ""
    print_status "DRY RUN MODE - No changes were made"
    print_status "Run without --dry-run to perform actual cleanup"
else
    if [ ${#worktrees_to_remove[@]} -gt 0 ]; then
        echo ""
        print_status "Performing cleanup..."
        
        # Create backup of registry
        backup_path="$REGISTRY_PATH.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$REGISTRY_PATH" "$backup_path"
        print_success "Registry backed up to: $backup_path"
        
        # Remove inactive worktrees from registry
        for worktree in "${worktrees_to_remove[@]}"; do
            print_status "Removing worktree: $worktree"
            
            # Use jq to remove the worktree entry
            temp_registry=$(mktemp)
            jq "del(.worktrees[\"$worktree\"])" "$REGISTRY_PATH" > "$temp_registry"
            mv "$temp_registry" "$REGISTRY_PATH"
            
            print_success "Removed worktree: $worktree"
        done
        
        # Update lastUpdated timestamp
        temp_registry=$(mktemp)
        jq '.lastUpdated = now | .lastUpdated |= strftime("%Y-%m-%dT%H:%M:%S.000Z")' "$REGISTRY_PATH" > "$temp_registry"
        mv "$temp_registry" "$REGISTRY_PATH"
        
        print_success "Registry updated successfully"
    else
        print_status "No cleanup needed"
    fi
fi

# Show final registry status
echo ""
print_status "Registry summary:"
total_worktrees=$(echo "$registry_data" | jq '.worktrees | length')
active_worktrees=${#worktrees_to_update[@]}
inactive_worktrees=${#worktrees_to_remove[@]}

echo "  Total worktrees: $total_worktrees"
echo "  Active worktrees: $active_worktrees"
echo "  Inactive worktrees: $inactive_worktrees"

if [ "$DRY_RUN" = false ] && [ ${#worktrees_to_remove[@]} -gt 0 ]; then
    echo "  Worktrees removed: ${#worktrees_to_remove[@]}"
fi

echo ""
print_success "Cleanup process completed!"

