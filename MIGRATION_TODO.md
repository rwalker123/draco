# Draco Sports Manager - Node.js Migration Todo List

## ✅ COMPLETED TASKS

### Phase 1: Foundation & Infrastructure
- [x] **Database Migration** - All tables migrated using pgloader from SQL Server to PostgreSQL
- [x] **Project Setup** - Node.js project structure created with backend and frontend directories
- [x] **Backend Initialization** - Express.js with TypeScript setup completed
  - [x] `npm init -y` in backend directory
  - [x] Install core dependencies: `express`, `typescript`, `@types/node`, `@types/express`
  - [x] Install dev dependencies: `ts-node`, `nodemon`
  - [x] Install additional dependencies: `cors`, `helmet`, `dotenv`, `bcrypt`, `jsonwebtoken`, `prisma`, `@prisma/client`
  - [x] Create TypeScript configuration (`tsconfig.json`)
  - [x] Create nodemon configuration (`nodemon.json`)
  - [x] Create basic Express application structure (`src/app.ts`)
  - [x] Create server entry point (`src/server.ts`)
  - [x] Create project directory structure
  - [x] Fix import issues with dotenv and Express
  - [x] Resolve path-to-regexp routing errors
  - [x] Server successfully running on port 5000 with health endpoint
- [x] **Git Hooks & Code Quality Setup** - Pre-commit hooks with Husky and lint-staged
  - [x] Install Husky, lint-staged, and Prettier for both backend and frontend
  - [x] Configure lint-staged for TypeScript files in both projects
  - [x] Set up root-level package.json with workspace configuration
  - [x] Create root-level pre-commit hook that runs both backend and frontend checks
  - [x] Add lint, format, and type-check scripts to both projects
  - [x] Configure automatic code formatting and linting on commit

### Phase 2: Core API Development
- [x] **Authentication System**
  - [x] Legacy ASP.NET password hash migration and verification
  - [x] Password migration to bcrypt with temporary password assignment
  - [x] Login endpoint (`/api/auth/login`) with JWT token
  - [x] Password reset flow (request, verify, reset) tested and working
  - [x] Password reset token model and logic
  - [x] Password reset tested with known user and new password

- [x] **Accounts Page Implementation**
  - [x] **Public Accounts Search API** - Anonymous user support for searching organizations
    - [x] GET `/api/accounts/search` - Public endpoint for searching accounts by name
    - [x] GET `/api/accounts/:accountId/public` - Public endpoint for viewing account details
    - [x] Account search with name matching and result formatting
    - [x] Public account details with seasons and basic information
    - [x] Proper error handling for non-existent or private accounts
  - [x] **User Accounts API** - Logged-in user organization access
    - [x] GET `/api/accounts/my-accounts` - Get user's accessible organizations
    - [x] Role-based filtering (Administrator sees all, AccountAdmin sees their accounts)
    - [x] Account details with owner information and affiliations
    - [x] Proper authorization checks and account boundary enforcement
  - [x] **Accounts Page Frontend** - React component with dual functionality
    - [x] Anonymous user support with search functionality and signup prompts
    - [x] Logged-in user support showing their organizations
    - [x] Search interface with clear search functionality
    - [x] Account cards with navigation to account home pages
    - [x] Signup/login prompts for anonymous users
    - [x] Responsive design with Material-UI components
    - [x] Loading states and error handling for both search and user accounts
  - [x] **Account Home Page** - Public account details view
    - [x] Account information display with seasons and statistics
    - [x] Navigation to seasons management (requires login)
    - [x] Account management access (requires login)
    - [x] Public account details with proper access control
  - [x] **Routing Integration** - Updated frontend routing
    - [x] Default landing page for anonymous users is accounts page
    - [x] Account-specific URL routing (`/account/:accountId/home`)
    - [x] Signup page integration for new user registration
    - [x] Proper navigation flow between accounts, login, and signup
  - [x] **Schedule Management System** ✅
    - [x] **Backend API Implementation**
      - [x] Complete CRUD operations for games (`/api/accounts/:accountId/seasons/:seasonId/games`)
      - [x] Game creation with league season validation
      - [x] Game updates with field availability checking
      - [x] Game deletion with proper authorization
      - [x] Team validation (home team ≠ visitor team)
      - [x] League-dependent team loading API
      - [x] Proper error handling and validation
    - [x] **Frontend Implementation**
      - [x] Schedule Management component with multiple view modes (day, week, month, year, list)
      - [x] Add Game dialog with league-dependent team selection
      - [x] Edit Game dialog with automatic team loading
      - [x] Delete Game confirmation dialog
      - [x] Navigation between time periods with Today button
      - [x] Game status management and display
      - [x] Field assignment and management
      - [x] Game type selection (Regular Season, Playoff, Exhibition)
      - [x] Responsive design with Material-UI components
      - [x] Proper loading states and error handling
    - [x] **Key Features Completed**
      - [x] League-dependent team selection (teams filtered by selected league)
      - [x] Multiple calendar view modes with navigation
      - [x] Game status management (Incomplete, Final, Rainout, Postponed, Forfeit, Did Not Report)
      - [x] Field assignment and availability checking
      - [x] Team validation to prevent self-matches
      - [x] Authentication token handling for protected endpoints
      - [x] Modern UI with responsive design

