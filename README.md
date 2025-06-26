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
├── frontend/                # Frontend application
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main application component
│   │   └── index.tsx       # Application entry point
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── run-backend.sh          # Backend helper script
├── run-frontend.sh         # Frontend helper script
└── ARCHITECTURE.md         # Detailed architecture documentation
```

## 🚀 Quick Start

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
   cd ../frontend
   npm install
   
   # Start development server
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/docs

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/draco"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# Email (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

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

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Code Quality

The project uses TypeScript for type safety and ESLint for code quality:

```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint
```

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
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
EMAIL_HOST="your-smtp-host"
EMAIL_USER="your-email"
EMAIL_PASS="your-password"
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