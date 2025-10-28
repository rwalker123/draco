# Draco Sports Manager - Node.js Migration Plan

## Executive Summary

This document outlines the complete migration of the Draco Sports Manager application from ASP.NET Framework 4.8 to Node.js, enabling Linux deployment and modern development practices.

## Current Application Analysis

### Core Functionality
- **Multi-tenant sports management system** supporting multiple organizations
- **Baseball and Golf** sports with complex data models
- **User management** with role-based access control
- **Team/Player management** with statistics tracking
- **Photo galleries** and file uploads
- **Discussion boards** and messaging
- **Social media integration** (Twitter, Facebook)
- **Email notifications** and announcements
- **Hall of Fame** and voting systems

### Current Architecture Issues
- **Windows-specific dependencies** (HttpContext.Current, Server.MapPath)
- **Legacy ASP.NET Framework** (4.8) with limited Linux support
- **Complex Entity Framework** configuration
- **Outdated frontend** (Bootstrap 3, jQuery 1.11, Knockout.js)
- **IIS-specific configuration** requirements

## Migration Strategy

### Phase 1: Foundation & Infrastructure (Weeks 1-4)

#### 1.1 Project Setup
```bash
# Create Node.js project structure
mkdir draco-nodejs
cd draco-nodejs

# Initialize backend
mkdir backend
cd backend
npm init -y
npm install express typescript @types/node @types/express
npm install --save-dev ts-node nodemon

# Initialize frontend-next
cd ..
npx create-next-app frontend-next --typescript
cd frontend-next
npm install @mui/material @emotion/react @emotion/styled
npm install axios
```

#### 1.2 Database Migration
```sql
-- PostgreSQL Schema (migrated from SQL Server)
-- Core tables
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type_id INTEGER REFERENCES account_types(id),
    affiliation_id INTEGER REFERENCES affiliations(id),
    twitter_account_name VARCHAR(100),
    facebook_fan_page VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES aspnet_users(id),
    first_name VARCHAR(25) NOT NULL,
    last_name VARCHAR(25) NOT NULL,
    email VARCHAR(50),
    phone1 VARCHAR(14),
    date_of_birth DATE NOT NULL,
    creator_account_id INTEGER REFERENCES accounts(id)
);

-- Sports-specific tables
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    name VARCHAR(50) NOT NULL,
    team_logo_url VARCHAR(255)
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id),
    team_season_id INTEGER REFERENCES team_seasons(id),
    first_year INTEGER
);
```

#### 1.3 Backend Architecture
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { accountsRouter } from './routes/accounts';
import { teamsRouter } from './routes/teams';
import { playersRouter } from './routes/players';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);

export default app;
```

### Phase 2: Core API Development (Weeks 5-12)

#### 2.1 Authentication System
```typescript
// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';

export class AuthService {
  async login(email: string, password: string): Promise<string> {
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  async register(userData: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await User.create({
      ...userData,
      passwordHash: hashedPassword
    });
  }
}
```

#### 2.2 Account Management API
```typescript
// src/routes/accounts.ts
import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const accountController = new AccountController();

// GET /api/accounts/:accountId
router.get('/:accountId', authMiddleware, accountController.getAccount);

// PUT /api/accounts/:accountId/twitter
router.put('/:accountId/twitter', authMiddleware, accountController.updateTwitterId);

// POST /api/accounts/:accountId/urls
router.post('/:accountId/urls', authMiddleware, accountController.addAccountUrl);

export { router as accountsRouter };
```

#### 2.3 Team & Player Management
```typescript
// src/controllers/team.controller.ts
import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';

export class TeamController {
  private teamService = new TeamService();

  async getTeams(req: Request, res: Response): Promise<void> {
    const { accountId } = req.params;
    const teams = await this.teamService.getTeamsByAccount(parseInt(accountId));
    res.json(teams);
  }

  async createTeam(req: Request, res: Response): Promise<void> {
    const { accountId } = req.params;
    const teamData = req.body;
    
    const team = await this.teamService.createTeam({
      ...teamData,
      accountId: parseInt(accountId)
    });
    
    res.status(201).json(team);
  }
}
```

### Phase 3: Frontend Development (Weeks 13-20)

#### 3.1 React Application Structure
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { store } from './store';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { Players } from './pages/Players';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/players" element={<Players />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
```

#### 3.2 State Management (Redux Toolkit)
```typescript
// src/store/slices/teamsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { teamApi } from '../../api/teamApi';

export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (accountId: number) => {
    const response = await teamApi.getTeams(accountId);
    return response.data;
  }
);

const teamsSlice = createSlice({
  name: 'teams',
  initialState: {
    teams: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});
```

#### 3.3 Modern UI Components
```typescript
// src/components/TeamCard.tsx
import React from 'react';
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';
import { Team } from '../types/team';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
  return (
    <Card onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={team.logoUrl} alt={team.name} />
          <Box>
            <Typography variant="h6">{team.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {team.leagueName}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### Phase 4: Advanced Features (Weeks 21-28)

#### 4.1 File Upload System
```typescript
// src/services/fileUpload.service.ts
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION
  });

  async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
```

#### 4.2 Email Service
```typescript
// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { EmailTemplate } from '../types/email';