**Accounts Page Implementation Notes:**
- Successfully implemented comprehensive accounts page supporting both anonymous and authenticated users
- Anonymous users can search for organizations and view public account details
- Logged-in users see their accessible organizations with proper role-based filtering
- Public API endpoints placed before protected routes to avoid authentication conflicts
- Account-specific URLs enable direct navigation to organization home pages
- Default landing page changed from login to accounts page for better user experience
- Proper error handling and loading states for all user scenarios
- Integration with existing authentication and role systems
- Responsive design with Material-UI components and modern UX patterns

### Phase 3: AWS Serverless Deployment Infrastructure
- [x] **Serverless Architecture Design** - Cost-effective deployment using AWS Lambda + API Gateway
  - [x] **Infrastructure as Code** - Complete Terraform configuration for serverless deployment
    - [x] Lambda function configuration with VPC access for RDS
    - [x] API Gateway setup with proxy integration
    - [x] RDS PostgreSQL in private subnets with security groups
    - [x] S3 bucket + CloudFront for frontend hosting
    - [x] Secrets management via environment variables (not AWS Secrets Manager)
    - [x] Route53 + ACM for custom domains (optional)
    - [x] CloudWatch logging and monitoring
  - [x] **Backend Lambda Integration** - Express app wrapped for serverless deployment
    - [x] Lambda handler wrapper using `serverless-http`
    - [x] CORS configuration for API Gateway
    - [x] Environment variables for configuration
    - [x] Lambda package build script
    - [x] Updated dependencies for serverless deployment
  - [x] **Frontend S3/CloudFront Setup** - Static hosting with CDN
    - [x] S3 bucket configuration with proper permissions
    - [x] CloudFront distribution with API routing
    - [x] Cache invalidation on deployment
    - [x] HTTPS enforcement and security headers
  - [x] **Deployment Automation** - Complete deployment pipeline
    - [x] Automated deployment script with environment validation
    - [x] Environment variables loaded from `.env` file
    - [x] Terraform state management in S3
    - [x] Step-by-step deployment options (infrastructure, lambda, frontend)
    - [x] Error handling and validation
  - [x] **Security & Configuration** - Secure deployment practices
    - [x] Environment variables for sensitive data (not in terraform.tfvars)
    - [x] `.env` file template (`env.example`) for easy setup
    - [x] Git-safe configuration (sensitive data excluded)
    - [x] IAM roles with least privilege access
    - [x] VPC security groups for network isolation
  - [x] **Documentation & Guides** - Comprehensive deployment documentation
    - [x] Complete README with step-by-step instructions
    - [x] Pre-deployment checklist with AWS prerequisites
    - [x] Cost comparison (60-70% savings vs ECS)
    - [x] Troubleshooting guide and common issues
    - [x] Database migration strategies for existing data

**AWS Serverless Deployment Notes:**
- Successfully designed cost-effective serverless architecture using AWS Lambda + API Gateway
- Estimated cost savings of 60-70% compared to traditional ECS deployment
- Complete infrastructure as code with Terraform for reproducible deployments
- Secure configuration management using environment variables and .env files
- Comprehensive documentation and deployment automation
- Ready for production deployment with proper security and monitoring

## 📋 PENDING TASKS

### Phase 1: Foundation & Infrastructure (Weeks 1-4)

#### 1.1 Project Setup
- [x] Initialize frontend with React TypeScript ✅
  - [x] `npx create-react-app frontend --template typescript` ✅
  - [x] Install UI dependencies: `@mui/material`, `@emotion/react`, `@emotion/styled` ✅
  - [x] Install state management: `@reduxjs/toolkit`, `react-redux` ✅
  - [x] Install additional dependencies: `axios`, `react-router-dom` ✅
  - [x] Create custom Draco theme with sports colors ✅
  - [x] Build responsive Layout component with header/footer ✅
  - [x] Create Dashboard component with statistics cards ✅
  - [x] Update main App component with theme integration ✅
  - [x] React development server running on port 3000 ✅

