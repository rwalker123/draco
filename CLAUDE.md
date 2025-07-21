# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Draco Sports Manager is a comprehensive sports management application being migrated from ASP.NET Framework to a modern Node.js stack. The application manages baseball and golf leagues, teams, players, games, and sports-related activities.

## Technology Stack

- **Backend**: Node.js with Express.js and TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 15 (React 19) with TypeScript, Material-UI 7
- **Authentication**: JWT with bcrypt, role-based access control
- **Storage**: Local filesystem and AWS S3 (with LocalStack for dev)

## Key Commands

All commands must be run from the root directory (`/Users/raywalker/source/Draco`):

### Development
```bash
npm run dev                  # Start both backend and frontend
npm run backend:dev          # Start backend only (port 5000)
npm run frontend-next:start  # Start frontend only (port 3000)
```

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

## Common Tasks

### Adding a New API Endpoint
1. Create route in `/backend/src/routes`
2. Add business logic in `/backend/src/services`
3. Apply appropriate middleware (auth, role, account boundary)
4. Update frontend API client if needed
5. Add frontend component/page to consume the endpoint

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