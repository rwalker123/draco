# Draco Sports Manager

A comprehensive sports management application migrated from ASP.NET Framework to a modern Node.js stack. Manage baseball and golf leagues, teams, players, games, and sports-related activities with a focus on real-time updates and user-friendly interfaces.

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
- **Runtime**: Node.js v22.16.0
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.8.3
- **Database ORM**: Prisma 6.9.0
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 6.0.0
- **Email Service**: Nodemailer 7.0.3
- **Security**: Helmet 8.1.0, CORS 2.8.5

**Frontend:**
- **Framework**: React 19.1.0
- **Language**: TypeScript 4.9.5
- **UI Library**: Material-UI 7.1.1
- **State Management**: Redux Toolkit 2.8.2
- **Routing**: React Router DOM 7.6.2
- **HTTP Client**: Axios 1.10.0

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

- **Node.js** v18 or higher
- **PostgreSQL** v12 or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rwalker123/draco.git
   cd draco
   ```

2. **Set up the backend**
   ```bash
   cd draco-nodejs/backend
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Set up database
   npx prisma generate
   npx prisma db push
   
   # Start development server
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend-next
   npm install

   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/docs

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

**Backend:**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run clean        # Clean build directory
npm run docs:generate # Generate API documentation
```

**Frontend:**
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run eject        # Eject from Create React App
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
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
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Build

1. **Build the backend**
   ```bash
   cd draco-nodejs/backend
   npm run build
   ```

2. **Build the frontend**
   ```bash
   cd draco-nodejs/frontend
   npm run build
   ```

3. **Deploy to your preferred platform**
   - **Backend**: Deploy the `dist` folder to your Node.js hosting
   - **Frontend**: Deploy the `build` folder to your static hosting

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"  # pragma: allowlist secret
JWT_SECRET="your-production-jwt-secret"  # pragma: allowlist secret
EMAIL_HOST="your-smtp-host"
EMAIL_USER="your-email"
EMAIL_PASS="your-password"  # pragma: allowlist secret
```

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
- Review the [MIGRATION_TODO.md](MIGRATION_TODO.md) for current development status

## 🔄 Migration Status

This project is a migration from an ASP.NET Framework application. See [MIGRATION_TODO.md](MIGRATION_TODO.md) for detailed progress and remaining tasks.

**Completed:**
- ✅ Database migration from SQL Server to PostgreSQL
- ✅ Authentication system with JWT
- ✅ User management and role-based access
- ✅ Accounts and organization management
- ✅ Schedule management system
- ✅ Basic frontend with Material-UI

**In Progress:**
- 🔄 Team and player management
- 🔄 Game statistics and reporting
- 🔄 Media management system

---

**Draco Sports Manager** - Modern sports management for the digital age.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Environment variables configured

### Installation
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Or install individually
npm install                    # Root dependencies
npm run backend:install        # Backend dependencies  
npm run frontend:install       # Frontend dependencies
```

### Development
```bash
# Start both backend and frontend in development mode
npm run dev

# Or start individually
npm run backend:dev           # Backend with nodemon (port 5000)
npm run frontend:start        # Frontend dev server (port 3000)
```

### Production
```bash
# Build both projects
npm run build

# Start production backend
npm start                     # or npm run backend:start
```

## 📋 Available NPM Scripts

### 🎯 **Root Level Commands** (Replace shell scripts)
All commands can be run from the root directory using npm scripts instead of the shell scripts:

#### **Development**
```bash
npm run dev                   # Start both backend and frontend (replaces both shell scripts)
npm run backend:dev          # Backend development with nodemon
npm run frontend:start       # Frontend development server
```

#### **Building**
```bash
npm run build                # Build both backend and frontend
npm run backend:build        # Build backend TypeScript
npm run frontend:build       # Build frontend for production
```

#### **Testing**
```bash
npm run test:all             # Run tests for both projects
npm run backend:test         # Backend tests
npm run frontend:test        # Frontend tests
```

#### **Code Quality**
```bash
npm run lint:all             # Lint both projects
npm run lint:fix:all         # Fix linting issues in both projects
npm run format:all           # Format code in both projects
npm run type-check:all       # TypeScript type checking for both projects
```

#### **Backend Specific**
```bash
npm run backend:start        # Start production backend server
npm run backend:install      # Install backend dependencies
npm run backend:prisma-generate    # Generate Prisma client
npm run backend:migrate-passwords  # Run password migration script
npm run backend:test-passwords     # Test password verification
npm run backend:clean        # Clean build artifacts
npm run backend:docs:generate      # Generate API documentation
```

#### **Frontend Specific**
```bash
npm run frontend:install     # Install frontend dependencies
npm run frontend:eject       # Eject from Create React App (with confirmation)
```

#### **Installation**
```bash
npm run install:all          # Install all dependencies (root + backend + frontend)
```

### 🔄 **Migration from Shell Scripts**

The following npm commands replace the shell script functionality:

| Shell Script Command | NPM Script Equivalent |
|---------------------|----------------------|
| `./run-backend.sh start` | `npm run backend:start` |
| `./run-backend.sh build` | `npm run backend:build` |
| `./run-backend.sh dev` | `npm run backend:dev` |
| `./run-backend.sh test` | `npm run backend:test` |
| `./run-backend.sh install` | `npm run backend:install` |
| `./run-backend.sh prisma-generate` | `npm run backend:prisma-generate` |
| `./run-backend.sh migrate-passwords` | `npm run backend:migrate-passwords` |
| `./run-backend.sh test-passwords` | `npm run backend:test-passwords` |
| `./run-frontend.sh start` | `npm run frontend:start` |
| `./run-frontend.sh build` | `npm run frontend:build` |
| `./run-frontend.sh test` | `npm run frontend:test` |
| `./run-frontend.sh install` | `npm run frontend:install` |
| `./run-frontend.sh eject` | `npm run frontend:eject` |

**Benefits of npm scripts:**
- ✅ Cross-platform compatibility (no shell script dependencies)
- ✅ Better integration with npm ecosystem
- ✅ Easier to maintain and extend
- ✅ Works with npm workspaces
- ✅ Can be used in CI/CD pipelines
- ✅ Better error handling and output formatting

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
npm run secrets:update-baseline

# Check for secrets in the entire repo
~/Library/Python/3.9/bin/detect-secrets scan

# Audit baseline file (interactive)
~/Library/Python/3.9/bin/detect-secrets audit .secrets.baseline
```

#### **Workflow for New Secrets:**

**When detect-secrets blocks a commit:**
```bash
# 1. Review the detected secret
# 2. If it's a false positive or approved secret, update the baseline:
npm run secrets:update-baseline

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
npm run secrets:update-baseline
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
- Lock files (`package-lock.json`, `yarn.lock`)

#### **Best Practices:**
1. **Never commit real secrets** - Use environment variables
2. **Use placeholder values** for examples and tests
3. **Review baseline updates** before committing
4. **Keep baseline file in git** for team consistency
5. **Run manual scans** periodically: `npm run secrets:update-baseline`

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
