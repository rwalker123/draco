const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { initializeRoleIds } = require('./config/roles');

// Load environment variables
dotenv.config();

// Initialize Prisma and roles
const prisma = new PrismaClient();

// Initialize role IDs from database
initializeRoleIds(prisma).catch((error: any) => {
  console.error('Failed to initialize role IDs:', error);
});

// Import routes (will be created later)
// import { authRouter } from './routes/auth';
// import { accountsRouter } from './routes/accounts';
// import { teamsRouter } from './routes/teams';
// import { playersRouter } from './routes/players';
import testDatabaseRouter from './routes/testdatabase';
import authRouter from './routes/auth';
import passwordResetRouter from './routes/passwordReset';
import roleTestRouter from './routes/roleTest';
import accountsRouter from './routes/accounts';
import seasonsRouter from './routes/seasons';
import leagueSeasonsRouter from './routes/leagueSeasons';
import leaguesRouter from './routes/leagues';
import divisionsRouter from './routes/divisions';
import rostersRouter from './routes/rosters';
import { bigIntSerializer } from './middleware/bigint-serializer';
import { domainRouting } from './middleware/domainRouting';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global BigInt serialization middleware
app.use(bigIntSerializer);

// Domain routing middleware - must come before other routes
app.use(domainRouting);

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes (will be added later)
// app.use('/api/auth', authRouter);
// app.use('/api/accounts', accountsRouter);
// app.use('/api/teams', teamsRouter);
// app.use('/api/players', playersRouter);
app.use('/api/testdatabase', testDatabaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/passwordReset', passwordResetRouter);
app.use('/api/roleTest', roleTestRouter);
app.use('/api/accounts/:accountId/leagues', leaguesRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/leagues', leagueSeasonsRouter);
app.use('/api/accounts/:accountId/divisions', divisionsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', rostersRouter);
app.use('/api/accounts/:accountId/seasons', seasonsRouter);
app.use('/api/accounts', accountsRouter);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app; 