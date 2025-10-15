import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '../types/auth';

const STORAGE_KEY = 'draco/mobile/auth-session';
const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export type StoredAuthSession = AuthSession & {
  storedAt: number;
  expiresAt: number;
};

const serialize = (session: StoredAuthSession): string => JSON.stringify(session);

const deserialize = (value: string): StoredAuthSession => JSON.parse(value) as StoredAuthSession;

export async function saveSession(session: AuthSession): Promise<void> {
  const now = Date.now();
  const record: StoredAuthSession = {
    ...session,
    storedAt: now,
    expiresAt: now + THIRTY_DAYS_IN_MS
  };

  await SecureStore.setItemAsync(STORAGE_KEY, serialize(record));
}

export async function loadSession(): Promise<StoredAuthSession | null> {
  const rawValue = await SecureStore.getItemAsync(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = deserialize(rawValue);
    if (parsed.expiresAt <= Date.now()) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
