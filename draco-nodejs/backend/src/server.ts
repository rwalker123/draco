import { initializeRoleIds } from './config/roles';
import prisma from './lib/prisma.js';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https');

async function bootstrap() {
  // Initialize role IDs synchronously - this ensures they're loaded when we need them
  await initializeRoleIds(prisma).catch((error) => {
    console.error('❌ Failed to initialize role IDs in RouteProtection:', error);
  });

  // Now import and start the app
  const { default: app } = await import('./app.js'); // or wherever your Next.js app lives
  // Load environment variables
  dotenv.config();

  const PORT = process.env.PORT || 3001;

  if (process.env.NODE_ENV === 'development') {
    const options = {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem'),
    };
    https.createServer(options, app).listen(PORT, () => {
      const host = process.env.HOST || 'localhost';
      console.log(`HTTPS server running on https://${host}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: https://${host}:${PORT}/health`);
    });
  } else {
    const options = {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem'),
    };
    https.createServer(options, app).listen(PORT, () => {
      const host = process.env.HOST || 'localhost';
      console.log(`🚀 Draco Sports Manager API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: https://${host}:${PORT}/health`);
    });
  }
}

bootstrap();
