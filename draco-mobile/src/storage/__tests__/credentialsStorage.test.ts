import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type LocalStorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = 'draco_mobile_last_credentials';

describe('credentialsStorage', () => {
  const storageBacking = new Map<string, string>();

  const installLocalStorage = () => {
    const stub: LocalStorageStub = {
      getItem: (key) => storageBacking.get(key) ?? null,
      setItem: (key, value) => {
        storageBacking.set(key, value);
      },
      removeItem: (key) => {
        storageBacking.delete(key);
      },
      clear: () => {
        storageBacking.clear();
      }
    };

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: stub as unknown
    });
  };

  beforeEach(() => {
    storageBacking.clear();
    installLocalStorage();
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    vi.clearAllMocks();
    vi.resetModules();
    vi.unmock('expo-secure-store');
  });

  it('persists credentials when SecureStore is unavailable', async () => {
    vi.mock('expo-secure-store', () => ({
      isAvailableAsync: vi.fn().mockResolvedValue(false)
    }));

    const { saveLastCredentials, loadLastCredentials, clearLastCredentials } = await import('../credentialsStorage');

    await saveLastCredentials({
      userName: 'test@example.com',
      accountId: '42'
    });

    expect(storageBacking.has(STORAGE_KEY)).toBe(true);
    expect(JSON.parse(storageBacking.get(STORAGE_KEY) ?? '{}')).toEqual({
      userName: 'test@example.com',
      accountId: '42'
    });

    const restored = await loadLastCredentials();
    expect(restored).toEqual({
      userName: 'test@example.com',
      accountId: '42'
    });

    await clearLastCredentials();
    expect(storageBacking.has(STORAGE_KEY)).toBe(false);
  });

  it('removes invalid credential payloads', async () => {
    vi.mock('expo-secure-store', () => ({
      isAvailableAsync: vi.fn().mockResolvedValue(false)
    }));

    storageBacking.set(STORAGE_KEY, 'not-json');

    const { loadLastCredentials } = await import('../credentialsStorage');
    const restored = await loadLastCredentials();
    expect(restored).toBeNull();
    expect(storageBacking.has(STORAGE_KEY)).toBe(false);
  });

  it('sanitizes legacy payloads that contain a password', async () => {
    vi.mock('expo-secure-store', () => ({
      isAvailableAsync: vi.fn().mockResolvedValue(false)
    }));

    storageBacking.set(STORAGE_KEY, JSON.stringify({
      userName: 'legacy@example.com',
      password: 'legacy-placeholder', // pragma: allowlist secret
      accountId: '7'
    }));

    const { loadLastCredentials } = await import('../credentialsStorage');
    const restored = await loadLastCredentials();
    expect(restored).toEqual({
      userName: 'legacy@example.com',
      accountId: '7'
    });

    expect(JSON.parse(storageBacking.get(STORAGE_KEY) ?? '{}')).toEqual({
      userName: 'legacy@example.com',
      accountId: '7'
    });
  });
});
