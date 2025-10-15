import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { clearSession, loadSession, saveSession } from '../authStorage';
import type { AuthSession } from '../../../types/auth';

const sampleSession: AuthSession = {
  token: 'test-token',
  user: {
    userId: 'user-1',
    userName: 'scorekeeper'
  }
};

describe('authStorage', () => {
  let nowSpy: MockInstance<[], number>;

  beforeEach(async () => {
    await clearSession();
    vi.useRealTimers();
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(async () => {
    nowSpy.mockRestore();
    vi.useRealTimers();
    await clearSession();
  });

  it('persists and reads a session', async () => {
    await saveSession(sampleSession);
    const result = await loadSession();
    expect(result?.token).toBe(sampleSession.token);
    expect(result?.user).toEqual(sampleSession.user);
  });

  it('expires sessions after thirty days', async () => {
    await saveSession(sampleSession);
    nowSpy.mockReturnValue(1_000 + 1000 * 60 * 60 * 24 * 31);

    const result = await loadSession();
    expect(result).toBeNull();
  });
});
