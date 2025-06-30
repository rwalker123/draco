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
- **User Management**: Authentication, authorization, and role-based access
- **League Management**: Seasons, teams, players, schedules, and statistics
- **Real-time Updates**: Live game tracking and statistics
- **Media Management**: Photo galleries and video integration
- **Communication**: Messaging system and announcements

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5432    │
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
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.8.3
- **Database ORM**: Prisma 6.9.0
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 6.0.0
- **Email Service**: Nodemailer 7.0.3
- **Security**: Helmet 8.1.0, CORS 2.8.5
- **Development**: Nodemon 3.1.10, ts-node 10.9.2

### Frontend Stack
- **Framework**: React 19.1.0
- **Language**: TypeScript 4.9.5
- **UI Library**: Material-UI 7.1.1
- **State Management**: Redux Toolkit 2.8.2
- **Routing**: React Router DOM 7.6.2
- **HTTP Client**: Axios 1.10.0
- **Build Tool**: Create React App 5.0.1
- **Styling**: Emotion 11.14.0

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
├── frontend-next/           # Frontend application
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service calls
│   │   ├── store/         # Redux store configuration
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main application component
│   │   └── index.tsx      # Application entry point
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── tsconfig.json      # TypeScript configuration
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
- **User Management**: `aspnetusers`, `aspnetroles`, `aspnetuserroles`
- **League Management**: `accounts`, `league`, `teams`, `players`
- **Game Management**: `games`, `gamestats`, `schedules`
- **Media Management**: `photogallery`, `videos`

## Frontend Architecture

### Core Components

#### 1. Application Structure
- **App Component**: Main application wrapper
- **Routing**: React Router for navigation
- **Theme**: Material-UI theme configuration
- **State Management**: Redux store setup

#### 2. Component Architecture
- **Presentational Components**: UI-only components
- **Container Components**: State-connected components
- **Layout Components**: Page structure components
- **Form Components**: Input and validation components

#### 3. State Management (Redux)
- **Store Configuration**: Centralized state management
- **Slices**: Feature-based state organization
- **Actions**: State modification operations
- **Selectors**: State access patterns

#### 4. Service Layer
- **API Services**: HTTP client configuration
- **Authentication Service**: Login/logout operations
- **Data Services**: CRUD operations for entities

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
- **User Roles**: Admin, Manager, Player, Viewer
- **Permission System**: Feature-based permissions
- **Route Protection**: Middleware-based access control

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

#### League Management
- `GET /api/leagues` - List leagues
- `POST /api/leagues` - Create league
- `GET /api/leagues/:id` - Get league details
- `PUT /api/leagues/:id` - Update league
- `DELETE /api/leagues/:id` - Delete league

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
1. **Database**: PostgreSQL with pgloader migration
2. **Backend**: Node.js with TypeScript compilation
3. **Frontend**: React development server
4. **Environment Variables**: `.env` configuration

#### Helper Scripts
- **`run-backend.sh`**: Backend development commands
- **`run-frontend.sh`**: Frontend development commands
- **Build Scripts**: TypeScript compilation and bundling

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
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Webpack optimization
- **Image Optimization**: Compressed and responsive images
- **CDN Integration**: Content delivery network

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

## Conclusion

The Draco Sports Manager Node.js architecture provides a robust, scalable, and maintainable foundation for sports league management. The modern technology stack, comprehensive security measures, and well-defined development processes ensure a high-quality application that can grow with user needs.

### Key Strengths
- **Modern Stack**: Latest technologies and best practices
- **Type Safety**: TypeScript throughout for better development experience
- **Scalable Design**: Modular architecture supporting growth
- **Security Focus**: Comprehensive security measures
- **Developer Experience**: Clear structure and helper tools

### Future Considerations
- **Microservices**: Potential decomposition for scalability
- **Real-time Features**: WebSocket integration for live updates
- **Mobile App**: React Native for mobile experience
- **AI Integration**: Machine learning for statistics and predictions
- **API Versioning**: Backward compatibility management 