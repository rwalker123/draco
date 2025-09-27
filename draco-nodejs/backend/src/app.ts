import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { bigIntSerializer } from './middleware/bigint-serializer.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/openapi.js';
import { globalErrorHandler } from './utils/globalErrorHandler.js';
import { queryLoggerMiddleware, databaseHealthCheck } from './middleware/queryLogger.js';
import { DateUtils } from './utils/dateUtils.js';

import testDatabaseRouter from './routes/testdatabase.js';
import authRouter from './routes/auth.js';
import passwordResetRouter from './routes/passwordReset.js';
import accountsRouter from './routes/accounts.js';
import seasonsRouter from './routes/seasons.js';
import leagueSeasonsRouter from './routes/leagueSeasons.js';
import leaguesRouter from './routes/leagues.js';
import teamsRouter from './routes/teams.js';
import teamRosterRouter from './routes/team-roster.js';
import teamStatsRouter from './routes/team-stats.js';
import teamMediaRouter from './routes/team-media.js';
import teamSponsorsRouter from './routes/team-sponsors.js';
import gamesRouter from './routes/games.js';
import teamManagersRouter from './routes/teamManagers.js';
import seasonManagersRouter from './routes/seasonManagers.js';
import statisticsRouter from './routes/statistics.js';
import standingsRouter from './routes/standings.js';
import monitoringRouter from './routes/monitoring.js';
import { domainRouting } from './middleware/domainRouting.js';
import emailsRouter from './routes/emails.js';
import webhookRouter from './routes/webhookRoutes.js';
import cleanupRouter from './routes/cleanup.js';
import rolesRouter from './routes/roles.js';

// Load environment variables
dotenv.config();

// Start cleanup service
import { ServiceFactory } from './services/serviceFactory.js';
const cleanupService = ServiceFactory.getCleanupService();
cleanupService.start();

const app = express();

// Configure Express proxy trust based on environment
// Development: Trust 1 proxy (Next.js dev server)
// Production: Only trust if TRUST_PROXY env var is set
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  app.set('trust proxy', 1); // Trust Next.js dev server proxy
} else if (process.env.TRUST_PROXY) {
  // Production: only trust if explicitly configured
  const trustProxyValue = process.env.TRUST_PROXY;
  if (trustProxyValue === 'true') {
    app.set('trust proxy', true);
  } else if (!isNaN(Number(trustProxyValue))) {
    app.set('trust proxy', Number(trustProxyValue));
  } else {
    app.set('trust proxy', trustProxyValue);
  }
}

// Security middleware
app.use(helmet());

// Compression middleware
app.use(
  compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Minimum size to compress (1KB)
    filter: (req, res) => {
      // Skip compression for binary files
      const contentType = req.headers['content-type'];
      if (
        contentType &&
        (contentType.includes('image/') ||
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/zip') ||
          contentType.includes('application/gzip'))
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
    windowBits: 16, // Window size for gzip
    memLevel: 8, // Memory usage level
  }),
);

// CORS configuration - skip in test environment
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL environment variable is required but not set');
  }
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    }),
  );
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global BigInt serialization middleware
app.use(bigIntSerializer);

// Domain routing middleware - must come before other routes
app.use(domainRouting);

// Query logging and performance monitoring middleware
app.use(queryLoggerMiddleware);
app.use(databaseHealthCheck);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check endpoint with enhanced monitoring
app.get('/health', (req: express.Request, res: express.Response) => {
  const baseResponse = {
    status: 'OK',
    timestamp: DateUtils.formatDateTimeForResponse(new Date()),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  };

  // Include database health if available
  if (req.databaseHealth) {
    res.status(req.databaseHealth.status === 'connected' ? 200 : 503).json({
      ...baseResponse,
      database: req.databaseHealth,
    });
  } else {
    res.status(200).json(baseResponse);
  }
});

// Swagger API Documentation
app.use('/apidocs', swaggerUi.serve);
app.get('/apidocs', swaggerUi.setup(specs));

// API routes (will be added later)
app.use('/api/testdatabase', testDatabaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/passwordReset', passwordResetRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/cleanup', cleanupRouter);
app.use('/api/accounts/:accountId/leagues', leaguesRouter);
app.use('/api/accounts/:accountId/seasons', seasonsRouter);
app.use('/api/accounts/:accountId/statistics', statisticsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/leagues', leagueSeasonsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/games', gamesRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamRosterRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamStatsRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamMediaRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/teams', teamSponsorsRouter);
app.use(
  '/api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/managers',
  teamManagersRouter,
);
app.use('/api/accounts/:accountId/seasons/:seasonId/managers', seasonManagersRouter);
app.use('/api/accounts/:accountId/seasons/:seasonId/standings', standingsRouter);
app.use('/api', emailsRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/roles', rolesRouter);
// Global error handler
app.use(globalErrorHandler as express.ErrorRequestHandler);

// 404 handler
app.use('/{*splat}', (_req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      statusCode: 404,
      isRetryable: false,
      isOperational: true,
      message: 'Route not found',
    },
  });
});

export default app;