export class EmailService {
  private transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  async sendEmail(template: EmailTemplate, to: string[]): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: to.join(', '),
      subject: template.subject,
      html: template.html
    });
  }
}
```

#### 4.3 Real-time Features (WebSocket)
```typescript
// src/services/websocket.service.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('join-account', (accountId: number) => {
        socket.join(`account-${accountId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  emitToAccount(accountId: number, event: string, data: any): void {
    this.io.to(`account-${accountId}`).emit(event, data);
  }
}
```

### Phase 5: Testing & Quality Assurance (Weeks 29-32)

#### 5.1 Backend Testing
```typescript
// src/tests/account.test.ts
import request from 'supertest';
import { app } from '../app';
import { createTestUser, createTestAccount } from './helpers';

describe('Account API', () => {
  let authToken: string;
  let testAccount: any;

  beforeEach(async () => {
    const user = await createTestUser();
    authToken = await loginUser(user.email, 'password');
    testAccount = await createTestAccount();
  });

  it('should get account info', async () => {
    const response = await request(app)
      .get(`/api/accounts/${testAccount.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(testAccount.name);
  });
});
```

#### 5.2 Frontend Testing
```typescript
// src/components/__tests__/TeamCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamCard } from '../TeamCard';

const mockTeam = {
  id: 1,
  name: 'Test Team',
  logoUrl: 'test-logo.jpg',
  leagueName: 'Test League'
};

describe('TeamCard', () => {
  it('renders team information correctly', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('Test League')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<TeamCard team={mockTeam} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

### Phase 6: Deployment & DevOps (Weeks 33-36)

#### 6.1 Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=draco
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 6.2 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Deployment commands
          ssh user@server "cd /var/www/draco && git pull"
          ssh user@server "cd /var/www/draco && docker-compose up -d --build"
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18 LTS
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt
- **File Storage:** AWS S3
- **Email:** Nodemailer
- **Real-time:** Socket.io
- **Testing:** Jest, Supertest

### Frontend
- **Framework:** React 18 with TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Testing:** React Testing Library, Jest

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Database:** PostgreSQL 15
- **Caching:** Redis
- **File Storage:** AWS S3
- **Email:** SMTP via SendGrid (evaluate alternatives as needed)
- **Monitoring:** PM2, Winston logging

## Migration Benefits

### Performance Improvements
- **Faster startup times** (Node.js vs .NET Framework)
- **Better memory usage** (event-driven architecture)
- **Improved concurrency** (non-blocking I/O)
- **Reduced bundle sizes** (modern JavaScript)

### Development Experience
- **TypeScript** for type safety
- **Modern tooling** (ESLint, Prettier, Husky)
- **Hot reloading** for faster development
- **Rich ecosystem** of npm packages

### Deployment Advantages
- **Linux native support** (no compatibility issues)
- **Containerized deployment** (Docker)
- **Cloud-native** architecture
- **Easy scaling** with load balancers

### Maintenance Benefits
- **Active community** and regular updates
- **Better debugging** tools
- **Comprehensive testing** frameworks
- **Modern security** practices

## Risk Mitigation

### Data Migration
- **Comprehensive backup** before migration
- **Incremental data migration** with rollback capability
- **Data validation** scripts
- **Parallel running** during transition

### Feature Parity
- **Detailed feature mapping** from old to new system
- **User acceptance testing** for critical features
- **Gradual rollout** with feature flags
- **Fallback mechanisms** for critical functions

### Performance Monitoring
- **Application performance monitoring** (APM)
- **Database query optimization**
- **Load testing** before production
- **Real-time monitoring** dashboards

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1 | 4 weeks | Project setup, database migration, basic infrastructure |
| 2 | 8 weeks | Core API development, authentication, CRUD operations |
| 3 | 8 weeks | React frontend, state management, UI components |
| 4 | 8 weeks | Advanced features, file uploads, real-time capabilities |
| 5 | 4 weeks | Comprehensive testing, quality assurance |
| 6 | 4 weeks | Deployment, DevOps, production readiness |

**Total Duration: 36 weeks (9 months)**

## Success Metrics

### Technical Metrics
- **Page load times** < 2 seconds
- **API response times** < 200ms
- **99.9% uptime** availability
- **Zero critical security** vulnerabilities

### Business Metrics
- **100% feature parity** with existing system
- **Improved user satisfaction** scores
- **Reduced maintenance** costs
- **Faster feature development** cycles

### Operational Metrics
- **Successful Linux deployment**
- **Automated CI/CD pipeline**
- **Comprehensive monitoring** and alerting
- **Disaster recovery** procedures

## Conclusion

This Node.js migration plan provides a comprehensive roadmap for modernizing the Draco Sports Manager application while ensuring Linux compatibility and improved performance. The phased approach minimizes risk while delivering value incrementally.

The new architecture will provide:
- **Native Linux support** for deployment
- **Modern development experience** for the team
- **Better performance** and scalability
- **Easier maintenance** and future enhancements

This migration represents a significant investment in the application's future, positioning it for long-term success in a modern, cloud-native environment. 

3. **Set up the frontend**
   ```bash
   cd ../frontend-next
   npm install
   
   # Start development server
   npm run dev
   ``` 