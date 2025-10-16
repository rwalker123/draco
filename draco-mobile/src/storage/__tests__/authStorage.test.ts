import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type LocalStorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = 'draco_mobile_auth_session';

describe('authStorage', () => {
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

  it('persists sessions when SecureStore is unavailable', async () => {
    vi.mock('expo-secure-store', () => ({
      isAvailableAsync: vi.fn().mockResolvedValue(false)
    }), { virtual: true });

    const { saveSession, loadSession, clearSession } = await import('../authStorage');
    const session = {
      token: 'test-token',
      user: {
        userId: 42,
        userName: 'tester'
      }
    };

    await saveSession(session);
    expect(storageBacking.has(STORAGE_KEY)).toBe(true);

    const restored = await loadSession();
    expect(restored).not.toBeNull();
    expect(restored?.token).toBe('test-token');
    expect(restored?.user).toEqual(session.user);

    await clearSession();
    expect(storageBacking.has(STORAGE_KEY)).toBe(false);
  });

  it('removes invalid persisted session data', async () => {
    vi.mock('expo-secure-store', () => ({
      isAvailableAsync: vi.fn().mockResolvedValue(false)
    }), { virtual: true });

    storageBacking.set(STORAGE_KEY, 'not-json');

    const { loadSession } = await import('../authStorage');
    const restored = await loadSession();
    expect(restored).toBeNull();
    expect(storageBacking.has(STORAGE_KEY)).toBe(false);
  });
});
