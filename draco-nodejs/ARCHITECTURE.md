# Draco Sports Manager - Node.js Architecture Document

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Architecture](#database-architecture)
8. [Authentication & Security](#authentication--security)
9. [API Design](#api-design)
10. [Development Workflow](#development-workflow)
11. [Deployment Architecture](#deployment-architecture)
12. [Security Considerations](#security-considerations)
13. [Performance Considerations](#performance-considerations)
14. [Monitoring & Logging](#monitoring--logging)

## Overview

The Draco Sports Manager is a comprehensive sports management application migrated from ASP.NET Framework 4.8 to a modern Node.js stack. The application manages sports leagues, teams, players, games, and various sports-related activities with a focus on baseball and golf leagues.

### Key Features
- **Multi-sport Support**: Baseball and golf league management
- **Multi-tenant Architecture**: Account-based data isolation
- **User Management**: Authentication, authorization, and role-based access
- **League Management**: Seasons, teams, players, schedules, and statistics
- **Statistics Engine**: Comprehensive batting, pitching, and team statistics
- **Standings System**: League and division standings with tie support
- **Schedule Management**: Game scheduling with calendar views
- **Media Management**: Team logos, player photos, and galleries
- **Domain Routing**: Custom domain support for accounts
- **Communication**: Messaging system and announcements

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │  Email  │            │  JWT    │            │ Prisma  │
    │ Service │            │  Auth   │            │  ORM    │
    └─────────┘            └─────────┘            └─────────┘
```

### Architecture Principles
- **Separation of Concerns**: Clear separation between frontend, backend, and database
- **RESTful API Design**: Standardized API endpoints following REST principles
- **Type Safety**: TypeScript throughout the stack for better development experience
- **Scalability**: Modular design allowing for horizontal scaling
- **Security First**: JWT authentication, input validation, and secure practices

## Technology Stack

### Backend Stack
- **Runtime**: Node.js v22.16.0
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.8.3
- **Database ORM**: Prisma 6.12.0
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **Email Service**: Nodemailer 6.9.21
- **Security**: Helmet 9.0.0, CORS 2.8.5
- **Storage**: AWS S3 SDK 3.540.0, LocalStack for development
- **Development**: Nodemon 3.1.10, ts-node 10.9.2

### Frontend Stack
- **Framework**: Next.js 15.3.4 with React 19.0.0
- **Language**: TypeScript 5.8.3
- **UI Library**: Material-UI 7.2.0
- **State Management**: React Context API (Auth, Role, Account contexts)
- **Routing**: Next.js App Router
- **HTTP Client**: Axios 1.10.0
- **Build Tool**: Next.js built-in build system
- **Styling**: Emotion 11.14.0, Tailwind CSS 4.0
- **Date Handling**: date-fns 4.1.0
- **Form Validation**: Built-in HTML5 + custom validation

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, TypeScript compiler
- **Testing**: Jest, React Testing Library

## Project Structure

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
├── frontend-next/           # Frontend application (Next.js)
│   ├── app/                # Next.js App Router
│   │   ├── account/       # Account-specific pages
│   │   ├── admin/         # Admin pages
│   │   ├── api/           # API routes (proxy)
│   │   ├── login/         # Authentication pages
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # Shared React components
│   ├── context/          # React contexts
│   ├── lib/              # Core libraries
│   ├── public/           # Static assets
│   ├── utils/            # Utility functions
│   ├── package.json      # Frontend dependencies
│   ├── next.config.mjs   # Next.js configuration
│   └── tsconfig.json     # TypeScript configuration
├── run-backend.sh         # Backend helper script
├── run-frontend.sh        # Frontend helper script
└── .gitignore            # Git ignore rules
```

## Backend Architecture

### Core Components

#### 1. Application Layer (`src/app.ts`)
- Express application configuration
- Middleware setup (CORS, Helmet, JSON parsing)
- Route registration
- Error handling middleware

#### 2. Server Layer (`src/server.ts`)
- HTTP server initialization
- Environment configuration
- Graceful shutdown handling

#### 3. Route Layer (`src/routes/`)
- **Authentication Routes**: Login, registration, password reset
- **User Routes**: User management and profiles
- **League Routes**: League, team, and player management
- **Game Routes**: Game scheduling and statistics
- **Media Routes**: Photo galleries and file uploads

#### 4. Controller Layer (`src/controllers/`)
- Request/response handling
- Input validation
- Business logic coordination
- Error handling

#### 5. Service Layer (`src/services/`)
- **AuthenticationService**: JWT token management
- **EmailService**: Email sending functionality
- **PasswordService**: Password hashing and verification
- **UserService**: User management operations

#### 6. Middleware Layer (`src/middleware/`)
- **Authentication**: JWT token verification
- **Authorization**: Role-based access control
- **Validation**: Request data validation
- **Error Handling**: Centralized error processing

### Database Integration

#### Prisma ORM
- **Schema Definition**: `prisma/schema.prisma`
- **Client Generation**: Auto-generated Prisma client
- **Migration Management**: Database schema versioning
- **Type Safety**: Generated TypeScript types

#### Database Models
- **User Management**: `aspnetusers`, `aspnetroles`, `aspnetuserroles`, `aspnetuserclaims`
- **Account Management**: `accounts`, `seasons`, `accountroles`, `contactroles`
- **League Structure**: 
  - Definition tables: `league`, `divisiondefs`, `teams`
  - Season-specific tables: `leagueseason`, `divisionseason`, `teamsseason`
- **Player Management**: `contacts`, `players`, `rosters`
- **Game Management**: `leagueschedule`, `gamestats`, `batstatsum`, `pitchstatsum`
- **Media Management**: `photogallery`, `teamlogos`
- **Important**: Always use season-specific tables for statistics and queries

## Frontend Architecture (Next.js)

### Core Components

#### 1. Application Structure
- **App Router**: Next.js 13+ App Router for file-based routing
- **Root Layout**: Global layout with providers and theme
- **Route Segments**: Dynamic and static routes
- **Server Components**: Default rendering for better performance
- **Client Components**: Interactive components with 'use client'

#### 2. Component Architecture
- **Shared Components**: Reusable UI components in `/components`
- **Page Components**: Route-specific components in `/app`
- **Layout Components**: Nested layouts for route groups
- **Server vs Client**: Strategic component splitting

#### 3. State Management (Context API)
- **AuthContext**: User authentication state and methods
- **RoleContext**: User permissions and role management
- **AccountContext**: Current account selection
- **Local State**: Component-level state with hooks

#### 4. Service Layer
- **API Proxy**: Next.js API routes for backend communication
- **Type-Safe Fetching**: Shared types between frontend and backend
- **Error Handling**: Consistent error boundaries
- **Data Caching**: Next.js built-in caching strategies

### UI/UX Design

#### Material-UI Integration
- **Theme System**: Consistent design tokens
- **Component Library**: Pre-built UI components
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance

#### User Experience
- **Progressive Enhancement**: Graceful degradation
- **Loading States**: User feedback during operations
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time input validation

## Database Architecture

### PostgreSQL Schema

#### Core Tables
- **User Management**: ASP.NET Identity tables
- **Sports Management**: League, team, player tables
- **Game Management**: Game, statistics, schedule tables
- **Media Management**: Photo, video, file tables

#### Key Relationships
- **One-to-Many**: Account → Teams, League → Seasons
- **Many-to-Many**: Users ↔ Roles, Players ↔ Teams
- **Hierarchical**: League → Division → Team

#### Data Integrity
- **Foreign Key Constraints**: Referential integrity
- **Indexes**: Performance optimization
- **Triggers**: Automated data maintenance

### Migration Strategy

#### Legacy Data Migration
- **pgloader**: SQL Server to PostgreSQL migration
- **Password Migration**: Legacy hash to bcrypt conversion
- **Data Validation**: Integrity checks post-migration

## Authentication & Security

### Authentication Flow

#### JWT Implementation
```typescript
// Token Structure
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "user-id",
    "username": "username",
    "roles": ["role1", "role2"],
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

#### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Configurable JWT expiration
- **CORS Configuration**: Cross-origin request control
- **Helmet Security**: HTTP security headers
- **Input Validation**: Request data sanitization

### Authorization

#### Role-Based Access Control
- **Three-Tier Role System**:
  - **Global Roles**: Administrator, User - system-wide permissions
  - **Account Roles**: AccountAdmin, ContactAdmin, Contact - account-specific permissions
  - **Contact Permissions**: Team/player-specific access control
- **Hierarchical Permissions**: Admin > ContactAdmin > Contact
- **Route Protection**: Middleware-based access control with account boundary enforcement
- **Frontend Integration**: useRole() hook for permission checks

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

#### Password Reset
- `POST /api/passwordReset/request` - Request password reset
- `GET /api/passwordReset/verify/:token` - Verify reset token
- `POST /api/passwordReset/reset` - Reset password

#### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID

#### Account Management
- `GET /api/accounts` - List user accounts
- `GET /api/accounts/:accountId` - Get account details
- `POST /api/accounts/:accountId/logo` - Upload account logo

#### Season Management
- `GET /api/accounts/:accountId/seasons` - List seasons
- `POST /api/accounts/:accountId/seasons` - Create season
- `PUT /api/accounts/:accountId/seasons/:seasonId` - Update season
- `DELETE /api/accounts/:accountId/seasons/:seasonId` - Delete season

#### League & Division Management
- `GET /api/accounts/:accountId/seasons/:seasonId/leagues` - List leagues
- `POST /api/accounts/:accountId/seasons/:seasonId/leagues` - Create league
- `GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions` - List divisions for league season
- `POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions` - Create and add division to league season
- `PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId` - Update division name and priority
- `DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId` - Remove division from league season

#### Team Management
- `GET /api/accounts/:accountId/teams` - List teams
- `POST /api/accounts/:accountId/teams` - Create team
- `GET /api/accounts/:accountId/teams/:teamId` - Get team details
- `PUT /api/accounts/:accountId/teams/:teamId` - Update team
- `POST /api/accounts/:accountId/teams/:teamId/logo` - Upload team logo

#### Schedule Management
- `GET /api/accounts/:accountId/seasons/:seasonId/schedule` - Get schedule
- `POST /api/accounts/:accountId/seasons/:seasonId/schedule` - Create games
- `PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId` - Update game

#### Statistics & Standings
- `GET /api/accounts/:accountId/seasons/:seasonId/standings` - Get standings
- `GET /api/accounts/:accountId/seasons/:seasonId/statistics/batting` - Batting stats
- `GET /api/accounts/:accountId/seasons/:seasonId/statistics/pitching` - Pitching stats
- `GET /api/accounts/:accountId/seasons/:seasonId/statistics/leaders` - Statistical leaders

### API Standards

#### Response Format
```typescript
{
  "success": boolean,
  "message": string,
  "data": any,
  "errors": string[]
}
```

#### Error Handling
- **HTTP Status Codes**: Standard REST status codes
- **Error Messages**: User-friendly error descriptions
- **Validation Errors**: Detailed field-level errors
- **Logging**: Server-side error logging

## Development Workflow

### Development Environment

#### Local Setup
1. **Database**: PostgreSQL with Prisma ORM
2. **Backend**: Node.js with TypeScript (port 5000, HTTPS on 3001)
3. **Frontend**: Next.js development server (port 3000)
4. **Environment Variables**: `.env` configuration
5. **SSL/TLS**: mkcert for local HTTPS development

#### Development Commands (from root directory)
- **`npm run dev`**: Start both backend and frontend concurrently
- **`npm run backend:dev`**: Start backend only
- **`npm run frontend-next:start`**: Start frontend only
- **`npm run build`**: Build both projects
- **`npm run lint:all`**: Lint all code
- **`npm run type-check:all`**: Type check all code
- **`npm run test:all`**: Run all tests

#### Database Commands
- **`npx prisma generate`**: Generate Prisma client
- **`npx prisma db push`**: Push schema changes
- **`npx prisma migrate dev`**: Run migrations
- **`npx prisma studio`**: Open Prisma Studio GUI

### Development Process

#### Code Organization
- **Feature-Based Structure**: Related code grouped together
- **Type Safety**: TypeScript throughout the stack
- **Code Standards**: ESLint and Prettier configuration
- **Documentation**: Inline code documentation

#### Testing Strategy
- **Unit Tests**: Component and service testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing
- **Performance Tests**: Load and stress testing

## Deployment Architecture

### Production Environment

#### Infrastructure
- **Web Server**: Nginx reverse proxy
- **Application Server**: Node.js with PM2
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Cloud storage for media files

#### Deployment Pipeline
1. **Build**: TypeScript compilation and asset bundling
2. **Test**: Automated testing suite
3. **Deploy**: Blue-green deployment strategy
4. **Monitor**: Health checks and performance monitoring

### Environment Configuration

#### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>

# JWT
JWT_SECRET=<REDACTED>
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<REDACTED>
SMTP_PASS=<REDACTED>

# Application
NODE_ENV=production
PORT=5000
```

## Security Considerations

### Data Protection
- **Encryption**: HTTPS/TLS for data in transit
- **Password Security**: bcrypt hashing with salt
- **Input Sanitization**: SQL injection prevention
- **XSS Protection**: Cross-site scripting prevention

### Access Control
- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Session Management**: Secure token handling
- **Rate Limiting**: API request throttling

### Infrastructure Security
- **Firewall Configuration**: Network access control
- **SSL/TLS**: Secure communication protocols
- **Regular Updates**: Security patch management
- **Backup Strategy**: Data protection and recovery

## Performance Considerations

### Backend Optimization
- **Database Indexing**: Query performance optimization
- **Connection Pooling**: Database connection management
- **Caching**: Redis for frequently accessed data
- **Compression**: Response compression middleware

### Frontend Optimization
- **Server Components**: Default server-side rendering
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js font optimization
- **Bundle Analysis**: Built-in bundle analyzer
- **Prefetching**: Automatic link prefetching

### Monitoring
- **Performance Metrics**: Response time and throughput
- **Error Tracking**: Application error monitoring
- **Resource Usage**: CPU, memory, and disk monitoring
- **User Analytics**: Usage patterns and behavior

## Monitoring & Logging

### Application Monitoring
- **Health Checks**: Service availability monitoring
- **Performance Metrics**: Response time and error rates
- **Business Metrics**: User activity and engagement
- **Infrastructure Metrics**: Server and database performance

### Logging Strategy
- **Structured Logging**: JSON format for machine readability
- **Log Levels**: Debug, Info, Warn, Error categorization
- **Log Aggregation**: Centralized log collection
- **Log Retention**: Configurable log retention policies

### Alerting
- **Error Alerts**: Critical error notifications
- **Performance Alerts**: Response time thresholds
- **Availability Alerts**: Service downtime notifications
- **Security Alerts**: Suspicious activity detection

---

## Migration Progress

The application is approximately 31% migrated from ASP.NET Framework to Node.js.

### Completed Features
- ✅ Authentication system with JWT and role-based access control
- ✅ Account management with multi-tenant support
- ✅ Season and league management
- ✅ Team management with logo upload
- ✅ Schedule management with calendar views
- ✅ Statistics engine (batting, pitching, team)
- ✅ Standings with league/division grouping and tie support
- ✅ Domain-based routing for custom URLs
- ✅ File storage (local and S3)

### In Progress
- 🔄 Player/contact management
- 🔄 Game scoring and recap functionality
- 🔄 Umpire management
- 🔄 Email notifications

### Pending
- ⏳ Golf league features
- ⏳ Photo galleries
- ⏳ Advanced statistics and analytics
- ⏳ Mobile application

---

## Conclusion

The Draco Sports Manager Node.js architecture provides a robust, scalable, and maintainable foundation for sports league management. The migration to Next.js and modern Node.js technologies has resulted in improved performance, better developer experience, and a more maintainable codebase.

### Key Strengths
- **Modern Stack**: Next.js 15, Express 5, and latest TypeScript
- **Type Safety**: End-to-end TypeScript with Prisma
- **Multi-tenant Architecture**: Secure account isolation
- **Comprehensive Statistics**: Advanced baseball statistics engine
- **Developer Experience**: Clear structure and excellent tooling

### Architecture Best Practices
- **DRY Principles**: Minimize code duplication
- **Season-Specific Tables**: Always use season tables for statistics
- **Account Boundaries**: Enforce multi-tenant isolation
- **Role-Based Security**: Three-tier permission system
- **API Consistency**: Never change contracts without updating consumers

### Future Considerations
- **Real-time Features**: WebSocket for live game updates
- **Mobile App**: React Native or PWA approach
- **Advanced Analytics**: Machine learning for predictions
- **Performance**: Redis caching and query optimization
- **Scalability**: Horizontal scaling and load balancing 