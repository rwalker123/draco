# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Draco Sports Manager is a comprehensive sports management application being migrated from ASP.NET Framework to a modern Node.js stack. The application manages baseball and golf leagues, teams, players, games, and sports-related activities.

**📚 For detailed architecture documentation, see [ARCHITECTURE.md](./draco-nodejs/ARCHITECTURE.md)**

## Technology Stack

- **Backend**: Node.js with Express.js and TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 15 (React 19) with TypeScript, Material-UI 7
- **Authentication**: JWT with bcrypt, role-based access control
- **Storage**: Local filesystem and AWS S3 (with LocalStack for dev)

## Key Commands

All commands must be run from the root directory (`/Users/raywalker/source/Draco`):

## Git Worktree Setup

For development using git worktrees (recommended for feature work):

1. **Create worktree** (from main repo):
   ```bash
   git worktree add ../draco-feature-name feature-branch
   ```

2. **Initialize worktree** (from new worktree directory):
   ```bash
   ./worktree-init.sh
   ```

**See [WORKTREE_SETUP.md](./WORKTREE_SETUP.md) for detailed instructions.**

### Development
```bash
npm run dev                  # Start both backend and frontend
npm run backend:dev          # Start backend only (port 5000)
npm run frontend-next:start  # Start frontend only (port 3000)
```

