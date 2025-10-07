#!/bin/bash

# migrate-files.sh
# File migration script for Draco Sports Manager
# Downloads files from old FTP server and uploads to new storage provider

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../draco-nodejs/backend"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for required commands
    local missing_commands=()
    
    if ! command_exists node; then
        missing_commands+=("node")
    fi
    
    if ! command_exists npm; then
        missing_commands+=("npm")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        print_error "Please install the missing commands and try again."
        exit 1
    fi
    
    # Check Node.js version (need >= 18 for modern features)
    local node_version=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to setup dependencies
setup_dependencies() {
    print_status "Setting up dependencies..."
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    # Check if backend is built
    if [ ! -d "$BACKEND_DIR/dist" ]; then
        print_warning "Backend not built. Building now..."
        cd "$BACKEND_DIR"
        npm run build
        cd "$SCRIPT_DIR"
    fi
    
    # Check if Prisma client is generated
    if [ ! -d "$BACKEND_DIR/node_modules/.prisma/client" ]; then
        print_status "Generating Prisma client..."
        cd "$BACKEND_DIR"
        npx prisma generate
        cd "$SCRIPT_DIR"
    fi
    
    # Install migration dependencies if not already installed
    cd "$SCRIPT_DIR"
    if ! node -e "require('basic-ftp')" 2>/dev/null; then
        print_status "Installing migration dependencies..."
        npm init -y >/dev/null 2>&1 || true
        npm install basic-ftp dotenv @prisma/client 2>/dev/null
    fi
    
    print_success "Dependencies ready"
}

# Function to run the migration
run_migration() {
    print_status "Starting file migration..."
    
    # Environment variables will be loaded by dotenv in the TypeScript file
    # No need to export them here
    
    # Run the TypeScript migration script using tsx
    if command_exists tsx; then
        tsx "$SCRIPT_DIR/migrate-files.ts"
        return
    fi

    # Fall back to npx which will locate the workspace tsx binary without requiring a global install
    if command_exists npx; then
        if npx --yes --no-install tsx "$SCRIPT_DIR/migrate-files.ts"; then
            return
        fi
    fi

    if command_exists ts-node; then
        ts-node "$SCRIPT_DIR/migrate-files.ts"
        return
    fi

    # Fallback: compile and run using tsc if a runtime wasn't found
    if command_exists tsc; then
        print_status "Compiling TypeScript..."
        npx tsc "$SCRIPT_DIR/migrate-files.ts" --target es2022 --module es2022 --moduleResolution node --outDir "$SCRIPT_DIR/dist"
        node "$SCRIPT_DIR/dist/migrate-files.js"
        return
    fi

    print_error "No TypeScript runtime found. Please install tsx, ts-node, or ensure TypeScript is available"
    exit 1
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove any temporary files or directories created during migration
    local temp_dir="$SCRIPT_DIR/temp-migration"
    if [ -d "$temp_dir" ]; then
        rm -rf "$temp_dir"
    fi
    
    print_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "File migration script for Draco Sports Manager"
    echo "Downloads files from old FTP server and uploads to new storage provider"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --dry-run           Show what would be migrated without actually doing it"
    echo "  --check-only        Only check prerequisites and credentials"
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js 18+ and npm"
    echo "  - Built backend (npm run build in draco-nodejs/backend)"
    echo "  - FTP credentials in backend/.env file"
    echo ""
    echo "Environment Variables (in backend/.env):"
    echo "  FTP_HOST            FTP server hostname"
    echo "  FTP_USER            FTP username"
    echo "  FTP_PASSWORD        FTP password"
    echo "  STORAGE_PROVIDER    Storage provider (local or s3)"
    echo ""
}

# Main function
main() {
    local dry_run=false
    local check_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    echo "================================================"
    echo "Draco Sports Manager File Migration Script"
    echo "================================================"
    echo ""
    
    # Always check prerequisites and credentials
    check_prerequisites
    
    if [ "$check_only" = true ]; then
        print_success "All checks passed. Ready for migration."
        exit 0
    fi
    
    if [ "$dry_run" = true ]; then
        print_warning "DRY RUN MODE - No files will actually be migrated"
        export DRY_RUN=true
    fi
    
    setup_dependencies
    
    # Confirm before proceeding (unless dry run)
    if [ "$dry_run" = false ]; then
        echo ""
        read -p "Do you want to proceed with the file migration? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Migration cancelled by user"
            exit 0
        fi
    fi
    
    echo ""
    print_status "Beginning file migration process..."
    echo ""
    
    # Run the migration
    if ! run_migration; then
        print_error "File migration failed"
        exit 1
    fi
    
    cleanup
    
    echo ""
    echo "================================================"
    print_success "File migration completed successfully!"
    echo "================================================"
    echo ""
    print_status "Next steps:"
    echo "  1. Verify files are accessible in your application"
    echo "  2. Test image uploads and downloads"
    echo "  3. Update any hardcoded file paths in your application"
    echo ""
}

# Trap for cleanup on exit
trap cleanup EXIT

# Run main function with all arguments
main "$@"
