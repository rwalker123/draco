import { describe, expect, it, beforeEach, afterEach, beforeAll, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'https://example.com'
      }
    }
  }
}));

let requestJson: typeof import('../httpClient').requestJson;
let ApiError: typeof import('../httpClient').ApiError;

describe('requestJson', () => {
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    const module = await import('../httpClient');
    requestJson = module.requestJson;
    ApiError = module.ApiError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('retries on network failures before succeeding', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }),
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await requestJson<{ success: boolean }>('/test', {
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on retryable status codes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'temporary failure' }), {
          status: 503,
          headers: { 'content-type': 'application/json' }
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }),
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await requestJson<{ data: string }>('/test', {
      retries: 3,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ data: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws ApiError after exhausting retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'server down' }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }),
    );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      requestJson('/test', {
        retries: 2,
        retryDelayMs: 0,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
