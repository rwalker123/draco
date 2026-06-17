import path from 'node:path';

/**
 * Resolves the absolute path to the uploads directory, honoring the optional
 * UPLOAD_PATH environment variable while defaulting to the local ./uploads folder.
 */
export const resolveUploadsRoot = (): string => {
  const envPath = process.env.UPLOAD_PATH?.trim();

  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  }

  return path.join(process.cwd(), 'uploads');
};