#### 1.2 Database Setup (Post-Migration)
- [x] Verify all tables migrated correctly ✅
- [x] Set up database connection configuration ✅
- [x] Install and configure Prisma ORM ✅
- [x] Generate Prisma client from existing schema ✅
- [x] Create database connection service ✅
- [x] Set up environment variables for database connection ✅
- [x] Create global BigInt serialization middleware ✅
- [x] Test database connectivity with API endpoint ✅
- [ ] **Database Maintenance - Fix Auto-Increment Sequences**
  - [ ] Fix auto-increment sequences for tables causing unique constraint violations:
    - [ ] `batstatsum` table - ID sequence out of sync
    - [ ] `pitchstatsum` table - ID sequence out of sync  
    - [ ] `golfleaguesetup` table - ID sequence out of sync
  - [ ] Run PostgreSQL sequence reset commands:
    ```sql
    SELECT setval(pg_get_serial_sequence('batstatsum', 'id'), (SELECT MAX(id) FROM batstatsum));
    SELECT setval(pg_get_serial_sequence('pitchstatsum', 'id'), (SELECT MAX(id) FROM pitchstatsum));
    SELECT setval(pg_get_serial_sequence('golfleaguesetup', 'id'), (SELECT MAX(id) FROM golfleaguesetup));
    ```
  - [ ] Test sequence fixes with data insertion operations

- [ ] **Database Schema - DivisionDefs Naming Uniqueness**
  - [ ] **Decision Required**: Determine approach for division name uniqueness
    - [ ] **Option A**: Add unique constraint on `divisiondefs.name` per account (recommended)
      - Ensures division names are unique within each account
      - Maintains current data structure
      - Requires adding unique constraint: `UNIQUE(accountid, name)`
    - [ ] **Option B**: Move division names to `divisionseason` table
      - Allows same division definition to have different names in different league seasons
      - Requires schema migration and data restructuring
      - More flexible but more complex
  - [ ] **Current Issue**: Division names in `divisiondefs` table are not unique, which could cause confusion
  - [ ] **Impact**: Affects division creation and management in LeagueSeason Management
  - [ ] **Priority**: Medium - affects data integrity but not critical functionality

#### 1.3 Backend Architecture
- [x] Create basic Express.js application structure ✅
- [x] Set up middleware (CORS, Helmet, JSON parsing) ✅
- [x] Create route structure for:
  - [x] Authentication (`/api/auth`)
  - [ ] Accounts (`/api/accounts`)
  - [ ] Teams (`/api/teams`)
  - [ ] Players (`/api/players`)
- [x] Set up TypeScript configuration ✅
- [x] Create basic error handling middleware ✅
- [ ] Set up logging with Winston
- [ ] **Code Quality & Development Tools**
  - [x] **Git Hooks Setup** - Pre-commit hooks with Husky and lint-staged
    - [x] Install Husky, lint-staged, and Prettier for both backend and frontend
    - [x] Configure lint-staged for TypeScript files in both projects
    - [x] Set up root-level package.json with workspace configuration
    - [x] Create root-level pre-commit hook that runs both backend and frontend checks
    - [x] Add lint, format, and type-check scripts to both projects
    - [x] Configure automatic code formatting and linting on commit
  - [ ] **ESLint Configuration**
    - [ ] Install and configure ESLint for backend TypeScript
    - [ ] Install and configure ESLint for frontend React/TypeScript
    - [ ] Set up consistent linting rules across both projects
    - [ ] Add TypeScript-specific linting rules
    - [ ] Configure import/export rules for better code organization
  - [ ] **Prettier Configuration**
    - [ ] Create `.prettierrc` configuration files for both projects
    - [ ] Set up consistent formatting rules (indent, quotes, semicolons)
    - [ ] Configure Prettier to work with ESLint
    - [ ] Add Prettier ignore files for generated code
  - [ ] **TypeScript Strict Mode**
    - [ ] Enable strict TypeScript configuration for both projects
    - [ ] Fix existing type errors and add proper type annotations
    - [ ] Configure path mapping for cleaner imports
    - [ ] Set up proper module resolution
  - [ ] **Testing Infrastructure**
    - [ ] Set up Jest configuration for backend unit tests
    - [ ] Configure React Testing Library for frontend tests
    - [ ] Add test coverage reporting
    - [ ] Set up integration test framework
    - [ ] Add pre-commit test running (optional - may slow down commits)

