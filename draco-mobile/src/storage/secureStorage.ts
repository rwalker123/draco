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

export async function getSecureStorage(): Promise<StorageAdapter> {
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

export type { StorageAdapter };
