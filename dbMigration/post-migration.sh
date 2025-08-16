#!/bin/bash

# Post-migration script to apply SQL updates and Prisma schema changes
# This script runs after the main database migration to ensure everything is in sync

set -e  # Exit on error

echo "========================================="
echo "Starting post-migration updates..."
echo "========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load database connection from environment or use defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ezrecsports}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Step 1: Execute SQL post-migration script (with idempotency check)
echo ""
echo "Step 1: Checking SQL post-migration status..."
echo "----------------------------------------"

SQL_FILE="$SCRIPT_DIR/post-migration.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE"
    exit 1
fi

# Build psql command with password if provided
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Check if SQL post-migration has already been applied
# We use passwordresettokens table as indicator since it's created at the end of the SQL script
echo "Checking if SQL post-migration has already been applied..."
SQL_ALREADY_APPLIED=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'passwordresettokens'
);" 2>/dev/null | xargs)

if [ "$SQL_ALREADY_APPLIED" = "t" ]; then
    echo "✓ SQL post-migration already applied, skipping..."
else
    echo "Applying SQL post-migration script..."
    echo "Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT as user $DB_USER"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" -v ON_ERROR_STOP=1

    if [ $? -eq 0 ]; then
        echo "✓ SQL post-migration completed successfully"
    else
        echo "✗ SQL post-migration failed"
        exit 1
    fi
fi

# Step 2: Run Prisma updates
echo ""
echo "Step 2: Running Prisma schema updates..."
echo "----------------------------------------"

# Change to backend directory where Prisma is configured
cd "$SCRIPT_DIR/../draco-nodejs/backend" || exit 1

echo "Working directory: $(pwd)"

# Set DATABASE_URL for Prisma if not already set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo "Setting DATABASE_URL: $DATABASE_URL"
fi

# Generate Prisma client with latest schema
echo "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✓ Prisma client generated successfully"
else
    echo "✗ Prisma client generation failed"
    exit 1
fi

# Detect if this is development (no migration files) or production/repeat (migration files exist)
MIGRATIONS_DIR="$SCRIPT_DIR/../draco-nodejs/backend/prisma/migrations"

if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
    # Migration files exist - this is production/deployment scenario
    echo "Migration files detected - applying existing migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✓ Existing migrations applied successfully"
    else
        echo "✗ Migration deployment failed"
        exit 1
    fi
else
    # No migration files - this is development/first time scenario on existing database
    echo "No migration files found - using db push for existing database with new email tables..."
    
    # For existing databases, use db push to add new tables without migration history
    echo "Pushing schema changes (including new email tables) to existing database..."
    npx prisma db push --accept-data-loss
    
    if [ $? -eq 0 ]; then
        echo "✓ Schema changes pushed successfully (email tables created)"
        echo "📝 Note: Using db push for existing database - no migration files created"
        echo "⚠️  To enable migrations in the future, run 'prisma migrate dev' after this setup"
    else
        echo "✗ Schema push failed"
        exit 1
    fi
fi

# Step 3: Verify the updates
echo ""
echo "Step 3: Verifying database updates..."
echo "----------------------------------------"

# Check if email tables were created
echo "Checking for email tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('emails', 'email_templates', 'email_recipients', 'email_attachments', 'email_events');" | xargs

TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('emails', 'email_templates', 'email_recipients', 'email_attachments', 'email_events');" | xargs)

if [ "$TABLE_COUNT" -eq "5" ]; then
    echo "✓ All 5 email tables created successfully"
else
    echo "⚠ Warning: Expected 5 email tables, found $TABLE_COUNT"
fi

# Clear password from environment
unset PGPASSWORD

echo ""
echo "========================================="
echo "Post-migration updates completed!"
echo "========================================="
echo ""
echo "Summary:"
echo "  - SQL post-migration fixes applied"
echo "  - Prisma schema synchronized"
echo "  - Email tables created (if not existing)"
echo "  - Database is ready for use"
echo ""
echo "Next steps:"
echo "  1. Restart the backend server to use updated Prisma client"
echo "  2. Run 'npm run dev' from the root directory"