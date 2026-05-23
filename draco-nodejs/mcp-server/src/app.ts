import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { mountMcp } from './transport/streamableHttp.js';

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  mountMcp(app);

  return app;
}
