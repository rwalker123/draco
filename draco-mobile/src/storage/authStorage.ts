import type { AuthSession } from '../types/auth';
import { getSecureStorage } from './secureStorage';

// Expo SecureStore requires keys to be alphanumeric plus dash/underscore.
const STORAGE_KEY = 'draco_mobile_auth_session';
const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export type StoredAuthSession = AuthSession & {
  storedAt: number;
  expiresAt: number;
};

const serialize = (session: StoredAuthSession): string => JSON.stringify(session);

const deserialize = (value: string): StoredAuthSession => JSON.parse(value) as StoredAuthSession;

export async function saveSession(session: AuthSession): Promise<void> {
  const storage = await getSecureStorage();
  const now = Date.now();
  const record: StoredAuthSession = {
    ...session,
    storedAt: now,
    expiresAt: now + THIRTY_DAYS_IN_MS
  };

  await storage.setItem(STORAGE_KEY, serialize(record));
}

export async function loadSession(): Promise<StoredAuthSession | null> {
  const storage = await getSecureStorage();
  const rawValue = await storage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = deserialize(rawValue);
    if (!parsed.accountId || parsed.expiresAt <= Date.now()) {
      await storage.deleteItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    await storage.deleteItem(STORAGE_KEY);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const storage = await getSecureStorage();
  await storage.deleteItem(STORAGE_KEY);
}