### Phase 4: AWS Serverless Deployment (Future Task)

#### 4.1 AWS Prerequisites Setup
- [ ] **AWS CLI Configuration**
  - [ ] Install AWS CLI if not already installed
  - [ ] Run `aws configure` with your AWS credentials
  - [ ] Verify access with `aws sts get-caller-identity`
- [ ] **S3 Bucket for Terraform State**
  - [ ] Create S3 bucket: `aws s3 mb s3://draco-terraform-state --region us-east-1`
  - [ ] Enable versioning: `aws s3api put-bucket-versioning --bucket draco-terraform-state --versioning-configuration Status=Enabled`
- [ ] **AWS Service Limits Verification**
  - [ ] Check RDS instance limits (need at least 1)
  - [ ] Check Lambda concurrent execution limits (need at least 1000)
  - [ ] Check VPC limits (need at least 5)
  - [ ] Request limit increases if needed

#### 4.2 Local Deployment Setup
- [ ] **Environment Configuration**
  - [ ] Copy `aws-deployment/serverless/env.example` to `.env`
  - [ ] Update `.env` with actual sensitive values:
    - [ ] `TF_VAR_db_password` - Database password
    - [ ] `TF_VAR_jwt_secret` - JWT signing secret
    - [ ] `TF_VAR_email_user` - SMTP username
    - [ ] `TF_VAR_email_pass` - SMTP password
- [ ] **Terraform Configuration**
  - [ ] Copy `aws-deployment/serverless/terraform.tfvars.example` to `terraform.tfvars`
  - [ ] Update `terraform.tfvars` with non-sensitive configuration:
    - [ ] `aws_region` - AWS region (us-east-1)
    - [ ] `environment` - Environment name (dev/staging/prod)
    - [ ] `domain_name` - Custom domain (optional)
    - [ ] `db_username` - Database username

#### 4.3 Database Migration Strategy
- [ ] **Choose Migration Approach**
  - [ ] **Option A: Fresh Start** (Recommended for testing)
    - [ ] Deploy everything with `./deploy.sh`
    - [ ] Run existing migration scripts: `npm run migrate-passwords`
  - [ ] **Option B: Import Existing Data**
    - [ ] Deploy infrastructure only: `./deploy.sh infrastructure`
    - [ ] Get RDS endpoint: `terraform output database_endpoint`
    - [ ] Import database dump: `psql -h ENDPOINT -U draco -d draco -f dump.sql`
    - [ ] Deploy application: `./deploy.sh lambda && ./deploy.sh frontend`
  - [ ] **Option C: Use Migration Scripts**
    - [ ] Deploy infrastructure: `./deploy.sh infrastructure`
    - [ ] Set database URL: `export DATABASE_URL="postgresql://draco:PASSWORD@ENDPOINT/draco"` # pragma: allowlist secret
    - [ ] Run migrations: `npm run migrate-passwords && npm run test-passwords`
    - [ ] Deploy application: `./deploy.sh lambda && ./deploy.sh frontend`

#### 4.4 Production Deployment
- [ ] **Initial Deployment**
  - [ ] Run full deployment: `./deploy.sh`
  - [ ] Verify all components are working:
    - [ ] Lambda function logs in CloudWatch
    - [ ] API Gateway health endpoint
    - [ ] Frontend accessible via CloudFront URL
    - [ ] Database connectivity and data integrity
    - [ ] Email functionality (password reset)
- [ ] **Domain Configuration** (if using custom domain)
  - [ ] Update `terraform.tfvars` with domain name
  - [ ] Re-deploy infrastructure: `./deploy.sh infrastructure`
  - [ ] Configure DNS records in your domain registrar
  - [ ] Wait for SSL certificate validation
- [ ] **Monitoring Setup**
  - [ ] Set up CloudWatch alarms for cost monitoring
  - [ ] Configure log retention policies
  - [ ] Set up performance monitoring
  - [ ] Create backup and disaster recovery procedures

#### 4.5 Post-Deployment Tasks
- [ ] **Data Verification**
  - [ ] Verify all existing data migrated correctly
  - [ ] Test user authentication and authorization
  - [ ] Verify email functionality works
  - [ ] Test all major application features
- [ ] **Performance Optimization**
  - [ ] Monitor Lambda cold start times
  - [ ] Optimize database queries for Lambda environment
  - [ ] Configure CloudFront caching strategies
  - [ ] Set up database connection pooling
- [ ] **Security Hardening**
  - [ ] Review and update IAM policies
  - [ ] Configure VPC security groups
  - [ ] Set up CloudTrail for audit logging
  - [ ] Implement proper backup strategies

