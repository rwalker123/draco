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
- [ ] **API Key Authentication for External Clients**
  - [ ] **Priority**: High - External clients can currently access public endpoints without rate limiting
  - [ ] **Current Issue**: Several endpoints are publicly accessible without any API key authentication:
    - `/api/accounts/:accountId/seasons/current` - Current season info
    - `/api/accounts/:accountId/seasons/:seasonId/games` - Season games data
    - `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueId/games` - League games data
    - `/api/accounts/:accountId/seasons/:seasonId/teams` - Teams data
    - `/api/accounts/:accountId/public` - Public account info
    - `/api/accounts/search` - Account search
  - [ ] **Implementation Plan**:
    - [ ] Create API key model in database (api_keys table)
    - [ ] Implement API key middleware for rate limiting and authentication
    - [ ] Add API key validation to public endpoints
    - [ ] Create API key management endpoints for account admins
    - [ ] Implement rate limiting per API key (requests per minute/hour)
    - [ ] Add usage tracking and analytics
    - [ ] Create API key generation and revocation functionality
    - [ ] Add API key scopes for different access levels
  - [ ] **Benefits**:
    - Rate limiting to prevent abuse
    - Usage tracking and analytics
    - Future monetization possibilities
    - Better security for external API access
    - Ability to revoke access for problematic clients

### Phase 2: Core API Development (Weeks 5-12)

#### 2.1 Authentication System
- [x] Install authentication dependencies: `jsonwebtoken`, `bcrypt` ✅
- [x] Create User model with Prisma
- [x] Implement AuthService with login/register methods
- [x] Create JWT middleware for route protection
- [x] Implement password hashing with bcrypt
- [x] Create authentication routes:
  - [x] POST `/api/auth/login`
  - [x] POST `/api/auth/register` (pending full implementation)
  - [x] POST `/api/auth/logout`
  - [x] GET `/api/auth/me` (get current user)
  - [x] POST `/api/auth/change-password` (newly added)
  - [x] POST `/api/auth/refresh` (newly added)
  - [x] POST `/api/auth/verify` (bonus endpoint)
- [x] Password reset endpoints:
  - [x] POST `/api/passwordReset/request`
  - [x] GET `/api/passwordReset/verify/:token`
  - [x] POST `/api/passwordReset/reset`
- [x] Password reset flow tested and confirmed working
- [x] Legacy password migration and reset tested for known user

#### 2.2 Account Management API
- [x] **Account Management API Implementation**
  - [x] Create Account model and relationships with Prisma
  - [x] Implement comprehensive AccountController with CRUD operations
  - [x] Create account routes with role-based protection:
    - [x] GET `/api/accounts` (Administrator only - lists all accounts)
    - [x] GET `/api/accounts/types` (get all account types)
    - [x] GET `/api/accounts/affiliations` (get all affiliations)
    - [x] GET `/api/accounts/:accountId` (requires account access)
    - [x] PUT `/api/accounts/:accountId` (AccountAdmin or Administrator)
    - [x] PUT `/api/accounts/:accountId/twitter` (update Twitter settings)
    - [x] POST `/api/accounts/:accountId/urls` (add account URLs)
    - [x] DELETE `/api/accounts/:accountId/urls/:urlId` (remove account URLs)
  - [x] Implement account validation middleware
  - [x] Add account-specific authorization checks with role-based access control
  - [x] Fix role initialization issues and route protection
  - [x] Test all endpoints with Administrator role access

**Account Management Implementation Notes:**
- Successfully implemented comprehensive account management API with role-based protection
- Fixed role initialization issue where role IDs were not being properly populated
- Updated route protection to use role names instead of role IDs for proper role checking
- Implemented account boundary enforcement for account-specific endpoints
- Added support for account types, affiliations, Twitter settings, and URL management
- All endpoints tested and working with proper authentication and authorization
- Account data includes relationships with account types and affiliations
- URLs are managed separately with individual create/delete operations

