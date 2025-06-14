const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes (will be created later)
// import { authRouter } from './routes/auth';
// import { accountsRouter } from './routes/accounts';
// import { teamsRouter } from './routes/teams';
// import { playersRouter } from './routes/players';
import testDatabaseRouter from './routes/testdatabase';
import { bigIntSerializer } from './middleware/bigint-serializer';

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
app.use(express.urlencoded({ extended: true }));

// Global BigInt serialization middleware
app.use(bigIntSerializer);

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

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app; 