"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { initializeRoleIds } = require('./config/roles');
dotenv.config();
const prisma = new PrismaClient();
initializeRoleIds(prisma).catch((error) => {
    console.error('Failed to initialize role IDs:', error);
});
const testdatabase_1 = require("./routes/testdatabase");
const auth_1 = require("./routes/auth");
const passwordReset_1 = require("./routes/passwordReset");
const roleTest_1 = require("./routes/roleTest");
const accounts_1 = require("./routes/accounts");
const seasons_1 = require("./routes/seasons");
const bigint_serializer_1 = require("./middleware/bigint-serializer");
const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bigint_serializer_1.bigIntSerializer);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use('/api/testdatabase', testdatabase_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/passwordReset', passwordReset_1.default);
app.use('/api/roleTest', roleTest_1.default);
app.use('/api/accounts/:accountId/seasons', seasons_1.default);
app.use('/api/accounts', accounts_1.default);
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map