#### 2.3 Season Management API
- [x] **Season Management API Implementation**
  - [x] Create Season model and relationships with Prisma
  - [x] Implement comprehensive SeasonController with CRUD operations
  - [x] Create season routes with role-based protection using RESTful URL structure:
    - [x] GET `/api/accounts/:accountId/seasons` (lists all seasons for account)
    - [x] GET `/api/accounts/:accountId/seasons/current` (get current season)
    - [x] GET `/api/accounts/:accountId/seasons/:seasonId` (get specific season)
    - [x] POST `/api/accounts/:accountId/seasons` (create new season)
    - [x] PUT `/api/accounts/:accountId/seasons/:seasonId` (update season name)
    - [x] POST `/api/accounts/:accountId/seasons/:seasonId/copy` (copy season)
    - [x] POST `/api/accounts/:accountId/seasons/:seasonId/set-current` (set as current)
    - [x] DELETE `/api/accounts/:accountId/seasons/:seasonId` (delete season)
  - [x] Implement season validation and business logic
  - [x] Add account-specific authorization checks with role-based access control
  - [x] Fix route registration order and Express router parameter merging
  - [x] Test all endpoints with AccountAdmin role access

- [x] **Season Management Frontend UX**
  - [x] Create comprehensive SeasonManagement React component with Material-UI
  - [x] Implement CRUD operations with proper role checking
  - [x] Add responsive grid layout for season cards
  - [x] Create dialogs for create, edit, delete, and copy operations
  - [x] Add current season management with star indicators
  - [x] Implement league display within season cards
  - [x] Add loading states and error handling
  - [x] Create ProtectedSeasonManagement wrapper with role-based access control
  - [x] Add navigation menu items for season management
  - [x] Integrate with existing authentication and role context systems

**Season Management Implementation Notes:**
- Successfully implemented comprehensive season management API with proper RESTful URL structure
- Used `/api/accounts/:accountId/seasons` pattern for hierarchical resource organization
- Fixed Express router issues by using `{ mergeParams: true }` for nested route parameters
- Reordered route registration to ensure specific routes (seasons) are registered before general routes (accounts)
- Implemented current season management with `currentseason` table integration
- Added season copying functionality that copies leagues (ready for teams/divisions later)
- Implemented proper error handling for foreign key constraints and validation
- All endpoints require AccountAdmin or Administrator role for modifications
- Account boundary enforcement ensures users can only access seasons for accounts they have access to
- Season data includes relationships with leagues and current season status
- Prisma client regeneration resolved schema sync issues
- All endpoints tested and working with proper authentication and authorization
- **Frontend UX Features:**
  - Modern Material-UI interface with responsive design
  - Role-based access control with permission checking
  - Comprehensive CRUD operations with confirmation dialogs
  - Current season management with visual indicators
  - League display within season cards with overflow handling
  - Loading states and error/success messaging
  - Floating action button for quick season creation
  - Integration with existing navigation and authentication systems

#### 2.4 LeagueSeason Management API
- [x] **LeagueSeason Management API Implementation**
  - [x] Create leagueseason model and relationships with Prisma
  - [x] Add unique constraint on (seasonid, leagueid) to prevent duplicates
  - [x] Implement comprehensive LeagueSeasonController with CRUD operations
  - [x] Create league season routes with role-based protection using RESTful URL structure:
    - [x] GET `/api/accounts/:accountId/seasons/:seasonId/leagues` (list all leagues for a season)
    - [x] GET `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId` (get specific leagueSeason)
    - [x] POST `/api/accounts/:accountId/seasons/:seasonId/leagues` (add league to season)
    - [x] DELETE `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId` (remove league from season)
  - [x] Implement league season validation and business logic
  - [x] Add account-specific authorization checks with role-based access control
  - [x] Test all endpoints with AccountAdmin role access

