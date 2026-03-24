# Draco Sports Manager

A comprehensive sports management application for baseball and golf leagues, teams, players, games, and sports-related activities with a focus on real-time updates and user-friendly interfaces.

## 🏆 Features

- **Multi-Sport Support**: Baseball and golf league management
- **User Management**: Authentication, authorization, and role-based access control
- **League Management**: Seasons, teams, players, schedules, and statistics
- **Real-time Updates**: Live game tracking and statistics
- **Media Management**: Photo galleries and video integration
- **Communication**: Messaging system and announcements
- **Responsive Design**: Modern UI built with Material-UI

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **Runtime**: Node.js v24+ (minimum v24.0.0)
- **Framework**: Express.js 5
- **Language**: TypeScript 5.9.x
- **Database ORM**: Prisma 7
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Helmet, CORS

**Frontend:**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9.x
- **UI Library**: Material-UI 7
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod

**Package Manager:** pnpm (via corepack)

### Infrastructure & External Services

- **DNS**: Cloudflare manages the public DNS records for the application.
- **Email Delivery**: Amazon SES is planned for production email sending (integration in progress, replacing the previous SendGrid approach).

### Project Structure

```
draco-nodejs/
├── backend/                    # Backend application
│   ├── src/                   # Source code
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/           # Data models
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic services
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── scripts/             # Utility scripts
│   ├── prisma/              # Database schema and migrations
│   ├── dist/               # Compiled JavaScript output
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── frontend-next/            # Next.js frontend application
│   ├── app/                  # App Router routes and layouts
│   ├── components/           # Shared UI components
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API data access helpers
│   ├── types/                # Frontend-specific TypeScript types
│   ├── package.json          # Frontend workspace configuration
│   └── tsconfig.json         # Frontend TypeScript configuration
├── shared/                   # Generated schemas and API clients
│   ├── shared-api-client/    # OpenAPI-generated REST client
│   └── shared-schemas/       # Shared Zod schema definitions
├── package.json              # Root workspace manager
└── ARCHITECTURE.md           # Detailed architecture documentation
```

## 🚀 Quick Start

### Contributor Guide
- Review the [Repository Guidelines](AGENTS.md) before making changes.

### Prerequisites

- **Node.js** v24.0.0 or higher
- **pnpm** (enabled via corepack, see below)
- **PostgreSQL** v12 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rwalker123/draco.git
   cd draco
   ```

2. **Enable pnpm via corepack**
   ```bash
   corepack enable
   ```
   This automatically installs the correct pnpm version specified in `package.json`.

3. **Install all dependencies**
   ```bash
   pnpm install
   ```

4. **Set up the backend**
   ```bash
   cd draco-nodejs/backend
   cp .env.example .env
   # Edit .env with your database credentials

   # Set up database
   pnpm exec prisma generate
   pnpm exec prisma db push
   ```

5. **Start development**
   ```bash
   # From repo root - start both backend and frontend
   pnpm dev

   # Or individually
   pnpm backend:dev
   pnpm --filter @draco/frontend-next dev
   ```

6. **Access the application**
   - Frontend (web): http://localhost:3000
   - Backend API: http://localhost:3001
   - Mobile app: `pnpm mobile:start` for Expo dev server

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/draco"  # pragma: allowlist secret

# JWT
JWT_SECRET="your-jwt-secret-key"  # pragma: allowlist secret

# Email (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"  # pragma: allowlist secret

# Server
PORT=5000
NODE_ENV=development
```

## 📚 API Documentation

The API documentation is automatically generated using Swagger and available at:
- **Development**: http://localhost:5000/docs
- **Production**: https://your-domain.com/docs

### Key API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/verify` - Verify reset token
- `POST /api/auth/password-reset/reset` - Reset password

#### Accounts & Organizations
- `GET /api/accounts/search` - Search for organizations (public)
- `GET /api/accounts/:accountId/public` - Public account details
- `GET /api/accounts/my-accounts` - User's accessible organizations

