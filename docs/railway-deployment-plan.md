# Railway Deployment Strategy

## Overview
This document is the authoritative reference for delivering the Draco platform on Railway. It consolidates the prior "phase two" planning notes and layers in environment strategy, operational runbooks, and pricing expectations so stakeholders can confidently schedule the rollout.

## Environment Strategy
| Environment | Purpose | Railway Project Layout | Key Safeguards |
|-------------|---------|------------------------|----------------|
| **Development** | Low-traffic validation of migrations, integrations, and feature toggles. | Shared Railway project with isolated "Development" environment, one service per component (Postgres, Backend, Frontend, File storage volume). | Daily auto-sleep windows, capped instance size (Starter plan), branch-based preview deployments disabled to limit spend. |
| **Production** | Customer-facing workloads, scaling for multi-tenant usage. | Dedicated Railway environment with identical service composition and pinned versions of Docker images/artifacts. | Manual promotion workflow, backups enabled, production-only env vars/secrets, alerting hooks for uptime and error budgets. |

> **Recommendation:** Stand up the Development environment first to validate the provisioning scripts and to refine resource sizing before promoting to Production. Once stable, clone the services into the Production environment and swap the DNS to the production frontend domain.

## Service Topology
The stack mirrors the previously defined multi-service architecture and keeps the components decoupled so each can scale independently:

- **PostgreSQL database** with a persistent volume mounted at `/var/lib/postgresql/data`.
- **Backend API** (Node.js/Express) exposing tenant-aware REST APIs and mounting a Railway volume for uploads at `/app/uploads`.
- **Frontend** (Next.js) serving the multi-tenant web app and consuming the backend via the private or public Railway domain.
- **File storage volume** dedicated to tenant uploads for durability across deployments.

## Data Migration & Seeding
Preserve continuity from the existing platform by preparing and importing historical data before cutting traffic to Railway.

- **Database snapshot**
  - Use `pg_dump --format=custom` against the legacy production database to generate an encrypted snapshot (store the key in a password manager).
  - Verify the dump locally with `pg_restore --list` to confirm all schemas and extensions are captured.
  - Restore the dump into the Railway **Development** Postgres service first (`railway run pg_restore --clean --no-owner --dbname=$DATABASE_URL dump_file.dump`) to validate migrations and data access patterns.
  - After smoke testing, repeat the restore in the **Production** environment during a scheduled maintenance window so that tenant data is already present when DNS is flipped.
- **Uploads volume**
  - Archive the existing uploads directory from the legacy host (for example, `tar -czf uploads-$(date +%F).tar.gz /var/www/draco/uploads`).
  - Stage the archive in object storage or a secure bucket, then use `railway volume upload` or `railway run` with `scp`/`curl` to copy the tarball into the Railway uploads volume mounted at `/app/uploads`.
  - Extract the archive in place (`tar -xzf uploads-*.tar.gz --strip-components=3 -C /app/uploads`) and remove the tarball after verifying file counts to keep the volume tidy.
  - Document a delta sync plan (e.g., rsync the directory hourly) if the legacy site must remain live while the Railway environment is being validated.

## Deployment Workflow
1. **Bootstrap the Railway project**
   - Authenticate with `railway login` and create/link the repository using `railway init` and `railway link`.
   - Provision services with the CLI commands in the appendix (`railway add`, `railway add -d postgres`).
   - Tag the environment as "Development" inside the Railway dashboard so secrets and metrics stay scoped.
2. **Configure environment variables and secrets**
   - Import shared secrets (JWT secret, hashing rounds, etc.) through Railway's Variables UI or via `railway variables set`.
   - Map `DATABASE_URL` to the managed Postgres connection string and point `NEXT_PUBLIC_API_URL` to the backend domain exposed by Railway.
   - Store per-environment overrides in separate groups to avoid accidental cross-promotion.
3. **Set up persistent storage**
   - Attach the managed Postgres volume for data durability.
   - Create a dedicated volume (e.g., `draco-uploads`) for user-generated assets and mount it into the backend container at `/app/uploads`.