**AWS Deployment Notes:**
- Serverless architecture provides 60-70% cost savings for low-traffic applications
- Estimated monthly costs: $21-50 for development, $45-105 for production
- Complete infrastructure as code with Terraform for reproducible deployments
- Secure configuration management using environment variables
- Comprehensive documentation and deployment automation included
- Ready for production deployment when needed

## 🎯 PRIORITY TASKS (Next Steps)

1. **Role Management & Authorization** - Implement role system first (prerequisite for route protection)
2. **Route Protection & Authorization** - Implement contact role-based route protection
3. **Account Management API** - Create Account model and implement CRUD operations with role-based access
4. **Team & Player Management** - Implement team and player endpoints with role-based access
5. **Frontend API Integration** - Connect React frontend to backend APIs with role-based UI

## 📊 PROGRESS TRACKING

- **Phase 1**: 4/4 tasks completed (100%) ✅
- **Phase 2**: 4/7 tasks completed (57.1%) - Authentication, Account Management, Season Management, and LeagueSeason Management complete
- **Phase 3**: 0/4 tasks completed (0%)
- **Phase 4**: 0/6 tasks completed (0%)
- **Phase 5**: 0/4 tasks completed (0%)
- **Phase 6**: 0/4 tasks completed (0%)

**Overall Progress: 9/29 major tasks completed (31.0%)**

## 📝 NOTES

- Database migration completed using sqlpipe and sql scripts ✅
- Backend project structure created with Express.js and TypeScript ✅
- All core dependencies installed ✅
- Basic Express application with middleware and error handling created ✅
- Server successfully running on port 5000 with health endpoint ✅
- Import issues resolved (dotenv, Express, path-to-regexp) ✅
- Database connectivity established with Prisma ORM ✅
- Prisma schema generated from existing PostgreSQL database (78 models) ✅
- Global BigInt serialization middleware implemented ✅
- Test API endpoint created and verified working ✅
- Frontend React TypeScript application created ✅
- Material-UI theme and components implemented ✅
- Redux Toolkit and routing dependencies installed ✅
- React development server running on port 3000 ✅
- Helper scripts created to prevent directory navigation errors ✅
- **Authentication system fully implemented and tested** ✅
  - All authentication endpoints working correctly
  - JWT token authentication middleware functional
  - Password change and token refresh endpoints added
  - Server running on port 5000 with proper error handling
  - All endpoints tested and responding as expected
- **Authentication UI fully implemented and tested** ✅
  - AuthContext created for JWT and user state management
  - Login component updated to use AuthContext and store tokens
  - Header UI updated to show user info and logout functionality
  - Password reset flow working with test mode for development
  - Frontend and backend communicating successfully
  - Both servers running on ports 3000 and 5000
- Next focus should be on route protection and Account Management API 

### Authentication & Authorization
- [x] **JWT Authentication** - Complete JWT token-based authentication system
- [x] **Role-Based Access Control** - Global, account-specific, and context-specific role management
- [x] **Route Protection Middleware** - Comprehensive middleware for authentication, role, permission, and boundary enforcement
- [x] **Frontend Auth Context** - React context for managing authentication state
- [x] **Protected Routes** - React components for route-level protection
- [x] **Role-Based Navigation** - Conditional UI based on user roles
- [x] **Enhanced Logout Functionality** - Page refresh on logout to update all components and access controls
  - [x] Modified logout to refresh current page instead of redirecting to login
  - [x] Added context clearing functions for Auth, Role, and Account contexts
  - [x] Ensures all role-based components and access controls are properly updated after logout
  - [x] Maintains user's current page location while updating access permissions
- [x] **Enhanced Login Functionality** - Redirect users back to their original page after login
  - [x] Modified login to preserve the page user was trying to access before login
  - [x] Updated ProtectedRoute to pass location information when redirecting to login
  - [x] Updated all components that navigate to login to preserve current location
  - [x] Enhanced user experience by returning users to their intended destination
  - [x] Fallback to dashboard if no specific page was being accessed

