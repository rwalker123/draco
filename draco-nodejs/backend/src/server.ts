import './config/loadEnv.js';
import { initializeRoleIds } from './config/roles.js';
import prisma from './lib/prisma.js';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { ServiceFactory } from './services/serviceFactory.js';

async function bootstrap() {
  // Initialize role IDs synchronously - this ensures they're loaded when we need them
  await initializeRoleIds(prisma).catch((error) => {
    console.error('❌ Failed to initialize role IDs in RouteProtection:', error);
  });

  // Clean up any stale live scoring sessions from previous server runs
  const liveScoringService = ServiceFactory.getLiveScoringService();
  await liveScoringService.cleanupStaleSessions().catch((error) => {
    console.error('⚠️ Failed to clean up stale live scoring sessions:', error);
  });

  // Now import and start the app
  const { default: app } = await import('./app.js'); // or wherever your Next.js app lives

  const PORT = process.env.PORT || 3001;

  const keyPath = './certs/key.pem';
  const certPath = './certs/cert.pem';
  const certFilesPresent = fs.existsSync(keyPath) && fs.existsSync(certPath);

  if (certFilesPresent) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(options, app).listen(PORT, () => {
      const host = process.env.HOST || 'localhost';
      const protocol = 'https';
      console.log(`🔒 ${protocol.toUpperCase()} server running on ${protocol}://${host}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: ${protocol}://${host}:${PORT}/health`);
    });
  } else {
    http.createServer(app).listen(PORT, () => {
      const host = process.env.HOST || 'localhost';
      const protocol = 'http';
      console.log(`🚀 ${protocol.toUpperCase()} server running on ${protocol}://${host}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: ${protocol}://${host}:${PORT}/health`);
    });
  }
}

bootstrap();
