import type { AuthSession } from '../types/auth';

// Expo SecureStore requires keys to be alphanumeric plus dash/underscore.
const STORAGE_KEY = 'draco_mobile_auth_session';
const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export type StoredAuthSession = AuthSession & {
  storedAt: number;
  expiresAt: number;
};

const serialize = (session: StoredAuthSession): string => JSON.stringify(session);

const deserialize = (value: string): StoredAuthSession => JSON.parse(value) as StoredAuthSession;

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

type BrowserStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStore = new Map<string, string>();

let storagePromise: Promise<StorageAdapter> | null = null;

export async function saveSession(session: AuthSession): Promise<void> {
  const storage = await getStorage();
  const now = Date.now();
  const record: StoredAuthSession = {
    ...session,
    storedAt: now,
    expiresAt: now + THIRTY_DAYS_IN_MS
  };

  await storage.setItem(STORAGE_KEY, serialize(record));
}

export async function loadSession(): Promise<StoredAuthSession | null> {
  const storage = await getStorage();
  const rawValue = await storage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = deserialize(rawValue);
    if (parsed.expiresAt <= Date.now()) {
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
  const storage = await getStorage();
  await storage.deleteItem(STORAGE_KEY);
}

async function getStorage(): Promise<StorageAdapter> {
  if (!storagePromise) {
    storagePromise = resolveStorage();
  }

  return storagePromise;
}

async function resolveStorage(): Promise<StorageAdapter> {
  const secureStore = await loadSecureStoreModule();
  if (secureStore) {
    return createSecureStoreAdapter(secureStore);
  }

  return createFallbackAdapter();
}

async function loadSecureStoreModule(): Promise<typeof import('expo-secure-store') | null> {
  try {
    const module = await import('expo-secure-store');
    if (typeof module.isAvailableAsync !== 'function') {
      return null;
    }

    const available = await module.isAvailableAsync();
    return available ? module : null;
  } catch {
    return null;
  }
}

function createSecureStoreAdapter(module: typeof import('expo-secure-store')): StorageAdapter {
  return {
    getItem: (key) => module.getItemAsync(key),
    setItem: (key, value) => module.setItemAsync(key, value),
    deleteItem: (key) => module.deleteItemAsync(key)
  };
}

function createFallbackAdapter(): StorageAdapter {
  const browserStorage = getBrowserStorage();

  return {
    async getItem(key) {
      if (browserStorage) {
        try {
          const value = browserStorage.getItem(key);
          if (typeof value === 'string') {
            memoryStore.set(key, value);
            return value;
          }

          memoryStore.delete(key);
          return null;
        } catch {
          // Ignore browser storage failures and fall back to memory
        }
      }

      return memoryStore.get(key) ?? null;
    },
    async setItem(key, value) {
      if (browserStorage) {
        try {
          browserStorage.setItem(key, value);
          memoryStore.set(key, value);
          return;
        } catch {
          // Ignore browser storage failures and fall back to memory
        }
      }

      memoryStore.set(key, value);
    },
    async deleteItem(key) {
      if (browserStorage) {
        try {
          browserStorage.removeItem(key);
        } catch {
          // Ignore browser storage failures and fall back to memory
        }
      }

      memoryStore.delete(key);
    }
  };
}

function getBrowserStorage(): BrowserStorage | null {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    const maybeStorage = (globalThis as { localStorage?: BrowserStorage }).localStorage;
    if (!maybeStorage) {
      return null;
    }

    const { getItem, setItem, removeItem } = maybeStorage;
    if (typeof getItem === 'function' && typeof setItem === 'function' && typeof removeItem === 'function') {
      return maybeStorage;
    }
  } catch {
    // Access to localStorage can throw (for example, in private browsing modes)
  }

  return null;
}
