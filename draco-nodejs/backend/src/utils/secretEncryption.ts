import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY;

const algorithm = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('SECRET_ENCRYPTION_KEY environment variable is required for secret encryption');
  }

  return createHash('sha256').update(ENCRYPTION_KEY).digest().subarray(0, KEY_LENGTH);
}

export function encryptSecret(value: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivPart, tagPart, dataPart] = payload.split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = Buffer.from(ivPart, 'base64');
  const authTag = Buffer.from(tagPart, 'base64');
  const encryptedData = Buffer.from(dataPart, 'base64');
  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString('utf8');
}
