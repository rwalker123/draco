#!/bin/bash

# migrate-database.sh
# Automated database migration script for Draco Sports Manager
# This script automates the 4-step migration process from ASP.NET to Node.js

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-ezrecsports}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASS="${POSTGRES_PASS:-}"

SQLSERVER_HOST="${SQLSERVER_HOST:-}"
SQLSERVER_PORT="${SQLSERVER_PORT:-1433}"
SQLSERVER_DB="${SQLSERVER_DB:-}"
SQLSERVER_USER="${SQLSERVER_USER:-}"
SQLSERVER_PASS="${SQLSERVER_PASS:-}"

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
    
    if ! command_exists psql; then
        missing_commands+=("psql")
    fi
    
    if ! command_exists docker; then
        missing_commands+=("docker")
    fi
    
    if ! command_exists curl; then
        missing_commands+=("curl")
    fi
    
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
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to prompt for missing environment variables
prompt_for_credentials() {
    print_status "Checking database credentials..."
    
    # SQL Server credentials
    if [ -z "$SQLSERVER_HOST" ]; then
        read -p "SQL Server Host: " SQLSERVER_HOST
    fi
    
    if [ -z "$SQLSERVER_DB" ]; then
        read -p "SQL Server Database: " SQLSERVER_DB
    fi
    
    if [ -z "$SQLSERVER_USER" ]; then
        read -p "SQL Server Username: " SQLSERVER_USER
    fi
    
    if [ -z "$SQLSERVER_PASS" ]; then
        read -s -p "SQL Server Password: " SQLSERVER_PASS
        echo
    fi
    
    # PostgreSQL password if not set
    if [ -z "$POSTGRES_PASS" ]; then
        print_warning "PostgreSQL password not set. You may be prompted for it during database operations."
    fi
}

# Function to create PostgreSQL database
create_postgres_database() {
    print_status "Creating PostgreSQL database '$POSTGRES_DB'..."
    
    # Drop database if it exists
    if PGPASSWORD="$POSTGRES_PASS" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
        print_warning "Database '$POSTGRES_DB' already exists. Dropping it..."
        PGPASSWORD="$POSTGRES_PASS" dropdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB"
    fi
    
    # Create new database
    PGPASSWORD="$POSTGRES_PASS" createdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB"
    
    print_success "PostgreSQL database '$POSTGRES_DB' created successfully"
}

# Function to create PostgreSQL schema
create_postgres_schema() {
    print_status "Creating PostgreSQL schema..."
    
    local schema_file="$SCRIPT_DIR/create-postgres-tables.sql"
    if [ ! -f "$schema_file" ]; then
        print_error "Schema file not found: $schema_file"
        exit 1
    fi
    
    PGPASSWORD="$POSTGRES_PASS" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$schema_file"
    
    print_success "PostgreSQL schema created successfully"
}

# Function to migrate data using sqlpipe
migrate_data() {
    print_status "Starting data migration from SQL Server to PostgreSQL..."
    
    # Export environment variables for sqlpipe script
    export POSTGRES_HOST POSTGRES_PORT POSTGRES_DB POSTGRES_USER POSTGRES_PASS
    export SQLSERVER_HOST SQLSERVER_PORT SQLSERVER_DB SQLSERVER_USER SQLSERVER_PASS
    
    local sqlpipe_script="$SCRIPT_DIR/sqlpipe-migration.sh"
    if [ ! -f "$sqlpipe_script" ]; then
        print_error "SQLPipe migration script not found: $sqlpipe_script"
        exit 1
    fi
    
    # Make sure script is executable
    chmod +x "$sqlpipe_script"
    
    # Run the migration
    "$sqlpipe_script"
    
    print_success "Data migration completed successfully"
}

# Function to run post-migration setup
run_post_migration() {
    print_status "Running post-migration setup (SQL + Prisma integration)..."
    
    local post_migration_script="$SCRIPT_DIR/post-migration.sh"
    if [ ! -f "$post_migration_script" ]; then
        print_error "Post-migration script not found: $post_migration_script"
        exit 1
    fi
    
    # Make sure script is executable
    chmod +x "$post_migration_script"
    
    # Set environment variables for post-migration script
    export DB_HOST="$POSTGRES_HOST"
    export DB_PORT="$POSTGRES_PORT"
    export DB_NAME="$POSTGRES_DB"
    export DB_USER="$POSTGRES_USER"
    export DB_PASSWORD="$POSTGRES_PASS"
    export DATABASE_URL="postgresql://$POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
    
    # Run the post-migration script
    "$post_migration_script"
    
    if [ $? -eq 0 ]; then
        print_success "Post-migration setup completed successfully"
    else
        print_error "Post-migration setup failed"
        exit 1
    fi
}

