
# Database Migration

## Automated Migration (Recommended)

Use the automated migration script:

```bash
# Set environment variables for SQL Server source
export SQLSERVER_HOST="your-sql-server-host"
export SQLSERVER_DB="your-database-name"
export SQLSERVER_USER="your-username"
export SQLSERVER_PASS="your-password"

# Optional: Set PostgreSQL target (defaults shown)
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_DB="ezrecsports"
export POSTGRES_USER="postgres"
export POSTGRES_PASS="your-postgres-password"

# Run the migration
./migrate-database.sh
```

## File Migration (Step 2)

After database migration, migrate files from the old FTP server:

```bash
# Ensure backend is built first
cd ../draco-nodejs/backend
npm run build
cd ../../dbMigration

# Install file migration dependencies
npm install

# Check prerequisites and credentials
./migrate-files.sh --check-only

# Run dry run to see what would be migrated
./migrate-files.sh --dry-run

# Run actual file migration
./migrate-files.sh
```

**Note**: The file migration script needs additional implementation for filename-to-ID mapping. Currently, it provides a framework that needs customization based on your actual file naming conventions.

## Manual Steps (Legacy)

If you need to run the migration manually:

- Create a clean db in postgres (named ezrecsports)
- Run the create-postgres-tables.sql
- run sqlpipe-migration.sh to migrate the data
- run the post-migration.sql

## Files

### Database Migration
- `migrate-database.sh` - Main automated database migration script
- `sqlpipe-migration.sh` - Data migration using SQLPipe (uses environment variables)
- `create-postgres-tables.sql` - PostgreSQL schema creation
- `post-migration.sh` - Post-migration setup script (SQL fixes + Prisma integration)
- `post-migration.sql` - SQL post-migration fixes (foreign keys, constraints, indexes)

### File Migration
- `migrate-files.sh` - Main automated file migration script
- `migrate-files.ts` - Node.js file migration application
- `package.json` - Dependencies for file migration

## Prerequisites

### Database Migration
- PostgreSQL client (`psql`)
- Docker (for SQLPipe)
- Node.js and npm (for Prisma integration)
- Access to both source SQL Server and target PostgreSQL databases

### File Migration
- Node.js 20.19+ and npm
- FTP access to source server
- Built backend application (`npm run build` in draco-nodejs/backend)
- FTP credentials in backend/.env file