### Account Management
- [x] **Account Management API** - Complete RESTful API for account CRUD operations
- [x] **Account Types & Affiliations** - Endpoints for managing account types and affiliations
- [x] **Twitter Settings Management** - API for updating Twitter OAuth settings
- [x] **URL Management** - Comprehensive URL management system for accounts
  - [x] **Backend API Implementation**
    - [x] GET `/api/accounts/:accountId/urls` - Retrieve URLs for account
    - [x] POST `/api/accounts/:accountId/urls` - Add URL to account with validation
    - [x] PUT `/api/accounts/:accountId/urls/:urlId` - Update URL for account
    - [x] DELETE `/api/accounts/:accountId/urls/:urlId` - Remove URL from account
    - [x] GET `/api/accounts/by-domain` - Public endpoint for domain lookup
    - [x] URL validation using validator.js library with TLD checking
    - [x] Duplicate URL prevention and proper error handling
  - [x] **Domain Routing System**
    - [x] Backend middleware for domain-based routing
    - [x] Frontend DomainRedirect component for automatic redirects
    - [x] Support for custom domain mapping to accounts
    - [x] Fallback to default accounts page for unmapped domains
  - [x] **Frontend URL Management UI**
    - [x] UrlManagement React component with Material-UI design
    - [x] Add/Edit/Delete URL dialogs with proper validation
    - [x] Protocol selection (HTTP/HTTPS) with dropdown
    - [x] Domain-only input with real-time validation
    - [x] Dialog-specific error handling and user feedback
    - [x] Integration with AccountSettings page
  - [x] **URL Validation & Security**
    - [x] Domain validation using validator.js isFQDN
    - [x] TLD validation against common domain extensions
    - [x] Protocol validation and normalization
    - [x] User-friendly error messages for validation failures
    - [x] Proper URL normalization and storage
  - [x] **Integration & UX**
    - [x] Settings button in AccountHome for easy access
    - [x] Tab-based settings interface with URL management tab
    - [x] Loading states and error handling throughout
    - [x] Responsive design for mobile and desktop
    - [x] Proper state management and infinite loop prevention
- [x] **User Role Assignment** - Assign roles to users within accounts
- [x] **Account Boundary Enforcement** - Ensure users can only access their authorized accounts
- [x] **Frontend Account Management** - React component with full CRUD functionality
- [x] **Contact Autocomplete** - Search and select account owners from contacts database with autocomplete functionality
- [x] **Timezone Dropdown** - US timezone selection dropdown with comprehensive list of US timezones
- [x] **Responsive Design** - Material-UI components with proper responsive layout
- [x] **Form State Management** - Proper form reset and state management for create/edit operations

### Season Management
- [x] **Season Management API** - Complete RESTful API for season CRUD operations
- [x] **Season Copying** - Copy teams and divisions from previous seasons
- [x] **Current Season Management** - Set and manage active seasons
- [x] **Account Boundary Enforcement** - Seasons are scoped to specific accounts

### League Season Management
- [x] **LeagueSeason API** - Complete API for managing leagues within seasons
- [x] **Unique Constraint Handling** - Proper handling of (seasonid, leagueid) unique constraints
- [x] **Add/Remove Leagues** - Add and remove leagues from seasons
- [x] **Account Boundary Enforcement** - LeagueSeasons are scoped to specific accounts

### Database & Infrastructure
- [x] **Prisma ORM Integration** - Complete Prisma setup with schema and migrations
- [x] **Database Schema** - Comprehensive schema for accounts, seasons, leagues, roles, etc.
- [x] **TypeScript Configuration** - Full TypeScript setup for both frontend and backend
- [x] **Development Environment** - Complete development setup with hot reloading

## 🔄 In Progress Tasks

### Team Management
- [ ] **Team Management API** - RESTful API for team CRUD operations
- [ ] **Team Assignment to Leagues** - API for assigning teams to leagues within seasons
- [ ] **Team Roster Management** - API for managing team rosters and player assignments

### Player Management
- [ ] **Player Management API** - RESTful API for player CRUD operations
- [ ] **Player Registration** - API for player registration and profile management
- [ ] **Player Statistics** - API for tracking and managing player statistics

### Game Management
- [ ] **Game Management API** - RESTful API for game CRUD operations
- [ ] **Game Scheduling** - API for creating and managing game schedules
- [ ] **Score Management** - API for recording and managing game scores
- [ ] **Game Statistics** - API for tracking game statistics and results

## 📋 Planned Tasks

### League Management
- [ ] **League Management API** - RESTful API for league CRUD operations
- [ ] **League Configuration** - API for managing league settings and rules
- [ ] **League Standings** - API for calculating and managing league standings

### Statistics & Analytics
- [ ] **Statistics API** - RESTful API for generating and retrieving statistics
- [ ] **Player Statistics** - API for player performance tracking
- [ ] **Team Statistics** - API for team performance tracking
- [ ] **League Statistics** - API for league-wide statistics and analytics

### User Management
- [ ] **User Management API** - RESTful API for user CRUD operations
- [ ] **User Profile Management** - API for managing user profiles and preferences
- [ ] **Password Management** - API for password reset and change functionality