#### League Management
- `GET /api/accounts/:accountId/seasons` - Get seasons
- `GET /api/accounts/:accountId/seasons/:seasonId/leagues` - Get leagues
- `GET /api/accounts/:accountId/seasons/:seasonId/teams` - Get teams

#### Game Management
- `GET /api/accounts/:accountId/seasons/:seasonId/games` - Get games
- `POST /api/accounts/:accountId/seasons/:seasonId/games` - Create game
- `PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId` - Update game
- `DELETE /api/accounts/:accountId/seasons/:seasonId/games/:gameId` - Delete game

## 🛠️ Development

### Available Scripts

All commands run from the repository root:

**Full Stack:**
```bash
pnpm dev                   # Start both backend and frontend
pnpm build                 # Build everything (shared schemas → API client → backend → frontend)
pnpm lint                  # Lint all workspaces
pnpm test                  # Test all workspaces
pnpm type-check            # Type-check all workspaces
```

**Backend:**
```bash
pnpm backend:dev           # Start development server with hot reload
pnpm backend:build         # Build TypeScript to JavaScript
pnpm backend:test          # Run backend tests
pnpm backend:lint          # Lint backend
pnpm backend:type-check    # Type-check backend
```

**Frontend:**
```bash
pnpm --filter @draco/frontend-next dev    # Start dev server
pnpm frontend:build        # Build for production
pnpm frontend:test         # Run frontend tests
pnpm frontend:lint         # Lint frontend
pnpm frontend:type-check   # Type-check frontend
pnpm frontend:e2e          # Run E2E tests
```

**Mobile (React Native / Expo):**
```bash
pnpm mobile:start          # Launch Expo development server
pnpm mobile:lint           # Lint the mobile workspace
pnpm mobile:type-check     # Type-check the mobile workspace
pnpm mobile:test           # Run mobile unit tests
```

**API Sync:**
```bash
pnpm sync:api              # Regenerate OpenAPI spec and frontend SDK
```

### Database Management

Prisma CLI commands should be run from `draco-nodejs/backend`, where `prisma.config.ts` loads `.env` automatically via `dotenv/config`.

```bash
# Generate Prisma client
pnpm exec prisma generate

# Push schema changes to database
pnpm exec prisma db push

# Run database migrations
pnpm exec prisma migrate dev

# Open Prisma Studio
pnpm exec prisma studio
```

## 🐳 LocalStack Setup (S3 Testing)

For local S3 testing and development, you can use LocalStack to emulate AWS S3 without needing a real AWS account.

### Prerequisites

- **Docker** and **Docker Compose** installed
- **AWS CLI** (optional, for bucket management)

### Quick Start with LocalStack

1. **Start LocalStack**
   ```bash
   # From the backend directory
   docker-compose up -d localstack
   ```

