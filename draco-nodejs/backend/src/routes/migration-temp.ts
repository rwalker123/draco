/**
 * TEMPORARY MIGRATION ENDPOINT
 * Delete this file after migrating uploads to R2
 */
import { Router, Request, Response } from 'express';
import archiver from 'archiver';
import { resolveUploadsRoot } from '../utils/uploadsPath.js';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /api/migration/download-uploads
 * Downloads all uploads as a zip file
 * Protected by a secret token to prevent unauthorized access
 */
router.get('/download-uploads', async (req: Request, res: Response): Promise<void> => {
  const secretToken = req.query.token;
  const expectedToken = process.env.MIGRATION_SECRET_TOKEN;

  if (!expectedToken || secretToken !== expectedToken) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const uploadsDir = resolveUploadsRoot();

  if (!fs.existsSync(uploadsDir)) {
    res.status(404).json({ error: 'Uploads directory not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=uploads.zip');

  const archive = archiver('zip', { zlib: { level: 5 } });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).json({ error: 'Failed to create archive' });
  });

  archive.pipe(res);
  archive.directory(uploadsDir, false);
  archive.finalize();
});

/**
 * GET /api/migration/list-uploads
 * Lists all files in the uploads directory (for verification)
 */
router.get('/list-uploads', async (req: Request, res: Response): Promise<void> => {
  const secretToken = req.query.token;
  const expectedToken = process.env.MIGRATION_SECRET_TOKEN;

  if (!expectedToken || secretToken !== expectedToken) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const uploadsDir = resolveUploadsRoot();

  if (!fs.existsSync(uploadsDir)) {
    res.status(404).json({ error: 'Uploads directory not found', path: uploadsDir });
    return;
  }

  const getAllFiles = (dir: string, baseDir: string = dir): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else {
        files.push(path.relative(baseDir, fullPath));
      }
    }
    return files;
  };

  const files = getAllFiles(uploadsDir);
  res.json({
    uploadsPath: uploadsDir,
    fileCount: files.length,
    files: files,
  });
});

export default router;