### File Management
- [ ] **File Upload API** - RESTful API for file upload and management
- [ ] **Image Management** - API for managing team and player photos
- [ ] **Document Management** - API for managing league documents and forms

### Notification System
- [ ] **Notification API** - RESTful API for sending and managing notifications
- [ ] **Email Notifications** - API for sending email notifications
- [ ] **Push Notifications** - API for sending push notifications

### Reporting
- [ ] **Report Generation API** - RESTful API for generating various reports
- [ ] **Export Functionality** - API for exporting data in various formats
- [ ] **Custom Reports** - API for creating and managing custom reports

## 🧪 Testing & Quality Assurance

### Backend Testing
- [ ] Set up Jest testing framework
- [ ] Install testing dependencies: `supertest`, `@types/jest`
- [ ] Create unit tests for:
  - [ ] Services
  - [ ] Controllers
  - [ ] Middleware
- [ ] Create integration tests for:
  - [ ] API endpoints
  - [ ] Database operations
  - [ ] Authentication flows
- [ ] Set up test database
- [ ] Create test helpers and fixtures

### Frontend Testing
- [ ] Set up React Testing Library
- [ ] Create component tests
- [ ] Implement integration tests
- [ ] Add E2E tests with Cypress
- [ ] Test Redux state management
- [ ] Test API integration

### Performance Testing
- [ ] Set up load testing with Artillery
- [ ] Test database query performance
- [ ] Optimize API response times
- [ ] Test file upload performance
- [ ] Monitor memory usage

### Security Testing
- [ ] Implement security headers
- [ ] Test authentication vulnerabilities
- [ ] Validate input sanitization
- [ ] Test file upload security
- [ ] Implement rate limiting

## 🚀 Deployment & Infrastructure

### Production Setup
- [ ] Set up production server
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Implement backup strategies

### CI/CD Pipeline
- [ ] Set up GitHub Actions workflow
- [ ] Configure automated testing
- [ ] Set up automated deployment
- [ ] Add code quality checks
- [ ] Implement automated security scanning
- [ ] Set up staging environment

### CI/CD Pipeline
- [ ] **Automated Testing** - CI/CD pipeline with automated testing
- [ ] **Automated Deployment** - Automated deployment to production
- [ ] **Rollback Strategy** - Strategy for rolling back deployments

## 📚 Documentation

### API Documentation
- [ ] **OpenAPI/Swagger** - Complete API documentation
- [ ] **Endpoint Documentation** - Detailed documentation for each endpoint
- [ ] **Authentication Documentation** - Documentation for authentication flows

### User Documentation
- [ ] **User Manual** - Complete user manual for the application
- [ ] **Admin Guide** - Administrator guide for system management
- [ ] **Developer Guide** - Guide for developers working on the system

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] **Code Review Process** - Establish code review process
- [ ] **Linting & Formatting** - Consistent code style across the project
- [ ] **Type Safety** - Improve TypeScript type safety

### Security
- [ ] **Security Audit** - Comprehensive security audit
- [ ] **Input Validation** - Enhanced input validation and sanitization
- [ ] **Rate Limiting** - Implement rate limiting for API endpoints

### Performance
- [ ] **Caching Strategy** - Implement caching for frequently accessed data
- [ ] **Database Optimization** - Optimize database queries and indexes
- [ ] **Frontend Optimization** - Optimize frontend performance and bundle size 

### URL Management Testing
- [ ] **Test Domain Routing with /etc/hosts**
  - [ ] Add test domain entry to /etc/hosts (e.g., `127.0.0.1 test.example.com`)
  - [ ] Add URL to account via URL management interface (e.g., `http://test.example.com`)
  - [ ] Navigate to the custom domain in browser
  - [ ] Verify automatic redirect to correct account home page
  - [ ] Test with different protocols (HTTP/HTTPS)
  - [ ] Test fallback behavior for unmapped domains
  - [ ] Document testing process and results 

## ✅ **Added URL Management Testing Task**

### **Testing Steps:**
1. **Configure /etc/hosts** - Add test domain mapping
2. **Add URL via UI** - Use the URL management interface
3. **Test Navigation** - Visit the custom domain
4. **Verify Redirect** - Ensure proper account routing
5. **Protocol Testing** - Test both HTTP and HTTPS
6. **Fallback Testing** - Verify unmapped domain behavior
7. **Documentation** - Record testing results

