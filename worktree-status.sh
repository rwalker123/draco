#!/bin/bash

# Worktree Port Status Script
# This script displays current worktree port assignments and status
#
# Usage:
#   ./worktree-status.sh           # Show current status
#   ./worktree-status.sh --json    # Output in JSON format

set -e  # Exit on any error

# Parse command line arguments
JSON_OUTPUT=false
for arg in "$@"; do
    case $arg in
        --json)
            JSON_OUTPUT=true
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--help]"
            echo "  --json   Output status in JSON format"
            echo "  --help   Show this help message"
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
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Get the main repository path
MAIN_REPO_PATH="/Users/raywalker/source/Draco"
REGISTRY_PATH="$MAIN_REPO_PATH/draco-nodejs/.worktree-ports.json"

# Check if registry exists
if [ ! -f "$REGISTRY_PATH" ]; then
    print_error "Port registry not found at: $REGISTRY_PATH"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq to continue."
    exit 1
fi

# Load registry data
registry_data=$(cat "$REGISTRY_PATH")

# Function to check if port is currently in use
check_port_usage() {
    local port="$1"
    if netstat -an | grep LISTEN | grep ":$port " > /dev/null 2>&1; then
        echo "in-use"
    else
        echo "available"
    fi
}

# Function to get worktree git status
get_git_status() {
    local worktree_path="$1"
    if [ -d "$worktree_path" ]; then
        cd "$worktree_path" 2>/dev/null && git status --porcelain 2>/dev/null | wc -l | tr -d ' '
    else
        echo "0"
    fi
}