- [x] **Division Management API Implementation**
  - [x] Create divisiondefs model and relationships with Prisma
  - [x] Implement comprehensive DivisionController with CRUD operations
  - [x] Create division routes with role-based protection:
    - [x] GET `/api/accounts/:accountId/divisions` (list all division definitions)
    - [x] GET `/api/accounts/:accountId/divisions/:divisionId` (get specific division)
    - [x] POST `/api/accounts/:accountId/divisions` (create new division definition)
    - [x] PUT `/api/accounts/:accountId/divisions/:divisionId` (update division definition)
    - [x] DELETE `/api/accounts/:accountId/divisions/:divisionId` (delete division definition)
  - [x] Create divisionseason model and relationships with Prisma
  - [x] Implement division season routes with role-based protection:
    - [x] GET `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions` (list divisions for league season)
    - [x] POST `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions` (add division to league season)
    - [x] DELETE `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId` (remove division from league season)
  - [x] Implement division validation and business logic
  - [x] Add account-specific authorization checks with role-based access control
  - [x] Test all endpoints with AccountAdmin role access

- [x] **LeagueSeason Management Frontend UX**
  - [x] Create comprehensive LeagueSeasonManagement React component with Material-UI
  - [x] Implement division management with create, add, and remove operations
  - [x] Add accordion layout for league seasons with divisions and teams
  - [x] Create dialogs for division creation and assignment
  - [x] Add team assignment functionality with backend API integration
  - [x] Add team removal functionality with backend API integration
  - [x] Implement responsive design with proper loading states
  - [x] Add error handling and success messaging
  - [x] Integrate with existing SeasonManagement component
  - [x] Add navigation button in season cards for league season management
  - [x] **Enhanced Add Division Dialog** - Added division creation functionality within the Add Division dialog
    - [x] "Create New Division" button to switch to division creation mode
    - [x] Division name input with validation
    - [x] Priority setting for new divisions
    - [x] Checkbox to optionally add division to league after creation
    - [x] Seamless workflow between selecting existing divisions and creating new ones
    - [x] Error handling for duplicate division names
    - [x] Immediate UI updates after division creation and assignment
  - [x] **Team Management Features**
    - [x] Team assignment to divisions with dropdown selection
    - [x] Team removal from divisions with one-click delete functionality
    - [x] Visual team chips with remove (X) icons in division sections
    - [x] Accordion state persistence to keep panels open after operations
    - [x] Immediate UI updates when teams are moved between divisions and unassigned sections
    - [x] Proper error handling for team assignment and removal operations
    - [x] Team removal from season with confirmation dialog
    - [x] Proper handling of team deletion when used in multiple seasons
    - [x] Clear user feedback about team removal vs. complete deletion
    - [x] Delete buttons for both division teams and unassigned teams
    - [x] Backend API endpoints for team season and team definition deletion
    - [x] Team creation for league seasons with simple dialog
    - [x] Backend API endpoints for team creation and league season assignment
    - [x] Create Team button in league accordion summary
    - [x] Proper validation and error handling for team creation
    - [x] Integration with existing league season management workflow
    - [x] **Bug Fix**: Fixed team assignment logic to allow unassigned teams to be assigned to divisions
    - [x] **UX Optimization**: Auto-assign teams to divisions when only one division exists (no dialog needed)
    - [x] **Performance Optimization**: Implement targeted state updates instead of full component refreshes for smoother UX
    - [x] **Dialog UX Fix**: Add dialog-specific message display for Manage Leagues dialog in Season Management
  - [x] **League Management Features**
    - [x] League removal from season with confirmation dialog
    - [x] Proper handling of league deletion when used in multiple seasons
    - [x] Clear user feedback about league removal vs. complete deletion
    - [x] Integration with existing league season management workflow
  - [ ] **Division Management Enhancements**

**LeagueSeason Management Implementation Notes:**
- Successfully implemented comprehensive league season management API with proper RESTful URL structure
- Enhanced existing league season routes to include division and team data in responses
- Created new division management API with full CRUD operations for division definitions
- Implemented division season management for adding/removing divisions to/from league seasons
- Used hierarchical URL structure: `/api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions`
- Added proper validation to prevent duplicate divisions in league seasons
- Implemented business logic to prevent division deletion when teams are assigned
- Created comprehensive frontend UX with accordion layout for better organization
- Added division creation and management dialogs with proper form validation
- **Team Management API Implementation:**
  - [x] Team assignment to divisions: `PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/assign-division`
  - [x] Team removal from divisions: `DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/remove-from-division`
  - [x] Proper validation to ensure teams belong to the correct league season
  - [x] Validation to prevent removing teams that aren't assigned to divisions
  - [x] Comprehensive error handling and success messaging
