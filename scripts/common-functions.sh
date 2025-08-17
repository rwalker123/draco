#!/bin/bash

# Common Functions for Draco Worktree Scripts
# This file contains shared utility functions used across multiple scripts

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

# Function to find the main repository path
# This function searches up the directory tree to find a directory containing draco-nodejs
find_main_repo() {
    local current="$1"
    local max_depth=10
    local depth=0
    
    while [ "$depth" -lt "$max_depth" ] && [ "$current" != "/" ]; do
        # Check if current directory has a "draco" subdirectory
        for draco_dir in "$current"/[Dd]raco; do
            if [ -d "$draco_dir" ]; then
                # Check if this draco directory has draco-nodejs subdirectory
                if [ -d "$draco_dir/draco-nodejs" ]; then
                    echo "$draco_dir"
                    return 0
                fi
            fi
        done
        current=$(dirname "$current")
        depth=$((depth + 1))
    done
    
    return 1
}