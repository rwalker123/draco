# Railway Deployment Tasks

> Derived from `docs/railway-deployment-plan.md`. Keep this checklist in sync with the source plan and check off items as they are completed.

## Phase 0 – Prerequisites
- [x] Ensure DevOps lead has Railway access and CLI installed (`railway login` works locally).
- [x] Confirm repository is linked to Railway (`railway init` + `railway link`).
- [x] Inventory required secrets (JWT secret, hashing rounds, API keys) and store them in a secure manager ahead of import.
- [x] Align timeline and owners with deployment milestones table (DevOps lead, QA, Engineering).

## Phase 1 – Development Environment Bring-Up
- [ ] Provision Development Railway project with Postgres, Backend, Frontend, and uploads volume.
  ```bash
  railway list                                # optional: confirm accessible projects
  railway link                                # ensures the repo is linked to the current project (id prompt if not linked)
  railway environment new Development         # run once if the environment does not exist yet
  railway environment Development             # switch the CLI context to Development

  railway add -d postgres --service draco-postgres
  railway add --service draco-backend         # choose the Node.js template when prompted
  railway add --service draco-frontend        # choose the Next.js template when prompted

  railway service draco-backend               # link CLI context to backend before creating the volume
  railway volume add --mount-path /app/uploads    # follow prompts; ensure it attaches to draco-backend
  ```
- [ ] Tag the Railway environment as “Development” and disable preview deployments (Railway dashboard → Environment settings).
- [ ] Configure service build/start commands so installs happen from the monorepo root **before first deploy**.
  ```bash
- Backend service (Railway dashboard → Service → Deploy tab):
  - Build Command: `npm run build -w @draco/shared-schemas && npm run sync:api && npm run build -w @draco/backend`
  - Start Command: `npm run start -w @draco/backend`

- Frontend service:
  - Build Command: `npm run build -w @draco/shared-schemas && npm run sync:api && npm run build -w @draco/frontend-next`
  - Start Command: `npm run start -w @draco/frontend-next`
  - The app's start script conditionally uses mkcert when available; no extra env vars needed in Railway.
  ```
- [ ] Set up install-time environment variables/overrides (Railway dashboard → Service → Variables).
  - Backend service:
    - `RAILPACK_INSTALL_CMD="npm install --workspaces --include-workspace-root && npm run backend:prisma-generate"`
    - `HUSKY=0` (skip Husky git hook errors in the container)
  - Frontend service:
    - `RAILPACK_INSTALL_CMD="npm install --workspaces --include-workspace-root"`
- [ ] Wire GitHub integration for each service (**Railway dashboard → Service → Deploy tab**).
  - Select repository `Draco`.
  - Backend: set branch to `main`, leave “Wait for CI” **off** so Railway deploys immediately on push.
  - Frontend: set branch to `main`, leave “Wait for CI” **off** so Railway deploys immediately on push.
  - Confirm build/start commands remain the workspace-aware values above.
- [ ] Trigger initial deployments by pushing to `main` (delete any pending CLI deploys if they exist).
- [ ] Configure Development environment variables (Railway dashboard → Environment variables or CLI).
  ```bash
  # Backend service
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

  # Frontend service
  BACKEND_PRIVATE_DOMAIN=$(railway variables --service draco-backend --json | jq -r '.RAILWAY_PRIVATE_DOMAIN // empty')
  railway variables set \
    NEXT_PUBLIC_API_URL="https://${BACKEND_PRIVATE_DOMAIN}" \
    NODE_ENV=production \
    --service draco-frontend
  ```
  > The `jq` dependency is required for the CLI example above. If the backend has not been deployed yet (or `RAILWAY_PRIVATE_DOMAIN` is empty), set `NEXT_PUBLIC_API_URL` via the dashboard using the backend service's private domain interpolation (e.g., `${Backend.RAILWAY_PRIVATE_DOMAIN}`). Fall back to the public domain only if the frontend must be reachable externally without the private network. Include any additional secrets (email providers, third-party APIs) stored in Bitwarden.
- [ ] Attach persistent storage: Postgres data volume and backend uploads volume mounted at `/app/uploads`.
- [ ] Perform initial deployment and verify services boot successfully.

## Phase 2 – Data Migration Rehearsal (Development)
- [ ] Dump the current database from the local Postgres instance (`draco-nodejs/backend/.env` exposes the connection string).
  ```bash
  export SNAPSHOT_DATE=$(date +%F)
  pg_dump --format=c --no-owner --clean --if-exists \
    --dbname="postgresql://postgres@localhost:5432/ezrecsports" \
    --file="draco-dev-${SNAPSHOT_DATE}.dump"
  ```
- [ ] Sanity-check the dump file before using it anywhere else.
  ```bash
  pg_restore --list "draco-dev-${SNAPSHOT_DATE}.dump" | head
  ```
- [ ] Restore the dump into the Railway Development Postgres service.
  ```bash
  # Fetch the live DATABASE_URL for the Development Postgres service
  RAILWAY_DATABASE_URL=$(railway variables --service draco-postgres --environment Development --json | jq -r '.DATABASE_URL')
  echo "$RAILWAY_DATABASE_URL"

  # Restore the dump directly using pg_restore
  pg_restore --clean --if-exists --no-owner \
    --dbname="$RAILWAY_DATABASE_URL" "draco-dev-${SNAPSHOT_DATE}.dump"
  ```
