import express, { type RequestHandler } from 'express';
import { resolveUploadsRoot } from '../utils/uploadsPath.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { contentTypeForKey } from '../utils/mimeTypes.js';

export const createUploadsHandler = (): RequestHandler => {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  if (provider === 'local') {
    return express.static(resolveUploadsRoot());
  }

  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
    if (!key || key.includes('..')) {
      res.status(400).end();
      return;
    }

    ServiceFactory.getStorageService()
      .getObject(key)
      .then((buffer) => {
        if (!buffer) {
          res.status(404).end();
          return;
        }

        res.setHeader('Content-Type', contentTypeForKey(key));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(buffer);
      })
      .catch(next);
  };
};
