#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

usage() {
    cat <<EOF
Usage: $(basename "$0") [options] <command>

Manages database dumps and restores for Railway deployment.

Commands:
    dump        Create a database dump from the local Postgres instance
    restore     Restore a dump file to a Railway Postgres service

Options:
    -e, --environment   Railway environment (default: Development)
    -f, --file          Path to dump file (required for restore, auto-generated for dump)
    -s, --source-db     Source database URL for dump (default: postgresql://postgres@localhost:5432/ezrecsports)
    -h, --help          Show this help message

Examples:
    # Create a dump from local database
    $(basename "$0") dump

    # Create a dump with custom source
    $(basename "$0") dump -s "postgresql://user:pass@localhost:5432/mydb"

    # Restore to Railway Development environment
    $(basename "$0") restore -f draco-dev-2025-12-23.dump

    # Restore to Railway Production environment
    $(basename "$0") restore -e Production -f draco-dev-2025-12-23.dump

Prerequisites:
    - PostgreSQL client tools (pg_dump, pg_restore)
    - Railway CLI installed and authenticated (railway login)
    - jq installed for JSON parsing
EOF
    exit 1
}

ENVIRONMENT="Development"
DUMP_FILE=""
SOURCE_DB="postgresql://postgres@localhost:5432/ezrecsports"
COMMAND=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--file)
            DUMP_FILE="$2"
            shift 2
            ;;
        -s|--source-db)
            SOURCE_DB="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        dump|restore)
            COMMAND="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -z "$COMMAND" ]; then
    print_error "Missing required command: dump or restore"
    usage
fi

check_dependencies() {
    local missing=()

    if ! command -v pg_dump &> /dev/null; then
        missing+=("pg_dump")
    fi

    if ! command -v pg_restore &> /dev/null; then
        missing+=("pg_restore")
    fi

    if ! command -v psql &> /dev/null; then
        missing+=("psql")
    fi

    if ! command -v railway &> /dev/null; then
        missing+=("railway")
    fi

    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi
}

do_dump() {
    print_header "Database Dump"

    local snapshot_date
    snapshot_date=$(date +%F)

    if [ -z "$DUMP_FILE" ]; then
        DUMP_FILE="draco-dev-${snapshot_date}.dump"
    fi

    print_status "Source database: $SOURCE_DB"
    print_status "Output file: $DUMP_FILE"

    print_status "Creating database dump..."
    pg_dump --format=c --no-owner --clean --if-exists \
        --dbname="$SOURCE_DB" \
        --file="$DUMP_FILE"

    print_status "Verifying dump file..."
    pg_restore --list "$DUMP_FILE" | head -20

    local file_size
    file_size=$(du -h "$DUMP_FILE" | cut -f1)

    print_success "Dump complete: $DUMP_FILE ($file_size)"
    echo ""
    print_status "To restore this dump to Railway, run:"
    echo "  $(basename "$0") restore -f $DUMP_FILE"
}

do_restore() {
    print_header "Database Restore to Railway"

    if [ -z "$DUMP_FILE" ]; then
        print_error "Missing required option: -f/--file"
        usage
    fi

    if [ ! -f "$DUMP_FILE" ]; then
        print_error "Dump file not found: $DUMP_FILE"
        exit 1
    fi

    print_status "Environment: $ENVIRONMENT"
    print_status "Dump file: $DUMP_FILE"

    print_status "Fetching Railway DATABASE_PUBLIC_URL..."
    local railway_db_url
    railway_db_url=$(railway variables --service Postgres --environment "$ENVIRONMENT" --json | jq -r '.DATABASE_PUBLIC_URL')

    if [ -z "$railway_db_url" ] || [ "$railway_db_url" = "null" ]; then
        print_error "Failed to fetch DATABASE_PUBLIC_URL from Railway."
        print_error "Ensure the Postgres service has a public TCP proxy enabled:"
        print_error "  Railway Dashboard → Postgres → Settings → Networking → Public Network"
        exit 1
    fi

    print_status "Using public endpoint for external connection"
    print_warning "Note: External connections incur network egress fees"

    print_warning "This will overwrite the existing database in the $ENVIRONMENT environment."
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled."
        exit 0
    fi

    print_status "Dropping all existing tables..."
    psql "$railway_db_url" <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
EOF

    print_status "Restoring database..."
    pg_restore --no-owner --dbname="$railway_db_url" "$DUMP_FILE"

    print_success "Database restore complete!"
}

check_dependencies

case $COMMAND in
    dump)
        do_dump
        ;;
    restore)
        do_restore
        ;;
esac
