import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { initializeRoleIds } from './config/roles';
import prisma from './lib/prisma';
import { Container } from './container';
import testDatabaseRouter from './routes/testdatabase';
import authRouter from './routes/auth';
import passwordResetRouter from './routes/passwordReset';
import roleTestRouter from './routes/roleTest';
import accountsRouter from './routes/accounts';
import seasonsRouter from './routes/seasons';
import leagueSeasonsRouter from './routes/leagueSeasons';
import leaguesRouter from './routes/leagues';
import teamsRouter from './routes/teams';
import teamRosterRouter from './routes/team-roster';
import teamStatsRouter from './routes/team-stats';
import teamMediaRouter from './routes/team-media';
import gamesRouter from './routes/games';
import { bigIntSerializer } from './middleware/bigint-serializer';
import { domainRouting } from './middleware/domainRouting';
import * as swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { globalErrorHandler } from './utils/globalErrorHandler';
import teamManagersRouter from './routes/teamManagers';
import statisticsRouter from './routes/statistics';
import standingsRouter from './routes/standings';

// Load environment variables
dotenv.config();

// Initialize role IDs from database
initializeRoleIds(prisma).catch((error: unknown) => {
  console.error('Failed to initialize role IDs:', error);
});

// Initialize dependency injection container
const container = new Container(prisma);

const app = express();

// Make container available to all routes
app.locals.container = container;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:3000',
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global BigInt serialization middleware
app.use(bigIntSerializer);

// Domain routing middleware - must come before other routes
app.use(domainRouting);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Swagger API Documentation
app.use('/apidocs', swaggerUi.serve);
app.get('/apidocs', swaggerUi.setup(specs));

// API routes (will be added later)
app.use('/api/testdatabase', testDatabaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/passwordReset', passwordResetRouter);
app.use('/api/roleTest', roleTestRouter);
app.use('/api/accounts/:accountId/leagues', leaguesRouter);
app.use('/api/accounts/:accountId/seasons', seasonsRouter);
app.use('/api/accounts/:accountId/statistics', statisticsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/leagues', leagueSeasonsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/games', gamesRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamRosterRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamStatsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamMediaRouter);
app.use(
  '/api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/managers',
  teamManagersRouter,
);
app.use('/api/accounts/:accountId/seasons/:seasonId/standings', standingsRouter);
app.use('/api/accounts', accountsRouter);

// Global error handler
app.use(globalErrorHandler as express.ErrorRequestHandler);

// 404 handler
app.use('/{*splat}', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