- **Team Management Frontend Features:**
  - [x] Team assignment dialog with division dropdown selection
  - [x] Team removal with one-click delete functionality on team chips
  - [x] Visual feedback with remove (X) icons on team chips in divisions
  - [x] Accordion state persistence to maintain open panels during operations
  - [x] Immediate UI updates when teams are moved between sections
  - [x] Proper loading states and error handling for all team operations
- Added responsive design with proper loading states and error handling
- Integrated with existing SeasonManagement component via dialog
- All endpoints require AccountAdmin or Administrator role for modifications
- Account boundary enforcement ensures users can only access data for accounts they have access to
- Database relationships properly maintained: LeagueSeason → DivisionSeason → TeamsSeason
- Division definitions are reusable across different league seasons
- Priority system implemented for division ordering within league seasons

#### 2.5 League Management API
- [x] **League Management API Implementation**
  - [x] Create League model and relationships with Prisma
  - [x] Implement comprehensive LeagueController with CRUD operations
  - [x] Create league routes with role-based protection using RESTful URL structure:
    - [x] GET `/api/accounts/:accountId/leagues` (list all leagues for account)
    - [x] GET `/api/accounts/:accountId/leagues/:leagueId` (get specific league)
    - [x] POST `/api/accounts/:accountId/leagues` (create new league)
    - [x] PUT `/api/accounts/:accountId/leagues/:leagueId` (update league name)
    - [x] DELETE `/api/accounts/:accountId/leagues/:leagueId` (delete league)
  - [x] Implement league validation and business logic
  - [x] Add account-specific authorization checks with role-based access control
  - [x] Fix database sequence issues for auto-incrementing IDs
  - [x] Test all endpoints with AccountAdmin role access

- [x] **League Management Frontend UX**
  - [x] Integrate league creation into Season Management component
  - [x] Add "Create New League" button in Manage Leagues dialog
  - [x] Implement league creation dialog with name input
  - [x] Add checkbox to optionally add league to season after creation
  - [x] Implement league editing functionality with inline dialog
  - [x] Add error handling for duplicate league names
  - [x] Implement immediate UI updates after league operations
  - [x] Add error display within dialogs for better UX
  - [x] Test all league CRUD operations with proper error handling

**League Management Implementation Notes:**
- Successfully implemented comprehensive league management API with proper RESTful URL structure
- Used `/api/accounts/:accountId/leagues` pattern for hierarchical resource organization
- Enforced unique constraint on league names per account to prevent duplicates
- All endpoints require AccountAdmin or Administrator role for modifications
- Account boundary enforcement ensures users can only access leagues for accounts they have access to
- League data includes relationships with account and leagueSeasons
- Fixed database sequence issues that were causing unique constraint violations on ID fields
- All endpoints tested and working with proper authentication and authorization
- **Frontend UX Features:**
  - Integrated league creation into existing Season Management workflow
  - "Create New League" button in Manage Leagues dialog for seamless workflow
  - League creation dialog with name input and optional season assignment
  - League editing functionality with inline dialog and immediate updates
  - Comprehensive error handling for duplicate names and validation errors
  - Error messages displayed within dialogs for better user experience
  - Immediate UI updates after league operations without requiring dialog refresh
  - Integration with existing authentication and role context systems

#### 2.6 Team & Player Management
- [ ] Create Team and Player models
- [ ] Implement TeamController with full CRUD
- [ ] Implement PlayerController with full CRUD
- [ ] Create team routes:
  - [ ] GET `/api/teams` (by account)
  - [ ] POST `/api/teams`
  - [ ] GET `/api/teams/:teamId`
  - [ ] PUT `/api/teams/:teamId`
  - [ ] DELETE `/api/teams/:teamId`