- [ ] Package the legacy uploads directory and push it to the Railway volume.
  ```bash
  # Create tarball rooted at the "1" directory level
  tar -czf "draco-uploads-${SNAPSHOT_DATE}.tar.gz" -C /path/to/uploads 1

  # Stage the archive via a temporary GitHub release
  gh release create temp-upload --notes ""
  gh release upload temp-upload "draco-uploads-${SNAPSHOT_DATE}.tar.gz"
  gh release view temp-upload --json assets --jq '.assets[0].url'
  # Copy the printed asset URL (e.g., https://github.com/ORG/REPO/releases/download/temp-upload/draco-uploads-${SNAPSHOT_DATE}.tar.gz)

  # Pull into Railway, extract, and clean up
  railway ssh --service draco-backend -- /bin/sh -c '
    cat >/tmp/download.js <<"EOF_JS"
import fs from "node:fs";
import https from "node:https";
import { URL } from "node:url";

const startUrl = "https://github.com/ORG/REPO/releases/download/temp-upload/draco-uploads-${SNAPSHOT_DATE}.tar.gz";
const dest = "/app/uploads/draco-uploads.tar.gz";

function download(from) {
  console.log("Starting download: " + from);
  https.get(from, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
      const next = new URL(res.headers.location, from).toString();
      console.log("Redirecting to: " + next);
      res.resume();
      download(next);
      return;
    }

    if (res.statusCode !== 200) {
      console.error("Download failed with status: " + res.statusCode);
      res.resume();
      process.exit(1);
    }

    const out = fs.createWriteStream(dest);
    let downloaded = 0;
    let lastReport = 0;

    res.on("data", (chunk) => {
      downloaded += chunk.length;
      if (downloaded - lastReport >= 5 * 1024 * 1024) {
        const mb = (downloaded / (1024 * 1024)).toFixed(1);
        console.log("... downloaded " + mb + " MB");
        lastReport = downloaded;
      }
    });

    res.pipe(out);

    res.on("error", (err) => {
      console.error("Response error:", err);
      process.exit(1);
    });

    out.on("finish", () => {
      out.close(() => {
        const total = (downloaded / (1024 * 1024)).toFixed(2);
        console.log("Download complete. Saved " + total + " MB to " + dest);
      });
    });
  }).on("error", (err) => {
    console.error("Request error:", err);
    process.exit(1);
  });
}

download(startUrl);
EOF_JS
    node /tmp/download.js && rm /tmp/download.js
    tar -xzf /app/uploads/draco-uploads.tar.gz -C /app/uploads && rm /app/uploads/draco-uploads.tar.gz
  '

  # Optional: verify the uploads volume (contents rooted at "1/")
  railway ssh --service draco-backend -- /bin/sh -c 'find /app/uploads -maxdepth 2 -type d -print'

  # Remove the temporary release & local tarball once validated
  gh release delete temp-upload --cleanup-tag
  rm "draco-uploads-${SNAPSHOT_DATE}.tar.gz"
  ```
- [ ] Define and document a delta sync approach if the legacy stack stays live during validation (e.g., simple `rsync` script run hourly).
- [ ] test backend with:

   railway ssh --service draco-frontend
   node -e "require('http').get('http://draco-backend.railway.internal:8080/health', res => { console.log('status:', res.statusCode); res.resume(); }).on('error', err => { console.error('request error:', err); });" 
   

## Phase 3 – Development Validation & Automation
- [ ] Run CI gate: `npm run test`, `npm run lint --workspaces`, and database migrations before promoting artifacts.
- [ ] Perform smoke tests on Development: API tenant flows, frontend tenant switching, file upload round-trip.
- [ ] Enable logs/metrics streaming and verify visibility (Railway dashboard or external sink).
- [ ] Capture incident response runbook entries (rollback steps, database snapshot restoration).
- [ ] Adjust instance sizing and auto-sleep windows based on observed usage to stay within Starter tier credits.

## Phase 4 – Production Environment Preparation
- [ ] Clone validated Development services into a Production Railway environment or reprovision with identical configuration.
- [ ] Pin Docker image / artifact versions for Backend and Frontend services.
- [ ] Import Production-specific secrets; ensure separation from Development variable groups.
- [ ] Disable auto-deploy for Production, requiring manual promotion from Development.
- [ ] Attach Production domain (`draco-sports-manager.railway.app`) and pre-stage tenant custom domains.
- [ ] Enable backups and alerting hooks for uptime/error budgets.

## Phase 5 – Production Cut-Over
- [ ] Schedule maintenance window and notify stakeholders.
- [ ] Repeat database restore into Production Postgres using validated snapshot.
- [ ] Sync uploads volume to Production and verify integrity.
- [ ] Run promotion checklist: migration idempotency, cache TTL review, error logs clean.
- [ ] Manually promote latest validated deployment to Production.
- [ ] Swap DNS / confirm domain routing and validate `/api/accounts/by-domain` flow for each tenant.

## Phase 6 – Post-Launch Monitoring
- [ ] Monitor logs, metrics, and tenant signup flows daily for first week; tune scaling thresholds as needed.
- [ ] Confirm backups are executing and alert hooks firing as expected.
- [ ] Capture follow-up tasks (e.g., automation improvements, cost optimization) and feed back into backlog.

## References
- Source plan: `docs/railway-deployment-plan.md`
- Railway docs: https://railway.app/docs