# Function to validate migration
validate_migration() {
    print_status "Validating migration..."
    
    # Check if key tables exist and have data
    local validation_query="
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as row_count
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
    "
    
    print_status "Table row counts:"
    PGPASSWORD="$POSTGRES_PASS" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$validation_query"
    
    # Check for email tables (created by Prisma in post-migration)
    print_status "Checking for email tables..."
    local email_table_count=$(PGPASSWORD="$POSTGRES_PASS" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('emails', 'email_templates', 'email_recipients', 'email_attachments', 'email_events');" | xargs)
    
    if [ "$email_table_count" -eq "5" ]; then
        print_success "All 5 email tables found"
    else
        print_warning "Expected 5 email tables, found $email_table_count"
    fi
    
    # Check for password reset tokens table (created in post-migration SQL)
    local password_reset_exists=$(PGPASSWORD="$POSTGRES_PASS" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'passwordresettokens'
    );" | xargs)
    
    if [ "$password_reset_exists" = "t" ]; then
        print_success "Password reset tokens table found"
    else
        print_warning "Password reset tokens table not found"
    fi
    
    print_success "Migration validation completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Automated database migration script for Draco Sports Manager"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --validate-only     Only run validation, skip migration"
    echo "  --skip-create-db    Skip database creation step"
    echo ""
    echo "Environment Variables:"
    echo "  PostgreSQL:"
    echo "    POSTGRES_HOST       PostgreSQL host (default: localhost)"
    echo "    POSTGRES_PORT       PostgreSQL port (default: 5432)"
    echo "    POSTGRES_DB         PostgreSQL database name (default: ezrecsports)"
    echo "    POSTGRES_USER       PostgreSQL username (default: postgres)"
    echo "    POSTGRES_PASS       PostgreSQL password"
    echo ""
    echo "  SQL Server:"
    echo "    SQLSERVER_HOST      SQL Server host"
    echo "    SQLSERVER_PORT      SQL Server port (default: 1433)"
    echo "    SQLSERVER_DB        SQL Server database name"
    echo "    SQLSERVER_USER      SQL Server username"
    echo "    SQLSERVER_PASS      SQL Server password"
    echo ""
    echo "Example:"
    echo "  export SQLSERVER_HOST='sql.example.com'"
    echo "  export SQLSERVER_DB='mydb'"
    echo "  export SQLSERVER_USER='myuser'"
    echo "  export SQLSERVER_PASS='mypass'"
    echo "  $0"
}

# Main function
main() {
    local validate_only=false
    local skip_create_db=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --validate-only)
                validate_only=true
                shift
                ;;
            --skip-create-db)
                skip_create_db=true
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
    echo "Draco Sports Manager Database Migration Script"
    echo "================================================"
    echo ""
    
    # If validate only, just run validation
    if [ "$validate_only" = true ]; then
        check_prerequisites
        validate_migration
        exit 0
    fi
    
    # Run full migration
    check_prerequisites
    prompt_for_credentials
    
    echo ""
    print_status "Starting migration with the following settings:"
    echo "  PostgreSQL: $POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
    echo "  SQL Server: $SQLSERVER_USER@$SQLSERVER_HOST:$SQLSERVER_PORT/$SQLSERVER_DB"
    echo ""
    
    # Confirm before proceeding
    read -p "Do you want to proceed with the migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Migration cancelled by user"
        exit 0
    fi
    
    echo ""
    print_status "Beginning migration process..."
    echo ""
    
    # Step 1: Create PostgreSQL database
    if [ "$skip_create_db" = false ]; then
        create_postgres_database
    else
        print_warning "Skipping database creation as requested"
    fi
    
    # Step 2: Create schema
    create_postgres_schema
    
    # Step 3: Migrate data
    migrate_data
    
    # Step 4: Post-migration setup
    run_post_migration
    
    # Step 5: Validate
    validate_migration
    
    echo ""
    echo "================================================"
    print_success "Database migration completed successfully!"
    echo "================================================"
    echo ""
    print_status "Next steps:"
    echo "  1. The database is now ready with all tables, constraints, and Prisma integration"
    echo "  2. Start the backend server: 'npm run backend:dev' from the root directory"
    echo "  3. Test your application with the migrated data"
    echo "  4. Plan for file migration from the old system to your storage provider"
    echo ""
}

# Run main function with all arguments
main "$@"