- [ ] Create player routes:
  - [ ] GET `/api/players` (by team)
  - [ ] POST `/api/players`
  - [ ] GET `/api/players/:playerId`
  - [ ] PUT `/api/players/:playerId`
  - [ ] DELETE `/api/players/:playerId`
- [ ] Implement team/player statistics tracking
- [ ] Add team logo upload functionality

#### 2.7 Contact Management
- [ ] Create Contact model
- [ ] Implement ContactController
- [ ] Create contact routes for user profile management
- [ ] Implement contact search and filtering

#### 2.8 Role Management & Authorization
- [x] **Role System Analysis & Design**
  - [x] Analyze existing role structure: `aspnetroles`, `aspnetuserroles`, `contactroles`
  - [x] Understand global vs account-specific vs context-specific roles
  - [x] Design role hierarchy and permissions model
  - [x] Map legacy role types: AccountAdmin, LeagueAdmin, TeamAdmin, TeamPhotoAdmin, etc.

- [x] **Role Management API**
  - [x] Create RoleService for role operations
  - [x] Implement global role assignment endpoints (`/api/roles/assign`, `/api/roles/remove`)
  - [x] Implement account-specific role endpoints (`/api/accounts/:accountId/roles`)
  - [x] Implement context-specific role endpoints (team/league roles)
  - [x] Add role validation and business logic

- [x] **Authorization Middleware**
  - [x] Enhance existing `requireRole` middleware
  - [x] Add account-specific role checking
  - [x] Add context-specific role checking (team/league level)
  - [x] Implement role hierarchy (Administrator > AccountAdmin > TeamAdmin)
  - [x] Add role caching for performance

- [x] **Role Management UI**
  - [x] Create role management dashboard (admin only)
  - [x] Add user role assignment interface
  - [x] Add account-specific role management
  - [x] Add team/league role management
  - [x] Implement role-based UI visibility

- [x] **Role Migration & Setup**
  - [x] Migrate existing roles from legacy system
  - [x] Set up default roles for new accounts
  - [x] Create role seeding scripts
  - [x] Add role audit logging

- [x] **Integration with Existing APIs**
  - [x] Add role checks to Account Management API
  - [x] Add role checks to Team & Player Management API
  - [x] Add role checks to File Upload API
  - [x] Implement role-based data filtering

**Role Management Implementation Notes:**
- Successfully implemented comprehensive role system with role name/ID mapping
- Created `RoleContext` with role hierarchy and permission checking functions
- Implemented `AccountContext` for account selection and access management
- Added role-based navigation with conditional menu visibility
- Created protected route components with authentication, role, and permission checks
- Built debugging tools (`RoleDebug` component) for troubleshooting role issues
- Successfully tested role checking with Administrator global role
- Frontend and backend role systems now properly synchronized