**Important Development Notes:**
- Backend API is served via HTTPS on port 3001 (https://localhost:3001)
- Frontend proxies API requests through Next.js
- Use HTTPS and port 3001 when testing backend endpoints directly

### Building
```bash
npm run build               # Build both projects
npm run backend:build       # Build backend TypeScript
npm run frontend-next:build # Build frontend for production
```

### Testing
```bash
npm run test:all            # Run all tests
npm run backend:test        # Backend tests only
npm run frontend-next:test  # Frontend tests only
```

### Code Quality
```bash
npm run lint:all            # Lint all code
npm run format:all          # Format all code
npm run backend:lint        # Lint backend
npm run frontend-next:lint  # Lint frontend
```

### Database Management
```bash
cd draco-nodejs/backend
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema changes
npx prisma migrate dev      # Run migrations
npx prisma studio           # Open Prisma Studio
```

## High-Level Architecture

### Backend Structure
The backend follows a layered architecture:
- **Routes** (`/routes`): HTTP endpoints that handle requests
- **Services** (`/services`): Business logic layer
- **Middleware** (`/middleware`): Authentication, authorization, validation
- **Types** (`/types`): TypeScript type definitions
- **Utils** (`/utils`): Helper functions

Key architectural patterns:
- **Role-Based Access Control**: Three-tier role system (Global, Account, Contact)
- **Account Boundary Enforcement**: Multi-tenant isolation
- **JWT Authentication**: Stateless authentication with refresh tokens
- **Storage Abstraction**: Supports both local and S3 storage

### Frontend Structure
The frontend uses Next.js 15 with App Router:
- **App Directory** (`/app`): Next.js pages and layouts
- **Components** (`/components`): Reusable UI components
- **Context** (`/context`): React contexts for state management (Auth, Role, Account)
- **Utils** (`/utils`): Helper functions

Key patterns:
- **Context-Based State**: Auth, Role, and Account contexts manage global state
- **Protected Routes**: Role-based route protection
- **Material-UI Theming**: Consistent design system
- **Responsive Design**: Mobile-first approach

### Authentication & Authorization Flow
1. User logs in → JWT token issued
2. Token stored in localStorage and AuthContext
3. API requests include token in Authorization header
4. Backend middleware validates token and loads user roles
5. Route protection checks permissions at multiple levels:
   - Authentication required
   - Role permissions (view, edit, delete)
   - Account boundary (user must belong to account)
   - Contact permissions (team/player-specific access)

### Role System
- **Global Roles**: Administrator, User
- **Account Roles**: AccountAdmin, ContactAdmin, Contact
- **Permissions**: Hierarchical (Admin > ContactAdmin > Contact)
- **Frontend**: Use `useRole()` hook for permission checks

## Important Rules

1. **NEVER** run npm commands in subdirectories - always use root-level scripts
2. **ALWAYS** use RoleContext (`useRole()`) for frontend permission checks
3. **ALWAYS** look to minimize code duplication using DRY principles and other best practices for code and design
4. **ALWAYS** check for lint/typecheck errors after changes
5. **ALWAYS** use the account boundary enforcement in backend routes
6. **ALWAYS** use season-specific tables (leagueseason, divisionseason, teamsseason) for statistics and season-related queries, NOT the definition tables (league, divisiondefs, teams). The definition tables are season-agnostic, while the season tables contain season-specific data.
7. **NEVER** change API response structures or data contracts without checking ALL consumers first. Before modifying any API endpoint response:
   - Search for all usages of that endpoint across the entire codebase
   - Check both frontend and backend consumers
   - Maintain backward compatibility by adding new fields rather than changing existing ones
   - If changes are absolutely necessary, update ALL consumers in the same commit
8. **ALWAYS** update the OpenAPI specification when making API changes. After creating, modifying, or deleting any API endpoints:
   - Update `draco-nodejs/backend/openapi.yaml` to reflect the changes
   - Add new paths, update existing paths, or remove deprecated paths
   - Update request/response schemas in the components section
   - Maintain accurate documentation for all API endpoints
   - Test the API documentation at `/apidocs` to ensure it renders correctly

## Git Hooks and CI/CD Workflow

### Git Commit Hooks
Git commit hooks provide **fast developer feedback** with the following checks:
- **Secrets scan**: Prevents committing sensitive data
- **Prettier formatting**: Auto-formats code on commit
- **ESLint**: Fixes linting issues automatically
- **Backend typecheck**: Runs TypeScript validation for backend changes only

**Note**: Frontend typecheck is **intentionally excluded** from git hooks due to Next.js context requirements. This ensures fast commits while maintaining code quality.

### Pull Request Validation
**Comprehensive validation** runs on all PRs via GitHub Actions (`.github/workflows/pr-validation.yml`):
- ✅ **Type Check**: `npm run type-check:all` (full project context)
- ✅ **Build**: `npm run build` (includes Next.js typecheck)
- ✅ **Lint**: `npm run lint:all` (all projects)
- ✅ **Tests**: `npm run test:all` (backend + frontend)
- ✅ **Security**: detect-secrets scan + npm audit
- ✅ **Dependencies**: Vulnerability check

### Development Workflow
1. **Local development**: Use `npm run build`, `npm run type-check:all`, `npm run test:all` for comprehensive validation
2. **Git commits**: Fast feedback with formatting, linting, and backend typecheck
3. **Pull requests**: Full validation ensures production-ready code
4. **Merge protection**: All CI checks must pass before merge

This two-tier approach provides fast developer feedback while ensuring comprehensive validation before code reaches production.

### Auto-merge for Pull Requests
**GitHub's auto-merge feature** allows PRs to be automatically merged when all requirements are met:

#### Repository Setup (One-time)
1. **Enable auto-merge**: Go to repository Settings → General → Pull Requests → Check "Allow auto-merge"
2. **Branch protection**: Ensure main branch requires PR validation checks to pass
3. **Required reviews**: Configure any required code review settings

#### Using Auto-merge on PRs
1. Create PR and ensure all validation checks are queued
2. Click **"Enable auto-merge"** button in the PR
3. Select merge method (Squash and merge recommended)
4. Customize commit message if needed
5. PR will automatically merge when all checks pass

#### Auto-merge Benefits
- ✅ **Hands-free merging**: No need to wait around for CI to complete
- ✅ **Consistent process**: Always waits for full validation before merge
- ✅ **Team efficiency**: Developers can move on to other tasks immediately
- ✅ **Safety**: Only merges when ALL requirements are satisfied

**Note**: Auto-merge will be disabled if someone without write permissions pushes changes to the PR.

## Common Tasks

### Adding a New API Endpoint
1. Create route in `/backend/src/routes`
2. Add business logic in `/backend/src/services`
3. Apply appropriate middleware (auth, role, account boundary)
4. **Update `draco-nodejs/backend/openapi.yaml`** with the new endpoint documentation
5. Update frontend API client if needed
6. Add frontend component/page to consume the endpoint

### Adding a New Frontend Page
1. Create page in `/frontend-next/app`
2. Add navigation in appropriate components
3. Apply role-based protection if needed
4. Use Material-UI components for consistency
5. Handle loading and error states

### Database Schema Changes
1. Update schema in `/backend/prisma/schema.prisma`
2. Run `npx prisma db push` to update database
3. Run `npx prisma generate` to update client
4. Update relevant services and types
5. Test thoroughly with existing data

## API Documentation Links

When working with these dependencies, check latest docs if needed:

- **Prisma ORM**: [Latest API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference) (Currently v6.12.0)
- **Next.js**: [API Reference](https://nextjs.org/docs/app/api-reference) (Currently v15.3.4)
- **Express.js**: [5.x API](https://expressjs.com/en/5x/api.html) (Currently v5.1.0)
- **Material-UI**: [Component API](https://mui.com/material-ui/api/) (Currently v7.2.0)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) (Currently v5.8.3)
- **JWT**: [jsonwebtoken docs](https://github.com/auth0/node-jsonwebtoken#readme) (Currently v9.0.2)
- **Axios**: [API Reference](https://axios-http.com/docs/intro) (Currently v1.10.0)
- **React**: [API Reference](https://react.dev/reference/react) (Currently v19.0.0)

Note: Always verify latest syntax/features using WebFetch if unsure about recent changes.

## Migration Progress

The application is approximately 31% migrated from ASP.NET to Node.js. Key completed features:
- Authentication system with JWT
- Account management with multi-tenant support
- Season and league management
- Schedule management with calendar views
- Team management with logo upload
- Domain-based routing for custom URLs

Priority tasks remaining:
- Fix timezone handling in games database
- Complete game score and recap functionality
- Add umpire support to game management
- Implement player management
- Add statistics and analytics

## Debugging Notes

- **Frontend Paging**: 
  * @agent-frontend-nextjs still not working, paging is still refreshing the whole page. I don't know if this is true but you do have a couple debug overlays, could they be causing it? I don't think we need those anymore, they are just displaying configuration information

## Important Best Practices

- Always run npm frontend-next:lint and npm backend:lint from the root project directory

## Tool Preferences

- **Always use Serena tools when available**

## MCP Server Configuration

This project uses **project-specific MCP server configuration** via `.mcp.json` to ensure consistent tooling across all team members and git worktrees.

### Available MCP Servers

- **serena**: Advanced code analysis and semantic search tools
- **context7**: Up-to-date library documentation and code examples

### Configuration Details

The `.mcp.json` file in the project root automatically configures:
- **serena** with proper project path resolution for all worktrees
- **context7** for accessing latest library documentation

### Benefits

- ✅ **Worktree Compatibility**: MCP servers work in main repo and all git worktrees
- ✅ **Team Consistency**: All team members get identical MCP server setup
- ✅ **Version Control**: MCP configuration is tracked and versioned
- ✅ **Zero Setup**: New team members get MCP servers automatically

**Note**: If you're not seeing MCP servers in a worktree, ensure `.mcp.json` exists in the project root and restart Claude Code.
- ensure you always use serena when appropriate
- Do not lie about knowing or seeing things (in images) that you obviously can't, tell the truth at all times.
- use apiRequest for making rest calls in utils/apiClient.ts and withRetry in errorHandling.ts