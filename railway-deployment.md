# Railway Deployment Guide

This guide covers deploying the Draco application to Railway, including environment setup, database migration, and production cut-over procedures.

> **Source**: Derived from `docs/railway-deployment-plan.md`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Service Configuration](#service-configuration)
4. [Database Migration](#database-migration)
5. [File Uploads Migration](#file-uploads-migration)
6. [Validation & Testing](#validation--testing)
7. [Production Deployment](#production-deployment)
8. [Post-Launch Operations](#post-launch-operations)
9. [Prisma Migration Baseline](#prisma-migration-baseline)
10. [References](#references)

---

## Prerequisites

Before starting deployment, ensure the following are in place:

1. **Railway CLI Access**: Install the Railway CLI and authenticate
   ```bash
   railway login
   ```

2. **Repository Linkage**: Link your local repository to Railway
   ```bash
   railway init
   railway link
   ```

3. **Secrets Inventory**: Gather all required secrets and store them securely:
   - JWT secret
   - Hashing rounds configuration
   - Third-party API keys (email providers, etc.)

4. **Team Alignment**: Confirm deployment milestones with DevOps lead, QA, and Engineering

---

## Environment Setup

### Creating the Development Environment

1. **Verify project access and create the environment**:
   ```bash
   railway list                        # Confirm accessible projects
   railway link                        # Link repo to project
   railway environment new Development # Create environment (if needed)
   railway environment Development     # Switch CLI context
   ```

2. **Provision core services**:
   ```bash
   railway add -d postgres --service draco-postgres
   railway add --service draco-backend    # Select Node.js template
   railway add --service draco-frontend   # Select Next.js template
   ```

3. **Create the uploads volume**:
   ```bash
   railway service draco-backend
   railway volume add --mount-path /app/uploads
   ```

4. **Environment settings** (via Railway Dashboard → Environment settings):
   - Tag environment as "Development"
   - Disable preview deployments

---

## Service Configuration

### Build and Start Commands

Configure these in Railway Dashboard → Service → Deploy tab:

#### Backend Service
| Setting | Value |
|---------|-------|
| Build Command | `npm run build -w @draco/shared-schemas && npm run sync:api && npm run build -w @draco/backend` |
| Start Command | `npm run start -w @draco/backend` |

#### Frontend Service
| Setting | Value |
|---------|-------|
| Build Command | `npm run build -w @draco/shared-schemas && npm run sync:api && npm run build -w @draco/frontend-next` |
| Start Command | `npm run start -w @draco/frontend-next` |

### Install-Time Environment Variables

Set these in Railway Dashboard → Service → Variables:

#### Backend Service
| Variable | Value |
|----------|-------|
| `RAILPACK_INSTALL_CMD` | `npm install --workspaces --include-workspace-root && npm run backend:prisma-generate` |
| `HUSKY` | `0` |

#### Frontend Service
| Variable | Value |
|----------|-------|
| `RAILPACK_INSTALL_CMD` | `npm install --workspaces --include-workspace-root` |

### GitHub Integration

Configure in Railway Dashboard → Service → Deploy tab:

1. Select repository: `Draco`
2. Set branch to `main`
3. Leave "Wait for CI" **off** for immediate deploys
4. Verify build/start commands match the values above

### Runtime Environment Variables

#### Backend Service
```bash
railway variables set \
  DATABASE_URL="<dev postgres connection string>" \
  NODE_ENV=production \
  PORT=3001 \
  JWT_SECRET="<dev JWT secret>" \
  UPLOAD_PATH=/app/uploads \
  HUSKY=0 \
  RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10 \
  RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300 \
  RAILWAY_DEPLOYMENT_DRAINING_SECONDS=30 \
  --service draco-backend
```

#### Frontend Service
```bash
# Get backend's private domain
BACKEND_PRIVATE_DOMAIN=$(railway variables --service draco-backend --json | jq -r '.RAILWAY_PRIVATE_DOMAIN // empty')

railway variables set \
  NEXT_PUBLIC_API_URL="https://${BACKEND_PRIVATE_DOMAIN}" \
  NODE_ENV=production \
  --service draco-frontend
```

> **Note**: If the backend hasn't been deployed yet, set `NEXT_PUBLIC_API_URL` via the dashboard using Railway's variable interpolation: `${Backend.RAILWAY_PRIVATE_DOMAIN}`

---

## Database Migration

Use the `railway-db-restore.sh` script to create dumps and restore them to Railway.

### Creating a Database Dump

```bash
./scripts/railway-db-restore.sh dump
```

This creates a timestamped dump file (e.g., `draco-dev-2025-12-23.dump`) from the local database and verifies its contents.

To use a custom source database:

```bash
./scripts/railway-db-restore.sh dump -s "postgresql://user:pass@localhost:5432/mydb"
```

### Restoring to Railway

```bash
# Restore to Development environment (default)
./scripts/railway-db-restore.sh restore -f draco-dev-2025-12-23.dump

# Restore to Production environment
./scripts/railway-db-restore.sh restore -e Production -f draco-dev-2025-12-23.dump
```

The script will:
- Fetch the `DATABASE_URL` from the Railway Postgres service
- Prompt for confirmation before overwriting the database
- Restore the dump with `--clean --if-exists --no-owner` flags

---

## File Uploads Migration

### Creating the Uploads Archive

```bash
export SNAPSHOT_DATE=$(date +%F)

# Create tarball from uploads directory
tar -czf "draco-uploads-${SNAPSHOT_DATE}.tar.gz" -C /path/to/uploads .
```

### Transferring via GitHub Release

1. **Create a temporary release and upload the archive**:
   ```bash
   gh release create temp-upload --notes ""
   gh release upload temp-upload "draco-uploads-${SNAPSHOT_DATE}.tar.gz"
   gh release view temp-upload --json assets --jq '.assets[0].url'
   ```

2. **Download and extract on Railway**:

   Run the uploads migration script with your snapshot date:

   ```bash
   ./scripts/railway-uploads.sh 2025-12-23
   ```

   This script will:
   - SSH into the Railway backend service
   - Download the archive from the GitHub release
   - Clear the existing `/app/uploads` directory
   - Extract the archive and verify the contents

3. **Clean up the temporary release**:
   ```bash
   gh release delete temp-upload --cleanup-tag
   rm "draco-uploads-${SNAPSHOT_DATE}.tar.gz"
   ```

### Delta Sync (Optional)

If the legacy system remains live during validation, implement an hourly `rsync` script to capture incremental changes.

---

## Validation & Testing

### Connectivity Test

Test backend connectivity from the frontend container:

```bash
railway ssh --service draco-frontend

node -e "require('http').get('http://draco-backend.railway.internal:8080/health', res => { console.log('status:', res.statusCode); res.resume(); }).on('error', err => { console.error('request error:', err); });"
```

### Smoke Tests

Perform these validations on the Development environment:

1. **CI Gate**: Run before promoting artifacts
   ```bash
   npm run test
   npm run lint --workspaces
   ```

2. **Functional Tests**:
   - API tenant flows
   - Frontend tenant switching
   - File upload round-trip

3. **Observability**:
   - Enable logs/metrics streaming
   - Verify visibility in Railway dashboard or external sink

4. **Incident Preparedness**:
   - Document rollback steps
   - Test database snapshot restoration

5. **Resource Tuning**:
   - Adjust instance sizing based on usage
   - Configure auto-sleep windows for cost optimization

---

## Production Deployment

### Environment Preparation

1. Clone validated Development services to Production environment (or reprovision with identical configuration)
2. Pin Docker image/artifact versions for Backend and Frontend
3. Import Production-specific secrets (keep separate from Development)
4. **Disable auto-deploy** — require manual promotion from Development
5. Attach Production domain (`draco-sports-manager.railway.app`)
6. Pre-stage tenant custom domains
7. Enable backups and alerting hooks

### Cut-Over Procedure

1. **Schedule maintenance window** and notify stakeholders
2. **Restore database** to Production Postgres using validated snapshot
3. **Sync uploads volume** and verify integrity
4. **Run promotion checklist**:
   - Migration idempotency
   - Cache TTL review
   - Error logs clean
5. **Promote deployment** manually to Production
6. **Swap DNS** and validate `/api/accounts/by-domain` flow for each tenant

---

## Post-Launch Operations

### First Week Monitoring

- Monitor logs, metrics, and tenant signup flows daily
- Tune scaling thresholds as needed

### Ongoing Operations

- Confirm backups are executing on schedule
- Verify alert hooks are firing correctly
- Capture follow-up tasks and feed back into backlog:
  - Automation improvements
  - Cost optimization opportunities

---

## Prisma Migration Baseline

When applying migrations on databases with existing tables (e.g., email sender metadata migration):

### Step 1: Apply SQL Manually

```bash
railway run --service draco-backend \
  "psql \"$DATABASE_URL\" -f draco-nodejs/backend/prisma/migrations/20240710120000_add_email_sender_metadata/migration.sql"
```

### Step 2: Mark Migration as Applied

```bash
railway run --service draco-backend \
  "npm exec --workspace @draco/backend -- prisma migrate resolve --applied 20240710120000_add_email_sender_metadata"
```

### Step 3: Resume Normal Migration Flow

```bash
railway run --service draco-backend \
  "npm exec --workspace @draco/backend -- prisma migrate deploy"
```

> **Important**: Run these steps once per Railway environment (Development, Production) before relying on auto-deploys for migrations.

---

## References

- **Source Plan**: `docs/railway-deployment-plan.md`
- **Railway Documentation**: https://railway.app/docs