# Function to get worktree branch
get_git_branch() {
    local worktree_path="$1"
    if [ -d "$worktree_path" ]; then
        cd "$worktree_path" 2>/dev/null && git branch --show-current 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# Function to format timestamp
format_timestamp() {
    local timestamp="$1"
    if [ -n "$timestamp" ]; then
        date -j -f "%Y-%m-%dT%H:%M:%S.%3NZ" "$timestamp" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || 
        date -d "$timestamp" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || 
        echo "$timestamp"
    else
        echo "unknown"
    fi
}

# Function to show JSON output
show_json_status() {
    local registry_info=$(echo "$registry_data" | jq -r '.')
    local worktrees=$(echo "$registry_data" | jq -r '.worktrees | to_entries[] | [.key, .value] | @tsv' 2>/dev/null)
    
    local json_output="{"
    json_output+="\"registry\": $registry_info,"
    json_output+="\"worktrees\": ["
    
    local first=true
    if [ -n "$worktrees" ]; then
        while IFS=$'\t' read -r worktree_path worktree_data; do
            if [ "$first" = true ]; then
                first=false
            else
                json_output+=","
            fi
            
            local backend_port=$(echo "$worktree_data" | jq -r '.backendPort')
            local frontend_port=$(echo "$worktree_data" | jq -r '.frontendPort')
            local backend_status=$(check_port_usage "$backend_port")
            local frontend_status=$(check_port_usage "$frontend_port")
            local git_changes=$(get_git_status "$worktree_path")
            local git_branch=$(get_git_branch "$worktree_path")
            
            json_output+="{"
            json_output+="\"path\": \"$worktree_path\","
            json_output+="\"name\": \"$(echo "$worktree_data" | jq -r '.worktreeName')\","
            json_output+="\"backendPort\": $backend_port,"
            json_output+="\"frontendPort\": $frontend_port,"
            json_output+="\"backendStatus\": \"$backend_status\","
            json_output+="\"frontendStatus\": \"$frontend_status\","
            json_output+="\"gitChanges\": $git_changes,"
            json_output+="\"gitBranch\": \"$git_branch\","
            json_output+="\"lastActive\": \"$(format_timestamp "$(echo "$worktree_data" | jq -r '.lastActive')")\","
            json_output+="\"status\": \"$(echo "$worktree_data" | jq -r '.status')\""
            json_output+="}"
        done <<< "$worktrees"
    fi
    
    json_output+="]}"
    
    echo "$json_output" | jq '.'
}

# Function to show human-readable output
show_human_status() {
    # Show registry info
    print_header "Port Registry Status"
    echo "Registry Version: $(echo "$registry_data" | jq -r '.registryVersion')"
    echo "Last Updated: $(format_timestamp "$(echo "$registry_data" | jq -r '.lastUpdated')")"
    echo ""
    
    # Show port ranges
    print_header "Port Ranges"
    echo "Backend:  $(echo "$registry_data" | jq -r '.portRanges.backend.min')-$(echo "$registry_data" | jq -r '.portRanges.backend.max')"
    echo "Frontend: $(echo "$registry_data" | jq -r '.portRanges.frontend.min')-$(echo "$registry_data" | jq -r '.portRanges.frontend.max')"
    echo ""
    
    # Show worktrees
    local worktree_count=$(echo "$registry_data" | jq '.worktrees | length')
    
    if [ "$worktree_count" -gt 0 ]; then
        print_header "Worktree Port Assignments"
        echo ""
        
        # Table header
        printf "%-50s %-15s %-15s %-10s %-10s %-15s %-20s\n" "Worktree Path" "Backend Port" "Frontend Port" "Status" "Git Changes" "Git Branch" "Last Active"
        printf "%-50s %-15s %-15s %-10s %-10s %-15s %-20s\n" "-------------" "-------------" "--------------" "------" "-----------" "----------" "-----------"
        
        # Process each worktree individually
        echo "$registry_data" | jq -r '.worktrees | to_entries[] | .key' | while read -r worktree_path; do
            local worktree_data=$(echo "$registry_data" | jq -r ".worktrees[\"$worktree_path\"]")
            local worktree_name=$(echo "$worktree_data" | jq -r '.worktreeName')
            local backend_port=$(echo "$worktree_data" | jq -r '.backendPort')
            local frontend_port=$(echo "$worktree_data" | jq -r '.frontendPort')
            local status=$(echo "$worktree_data" | jq -r '.status')
            local last_active=$(format_timestamp "$(echo "$worktree_data" | jq -r '.lastActive')")
            
            # Check port usage
            local backend_status=$(check_port_usage "$backend_port")
            local frontend_status=$(check_port_usage "$frontend_port")
            
            # Get git info
            local git_changes=$(get_git_status "$worktree_path")
            local git_branch=$(get_git_branch "$worktree_path")
            
            # Format status indicators
            local backend_indicator=""
            if [ "$backend_status" = "in-use" ]; then
                backend_indicator="${GREEN}●${NC}"
            else
                backend_indicator="${YELLOW}○${NC}"
            fi
            
            local frontend_indicator=""
            if [ "$frontend_status" = "in-use" ]; then
                frontend_indicator="${GREEN}●${NC}"
            else
                frontend_indicator="${YELLOW}○${NC}"
            fi
            
            # Format git changes
            local changes_indicator=""
            if [ "$git_changes" -gt 0 ]; then
                changes_indicator="${YELLOW}$git_changes${NC}"
            else
                changes_indicator="${GREEN}0${NC}"
            fi
            
            # Truncate worktree path for display
            local display_path=$(echo "$worktree_path" | sed "s|$MAIN_REPO_PATH|~|")
            if [ ${#display_path} -gt 49 ]; then
                display_path="...${display_path: -46}"
            fi
            
            printf "%-50s %-15s %-15s %-10s %-10s %-15s %-20s\n" \
                "$display_path" \
                "$backend_port $backend_indicator" \
                "$frontend_port $frontend_indicator" \
                "$status" \
                "$changes_indicator" \
                "$git_branch" \
                "$last_active"
        done
        
        echo ""
        print_header "Port Status Legend"
        echo "● Port is currently in use"
        echo "○ Port is available"
        echo ""
        
        print_header "Git Changes Legend"
        echo "Green (0): No uncommitted changes"
        echo "Yellow (>0): Has uncommitted changes"
        echo ""
        
    else
        print_warning "No worktrees found in registry"
    fi
    
    # Show summary
    local total_worktrees=$(echo "$registry_data" | jq '.worktrees | length')
    local active_worktrees=$(echo "$registry_data" | jq '.worktrees | map(select(.status == "active")) | length')
    local inactive_worktrees=$(echo "$registry_data" | jq '.worktrees | map(select(.status == "inactive")) | length')
    
    print_header "Summary"
    echo "Total worktrees: $total_worktrees"
    echo "Active worktrees: $active_worktrees"
    echo "Inactive worktrees: $inactive_worktrees"
    
    # Check for potential issues
    echo ""
    print_header "Health Check"
    
    local conflicts=$(echo "$registry_data" | jq -r '.worktrees | to_entries | group_by(.value.backendPort) | map(select(length > 1)) | length')
    if [ "$conflicts" -gt 0 ] && [ "$conflicts" != "null" ]; then
        print_warning "Backend port conflicts detected: $conflicts"
    else
        print_success "No backend port conflicts"
    fi
    
    local conflicts=$(echo "$registry_data" | jq -r '.worktrees | to_entries | group_by(.value.frontendPort) | map(select(length > 1)) | length')
    if [ "$conflicts" -gt 0 ] && [ "$conflicts" != "null" ]; then
        print_warning "Frontend port conflicts detected: $conflicts"
    else
        print_success "No frontend port conflicts"
    fi
    
    # Show management commands
    echo ""
    print_header "Management Commands"
    echo "View detailed status: ./worktree-status.sh"
    echo "Clean up registry:   ./worktree-cleanup.sh"
    echo "Dry run cleanup:     ./worktree-cleanup.sh --dry-run"
}

# Main execution
if [ "$JSON_OUTPUT" = true ]; then
    show_json_status
else
    show_human_status
fi
