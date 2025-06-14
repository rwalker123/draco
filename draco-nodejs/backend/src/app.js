"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes (will be created later)
// import { authRouter } from './routes/auth';
// import { accountsRouter } from './routes/accounts';
// import { teamsRouter } from './routes/teams';
// import { playersRouter } from './routes/players';
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
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
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json(Object.assign({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }, (process.env.NODE_ENV !== 'production' && { stack: err.stack })));
});
exports.default = app;