### **Example Test Setup:**
```bash
# Add to /etc/hosts
127.0.0.1 test.example.com
127.0.0.1 demo.detroitmsbl.com

# Then in the UI:
# 1. Go to Account Settings > URL Management
# 2. Add URL: http://test.example.com
# 3. Navigate to http://test.example.com in browser
# 4. Should redirect to the account home page 
```

- [x] Implement modern, grouped scoreboard API endpoints for baseball (scoreboard, recent-games) in Node.js backend

# Migration TODO

## Completed
- [x] Basic Node.js backend setup
- [x] React frontend setup
- [x] Authentication system
- [x] Account management
- [x] Baseball scoreboard component
- [x] Baseball menu integration
- [x] Responsive design for baseball menu

## TODO

### High Priority
- [ ] **Fix timezone handling in games database**
  - **Problem**: Database currently stores game times in local time instead of UTC
  - **Current workaround**: Frontend removes "Z" from ISO string to treat as local time
  - **Proper solution**: 
    1. Create database migration to convert existing game times from local to UTC
    2. Update backend to store new games in UTC
    3. Update frontend to use proper timezone conversion with account timezoneId
    4. Test with different timezones to ensure accuracy
  - **Files affected**: 
    - Database: `leagueschedule` table
    - Backend: `games.ts` routes
    - Frontend: `BaseballScoreboard.tsx`
  - **Priority**: High (affects data integrity and user experience)

- [ ] **Test game score and recap functionality**
  - **Purpose**: Verify that the scoreboard correctly displays game scores and recaps
  - **Testing needed**:
    1. Enter game scores through the admin interface
    2. Add game recaps through the admin interface
    3. Verify scores appear correctly on scoreboard
    4. Verify recaps appear in "Recent Recaps" section
    5. Test recap modal functionality
  - **Priority**: High (core functionality validation)

- [x] **Implement schedule management features** ✅
  - **Purpose**: Allow admins to create, edit, and manage game schedules
  - **Completed Features**:
    1. ✅ Create new games with date, time, teams, field
    2. ✅ Edit existing games
    3. ✅ Delete/cancel games
    4. ✅ League-dependent team selection (teams filtered by selected league)
    5. ✅ Multiple view modes: day, week, month, year, list
    6. ✅ Navigation between different time periods
    7. ✅ Game status management (Incomplete, Final, Rainout, Postponed, Forfeit, Did Not Report)
    8. ✅ Field assignment and management
    9. ✅ Game type selection (Regular Season, Playoff, Exhibition)
    10. ✅ Team validation (home team ≠ visitor team)
    11. ✅ Proper error handling and user feedback
  - **Backend API**: Complete with full CRUD operations and validation
  - **Frontend Components**: Complete with responsive design and modern UI
  - **Priority**: High (essential for league operations) ✅ COMPLETED

- [ ] **Add Umpire Support to Game Management**
  - **Purpose**: Allow assignment and management of umpires for games
  - **Features needed**:
    1. Add umpire fields (Umpire1, Umpire2, Umpire3, Umpire4) to add game dialog
    2. Add umpire fields to edit game dialog
    3. Display umpire assignments in game listings and views
    4. Umpire availability management
    5. Umpire scheduling conflicts detection
    6. Umpire assignment validation
  - **Backend**: Update games API to handle umpire assignments
  - **Frontend**: Add umpire selection dropdowns to dialogs
  - **Priority**: Medium (improves game management workflow)

- [ ] **Add Schedule Summary Information and Analytics**
  - **Purpose**: Provide insights into field usage, umpire assignments, and schedule statistics
  - **Features needed**:
    1. **Field Usage Summary**:
       - Games per field over time period
       - Field utilization percentages
       - Field availability calendar
       - Field booking conflicts
    2. **Umpire Assignment Summary**:
       - Games assigned per umpire
       - Umpire workload distribution
       - Umpire availability tracking
       - Umpire assignment conflicts
    3. **General Schedule Analytics**:
       - Total games scheduled per time period
       - Games by status (scheduled, completed, cancelled)
       - Team game frequency
       - League game distribution
    4. **Dashboard Components**:
       - Summary cards with key metrics
       - Charts and graphs for visualization
       - Export functionality for reports
       - Filtering by date ranges and leagues
  - **Backend**: New analytics API endpoints for summary data
  - **Frontend**: New dashboard components and summary views
  - **Priority**: Medium (provides valuable insights for league management)

### Medium Priority
- [ ] Add more baseball-specific features
- [ ] Implement golf scoreboard
- [ ] Add user role management
- [ ] Implement team management features

### Low Priority
- [ ] Performance optimizations
- [ ] Additional UI improvements
- [ ] Enhanced error handling