2. **Optional: Create S3 bucket manually** (the application will create it automatically if it doesn't exist)
   ```bash
   # Create the bucket for team logos
   aws --endpoint-url=http://localhost:4566 s3 mb s3://draco-team-logos
   ```

3. **Configure environment**
   ```bash
   # Copy the LocalStack environment template
   cp env.localstack.example .env.localstack
   
   # Or add these variables to your existing .env file:
   STORAGE_PROVIDER=s3
   S3_ENDPOINT=http://localhost:4566
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=test
   S3_SECRET_ACCESS_KEY=test
   S3_BUCKET=draco-team-logos
   S3_FORCE_PATH_STYLE=true
   ```

4. **Test S3 connectivity**
   ```bash
   # List buckets
   aws --endpoint-url=http://localhost:4566 s3 ls
   
   # List objects in your bucket
   aws --endpoint-url=http://localhost:4566 s3 ls s3://draco-team-logos
   ```

### LocalStack Management

```bash
# Start LocalStack
docker-compose up -d localstack

# Stop LocalStack
docker-compose down

# View logs
docker-compose logs localstack

# Check health
curl http://localhost:4566/_localstack/health
```

### Switching Between Storage Providers

- **Local Storage**: Set `STORAGE_PROVIDER=local` (default)
- **LocalStack S3**: Set `STORAGE_PROVIDER=s3` with LocalStack config
- **Real AWS S3**: Set `STORAGE_PROVIDER=s3` with real AWS credentials

### Notes

- LocalStack uses dummy credentials (`test`/`test`) that work for local development
- The S3 bucket `draco-team-logos` is created automatically when the application starts
- All S3 operations work exactly like real AWS S3
- Data persists in the `./localstack-data` directory

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for cross-origin requests
- **Helmet**: Security headers middleware
- **Input Validation**: Request data validation using validator.js
- **Rate Limiting**: API rate limiting (planned)

## 🧪 Testing

```bash
# All tests
pnpm test

# Backend tests only
pnpm backend:test

# Frontend tests only
pnpm frontend:test

# E2E tests
pnpm frontend:e2e
```

## 📦 Deployment

### Production Build

```bash
# Build everything (from repo root)
pnpm build

# Or individually
pnpm backend:build
pnpm frontend:build
```

### Docker

```bash
# Build the backend Docker image
pnpm docker:backend:build

# Run backend in Docker with frontend dev server locally
pnpm docker:dev

# Run backend Docker tests (build + health check)
pnpm docker:backend:test
```

To run the Docker image manually (e.g. for local testing against a real database):

```bash
docker run --rm -p 3001:3001 \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=postgresql://<user>:<password>@host.docker.internal:5432/draco \
  -e FRONTEND_URL=http://localhost:3000 \
  draco-backend
```

The health endpoint is available at `http://localhost:3001/health`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [ARCHITECTURE.md](draco-nodejs/ARCHITECTURE.md) for detailed technical documentation

## 📦 pnpm Reference Guide

This project uses **pnpm** as its package manager (managed via corepack). Below is a quick reference for common tasks.

### Setup

```bash
# Enable pnpm (one-time, uses version from package.json)
corepack enable

# Install all workspace dependencies
pnpm install

# Install with locked versions (CI)
pnpm install --frozen-lockfile
```

### Installing & Removing Packages

```bash
# Add a dependency to a specific workspace
pnpm --filter @draco/backend add express
pnpm --filter @draco/frontend-next add @mui/material

# Add a dev dependency
pnpm --filter @draco/backend add -D vitest

# Add to root workspace
pnpm add -w concurrently

# Remove a dependency
pnpm --filter @draco/backend remove express

# Add a workspace dependency (link local package)
pnpm --filter @draco/backend add @draco/shared-schemas --workspace
```

### Updating Packages

```bash
# Check for outdated packages across all workspaces
pnpm -r outdated

# Check outdated in a specific workspace
pnpm --filter @draco/backend outdated

# Update all packages (respects semver ranges in package.json)
pnpm -r update

# Update a specific package
pnpm --filter @draco/backend update express

# Update to latest (ignores semver range)
pnpm --filter @draco/backend update express --latest

# Interactive update (pick which to update)
pnpm --filter @draco/backend update -i
```

### Running Scripts

```bash
# Run a script in a specific workspace
pnpm --filter @draco/backend dev
pnpm --filter @draco/frontend-next build

# Run a script across ALL workspaces
pnpm -r run lint
pnpm -r run test

# Run a CLI tool (replaces npx)
pnpm exec prisma studio
pnpm exec vitest --ui

# Run from root (shorthand for root scripts)
pnpm dev          # both backend + frontend
pnpm build        # full build pipeline
pnpm lint         # lint everything
pnpm test         # test everything
```

### npm → pnpm Command Cheat Sheet

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm install express` | `pnpm add express` |
| `npm install -D vitest` | `pnpm add -D vitest` |
| `npm uninstall express` | `pnpm remove express` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm test` | `pnpm test` |
| `npx prisma studio` | `pnpm exec prisma studio` |
| `npm outdated` | `pnpm outdated` |
| `npm update` | `pnpm update` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm run lint -w @draco/backend` | `pnpm --filter @draco/backend lint` |
| `npm run lint --workspaces` | `pnpm -r run lint` |
| `npm ls` | `pnpm ls` |
| `npm ls --all` | `pnpm ls --depth Infinity` |
| `npm audit` | `pnpm audit` |
| `npm cache clean --force` | `pnpm store prune` |

### Workspace Filtering

```bash
# Filter by package name
pnpm --filter @draco/backend <command>

# Filter by directory
pnpm --filter ./draco-nodejs/backend <command>

# Filter with dependencies (... suffix = include deps)
pnpm --filter @draco/backend... install

# Filter by changed packages since main
pnpm --filter "...[main]" run test
```

### Useful Commands

```bash
# See why a package is installed
pnpm why react

# List all workspace packages
pnpm ls --depth -1

# Clean pnpm store (reclaim disk space)
pnpm store prune

# Rebuild native packages
pnpm rebuild

# Check for security vulnerabilities
pnpm audit

# See disk usage of store
pnpm store path
du -sh $(pnpm store path)
```

## 🔒 Security & Secret Detection

### **Secret Detection System**

This project uses **detect-secrets** to prevent accidental commits of sensitive data like API keys, passwords, and tokens.

#### **How It Works:**
- **Pre-commit Hook:** Scans staged files for potential secrets before each commit
- **Baseline File:** Tracks known/approved secrets to prevent re-flagging
- **Manual Updates:** Baseline is only updated when new secrets are approved

#### **Available Commands:**
```bash
# Update baseline when new secrets are approved
pnpm secrets:update-baseline

# Check for secrets in the entire repo
detect-secrets scan

# Audit baseline file (interactive)
detect-secrets audit .secrets.baseline
```

#### **Workflow for New Secrets:**

**When detect-secrets blocks a commit:**
```bash
# 1. Review the detected secret
# 2. If it's a false positive or approved secret, update the baseline:
pnpm secrets:update-baseline

# 3. Commit the updated baseline:
git add .secrets.baseline
git commit -m "Update baseline with approved secret"

# 4. Retry your original commit:
git add .
git commit -m "Your changes"
```

**When adding legitimate secrets:**
```bash
# 1. Add the secret to your .env file (not tracked in git)
# 2. Use environment variables in your code:
const apiKey = process.env.API_KEY;

# 3. If you need to add a test/example secret to the baseline:
pnpm secrets:update-baseline
git add .secrets.baseline
git commit -m "Add test secret to baseline"
```

#### **What Gets Detected:**
- API Keys (AWS, Azure, GCP, etc.)
- Database passwords and connection strings
- JWT secrets and tokens
- Private keys and certificates
- Hardcoded credentials
- High-entropy strings that look like secrets

#### **Files Excluded from Scanning:**
- `.secrets.baseline` (the baseline file itself)
- `.env*` files (environment files)
- `node_modules/`, `dist/`, `build/` (generated files)
- Lock files (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)

#### **Best Practices:**
1. **Never commit real secrets** - Use environment variables
2. **Use placeholder values** for examples and tests
3. **Review baseline updates** before committing
4. **Keep baseline file in git** for team consistency
5. **Run manual scans** periodically: `pnpm secrets:update-baseline`

## 🧾 Structured Registration & Linking Logs

The backend emits structured JSON logs for registration and account-linking events to support auditing and analysis.

- Where: `draco-nodejs/backend/src/utils/auditLogger.ts` via `logRegistrationEvent(req, event, status, details)`
- Events:
  - `registration_newUser`, `registration_existingUser`
  - `registration_selfRegister`, `registration_linkByName`
- Status values:
  - `attempt`, `success`, `already_linked`, `duplicate_matches`, `not_found`, `validation_error`, `auth_error`, `server_error`
- Context fields (never sensitive):
  - `ts`, `requestId`, `ip`, `event`, `status`, `accountId`, `userId`, `mode`, `timingMs`

Environment control:

```env
# Enable/disable structured registration logs (default: enabled)
LOG_REGISTRATION=true
```

Notes:
- Passwords, tokens, and email contents are never logged.
- Requests include a `requestId` from the query logger middleware to correlate traces.
- Logs are single-line JSON for easy ingestion.