#### 2.9 Route Protection & Authorization
- [x] **Contact Role-Based Route Protection**
  - [x] Implement contact role checking middleware
  - [x] Add account-level route protection (AccountAdmin, AccountUser)
  - [x] Add team-level route protection (TeamAdmin, TeamUser)
  - [x] Add league-level route protection (LeagueAdmin, LeagueUser)
  - [x] Implement context-aware authorization (user can only access their account's data)
  - [x] Add role-based API endpoint filtering
  - [x] Create RouteProtection middleware class with comprehensive protection methods
  - [x] Implement account boundary enforcement
  - [x] Implement team boundary enforcement
  - [x] Implement league boundary enforcement
  - [x] Add permission-based route protection

- [x] **Frontend Route Protection**
  - [x] Create protected route components for React Router
  - [x] Implement role-based navigation visibility
  - [x] Add route guards for account-specific pages
  - [x] Add route guards for team-specific pages
  - [x] Implement role-based component rendering
  - [x] Add unauthorized access handling

**Frontend Route Protection Implementation Notes:**
- Created comprehensive `RoleContext` with role hierarchy and permission mapping
- Implemented `ProtectedRoute` component with authentication, role, and permission checks
- Created convenience components: `RequireAuth`, `RequireRole`, `RequirePermission`
- Added specific role components: `RequireAdministrator`, `RequireAccountAdmin`, `RequireLeagueAdmin`, `RequireTeamAdmin`
- Implemented `RoleBasedNavigation` for conditional navigation item visibility
- Created example protected pages: `AdminDashboard`, `AccountManagement`, `PermissionTest`
- Updated `Layout` component with role-based navigation menu
- Added `RoleProvider` to main app context
- Successfully tested authentication, role-based, and permission-based route protection
- Verified navigation items show/hide based on user roles
- All frontend route protection is working as expected

- [x] **API Security Enhancement**
  - [x] Add rate limiting for sensitive endpoints
  - [x] Implement request validation for role-based operations
  - [x] Add audit logging for role changes
  - [x] Implement session management
  - [x] Add CSRF protection

- [x] **Authorization Testing**
  - [x] Create tests for role-based access control
  - [x] Test account boundary enforcement
  - [x] Test team boundary enforcement
  - [x] Test unauthorized access scenarios
  - [x] Validate role hierarchy enforcement
  - [x] Test permission-based access control
  - [x] Verify route protection middleware functionality

**Route Protection Implementation Notes:**
- Created comprehensive `RouteProtection` middleware class with methods for:
  - `requireAuth()` - Basic authentication check
  - `requireRole(roleId, context)` - Role-based protection with context
  - `requirePermission(permission, context)` - Permission-based protection
  - `enforceAccountBoundary()` - Account-level access control
  - `enforceTeamBoundary()` - Team-level access control
  - `enforceLeagueBoundary()` - League-level access control
  - Convenience methods for common roles (requireAdministrator, requireAccountAdmin, etc.)
- Implemented protected accounts routes demonstrating all protection levels
- Successfully tested authentication, role-based, and permission-based protection
- Verified account boundary enforcement works correctly
- All route protection middleware is working as expected

### Phase 3: Frontend Development (Weeks 13-20)

#### 3.1 React Application Structure
- [ ] Set up React Router with protected routes
- [ ] Create main layout component
- [ ] Implement navigation structure
- [ ] Set up Material-UI theme configuration
- [ ] Create basic page components:
  - [ ] Dashboard
  - [ ] Teams
  - [ ] Players
  - [ ] Account Management
  - [ ] User Profile

#### 3.2 State Management (Redux Toolkit)
- [ ] Set up Redux store configuration
- [ ] Create API slice for backend communication
- [ ] Implement slices for:
  - [ ] Authentication
  - [ ] Accounts
  - [ ] Teams
  - [ ] Players
  - [ ] UI state
- [ ] Set up async thunks for API calls
- [ ] Implement error handling in Redux

#### 3.3 Modern UI Components
- [ ] Create reusable UI components:
  - [ ] TeamCard
  - [ ] PlayerCard
  - [ ] AccountCard
  - [ ] Navigation
  - [ ] LoadingSpinner
  - [ ] ErrorBoundary
- [ ] Implement responsive design
- [ ] Create form components with validation
- [ ] Add data tables for lists
- [ ] Implement search and filtering UI

#### 3.4 API Integration
- [ ] Set up Axios with interceptors
- [ ] Create API service classes
- [ ] Implement error handling for API calls
- [ ] Add loading states for async operations
- [ ] Set up authentication token management

### Phase 4: Advanced Features (Weeks 21-28)

#### 4.1 File Upload System
- [ ] Install file upload dependencies: `multer`, `@aws-sdk/client-s3`
- [ ] Set up AWS S3 configuration
- [ ] Implement FileUploadService
- [ ] Create file upload endpoints:
  - [ ] POST `/api/upload/team-logo`
  - [ ] POST `/api/upload/player-photo`
  - [ ] POST `/api/upload/gallery`
- [ ] Add file validation and size limits
- [ ] Implement file deletion functionality
- [ ] Create frontend upload components

#### 4.2 Email Service
- [ ] Install email dependencies: `nodemailer`
- [ ] Set up SMTP configuration
- [ ] Implement EmailService
- [ ] Create email templates for:
  - [ ] User registration
  - [ ] Password reset
  - [ ] Team announcements
  - [ ] Player notifications
- [ ] Add email queue system for reliability
- [ ] Implement email preferences management

#### 4.3 Real-time Features (WebSocket)
- [ ] Install WebSocket dependencies: `socket.io`
- [ ] Set up WebSocketService
- [ ] Implement real-time features:
  - [ ] Live team updates
  - [ ] Real-time messaging
  - [ ] Live notifications
  - [ ] Activity feeds
- [ ] Add WebSocket authentication
- [ ] Implement room-based messaging

#### 4.4 Discussion Boards & Messaging
- [ ] Create discussion board models
- [ ] Implement discussion board API
- [ ] Create messaging system
- [ ] Add real-time chat functionality
- [ ] Implement message threading

#### 4.5 Social Media Integration
- [ ] Implement Twitter integration
- [ ] Add Facebook integration
- [ ] Create social media posting functionality
- [ ] Add social media analytics

#### 4.6 Hall of Fame & Voting
- [ ] Create Hall of Fame models
- [ ] Implement voting system
- [ ] Add nomination process
- [ ] Create voting interface
- [ ] Implement results display

### Phase 5: Testing & Quality Assurance (Weeks 29-32)

#### 5.1 Backend Testing
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

#### 5.2 Frontend Testing
- [ ] Set up React Testing Library
- [ ] Create component tests
- [ ] Implement integration tests
- [ ] Add E2E tests with Cypress
- [ ] Test Redux state management
- [ ] Test API integration

#### 5.3 Performance Testing
- [ ] Set up load testing with Artillery
- [ ] Test database query performance
- [ ] Optimize API response times
- [ ] Test file upload performance
- [ ] Monitor memory usage

#### 5.4 Security Testing
- [ ] Implement security headers
- [ ] Test authentication vulnerabilities
- [ ] Validate input sanitization
- [ ] Test file upload security
- [ ] Implement rate limiting

### Phase 6: Deployment & DevOps (Weeks 33-36)

#### 6.1 Docker Configuration
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Set up docker-compose.yml
- [ ] Configure multi-stage builds
- [ ] Optimize Docker images
- [ ] Set up development containers

#### 6.2 CI/CD Pipeline
- [ ] Set up GitHub Actions workflow
- [ ] Configure automated testing
- [ ] Set up automated deployment
- [ ] Add code quality checks
- [ ] Implement automated security scanning
- [ ] Set up staging environment

#### 6.3 Production Deployment
- [ ] Set up production server
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Implement backup strategies

#### 6.4 Monitoring & Maintenance
- [ ] Set up application monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Implement health checks
- [ ] Create maintenance procedures
- [ ] Set up automated backups

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
- [ ] **Unit Tests** - Comprehensive unit tests for all API endpoints
- [ ] **Integration Tests** - Integration tests for database operations
- [ ] **Authentication Tests** - Tests for authentication and authorization
- [ ] **Role Management Tests** - Tests for role-based access control

### Frontend Testing
- [ ] **Component Tests** - Unit tests for React components
- [ ] **Integration Tests** - Integration tests for user workflows
- [ ] **E2E Tests** - End-to-end tests for critical user journeys

### Performance Testing
- [ ] **Load Testing** - Performance testing for high-traffic scenarios
- [ ] **Database Performance** - Testing database query performance
- [ ] **API Response Times** - Monitoring and optimizing API response times

## 🚀 Deployment & Infrastructure

### Production Setup
- [ ] **Environment Configuration** - Production environment setup
- [ ] **Database Migration** - Production database setup and migration
- [ ] **SSL Configuration** - HTTPS setup for production
- [ ] **Monitoring & Logging** - Production monitoring and logging setup

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
