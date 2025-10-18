import { getSecureStorage } from './secureStorage';

type StoredCredentials = {
  userName: string;
  accountId: string | null;
};

const STORAGE_KEY = 'draco_mobile_last_credentials';

export async function saveLastCredentials(credentials: {
  userName: string;
  accountId: string | null;
}): Promise<void> {
  const storage = await getSecureStorage();
  const record: StoredCredentials = {
    userName: credentials.userName,
    accountId: credentials.accountId
  };

  await storage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function loadLastCredentials(): Promise<StoredCredentials | null> {
  const storage = await getSecureStorage();
  const raw = await storage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCredentials & { password?: unknown }>;
    if (typeof parsed.userName !== 'string') {
      await storage.deleteItem(STORAGE_KEY);
      return null;
    }

    const accountId = typeof parsed.accountId === 'string' ? parsed.accountId : null;

    // Rewrite any legacy payloads that included a password to immediately drop it.
    if (typeof parsed.password === 'string' || parsed.accountId !== accountId) { // pragma: allowlist secret
      await saveLastCredentials({ userName: parsed.userName, accountId });
    }

    return {
      userName: parsed.userName,
      accountId
    };
  } catch {
    await storage.deleteItem(STORAGE_KEY);
    return null;
  }
}

export async function clearLastCredentials(): Promise<void> {
  const storage = await getSecureStorage();
  await storage.deleteItem(STORAGE_KEY);
}

export type { StoredCredentials };