4. **Establish build & deploy automation**
   - Use the Railway GitHub integration to trigger builds on pushes to the main branch for Production and to the `develop` branch for Development.
   - Disable auto-deploy on Production; require manual promotion from a validated Development deployment.
   - Configure build commands so that `npm run build` is executed from the repo root, ensuring shared schema sync before compiling backend and frontend bundles.
5. **Domain & routing configuration**
   - Accept the default Railway subdomain for Development (e.g., `draco-dev.up.railway.app`) to avoid DNS changes.
   - Attach `draco-sports-manager.railway.app` as the primary Production domain and map tenant custom domains through the Railway dashboard once Production is live.
   - Verify the multi-tenant domain flow by hitting `/api/accounts/by-domain` and confirming the redirect to `/account/{id}/home` for each tenant.
6. **Operational readiness**
   - Enable health checks via `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` and `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` to keep rolling deploys safe.
   - Turn on Railway's logs and metrics streaming; optionally pipe logs to an external sink (e.g., Logtail) for longer retention.
   - Document incident response steps (rollback via previous deployment, database snapshot restoration) inside the runbook.

## Testing & Promotion Gates
- **Pre-deploy**: Run `npm run test`, `npm run lint --workspaces`, and database migrations in CI before Railway receives an artifact.
- **Development smoke checks**: Validate API routes, frontend tenant switching, and file uploads immediately after each Development deployment.
- **Promotion checklist**: Confirm database migrations are idempotent, cache TTLs are tuned, and logs show no elevated error rate before promoting to Production.

## Cost Considerations
- Railway's **Starter** tier (≈ $5/month credit) typically covers a small Postgres instance and low-CPU Node.js services when they auto-sleep during inactivity, making it sufficient for the Development environment's initial bring-up. Expect minimal incremental spend if usage remains low and services sleep nightly.
- For Production, budget for the **Developer** tier (≈ $20/month) to unlock persistent deploys, higher resource ceilings, and custom domain support without enforced sleeping.
- Persistent Postgres volumes and file storage consume additional usage-based credits. Monitor Railway's usage dashboard weekly during Development to calibrate instance sizes before Production launch.

## Timeline & Ownership
| Milestone | Owner | Duration | Notes |
|-----------|-------|----------|-------|
| Provision Development environment | DevOps lead | 1 day | Includes CLI setup, secrets import, and initial deployment. |
| Functional validation on Development | QA + Engineering | 2-3 days | Exercise tenant flows, uploads, and migrations. |
| Production environment cut-over | DevOps lead | 1 day | Clone services, update DNS, and run promotion checklist. |
| Post-launch monitoring | Engineering | Ongoing (first week daily) | Watch logs, database metrics, and tenant signup flows. |

## Appendix: Railway CLI & Configuration Quick Reference

### Service provisioning
```bash
# Authenticate and initialize the project
railway login
railway init

# Link the local repository to the Railway project
railway link

# Add managed PostgreSQL with a persistent volume
railway add -d postgres

# Create backend and frontend services
railway add # backend
railway add # frontend
```

### Environment variables & volumes
```bash
# Backend
DATABASE_URL=${Postgres.DATABASE_URL}
NODE_ENV=production
PORT=3001
UPLOAD_PATH=/app/uploads
JWT_SECRET=${Backend.JWT_SECRET}
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=30

# Frontend
NEXT_PUBLIC_API_URL=${Backend.RAILWAY_PUBLIC_DOMAIN}
NODE_ENV=production
```

```bash
# Mount persistent storage
# PostgreSQL volume → /var/lib/postgresql/data
# Uploads volume → /app/uploads
```

### Domain setup
```bash
# Generate the default Railway domain
railway domain

# Attach custom tenant domains through the dashboard; Railway handles SSL
```

## References
- Railway documentation: https://railway.app/docs (CLI reference, environment variables, volumes, and custom domains).
