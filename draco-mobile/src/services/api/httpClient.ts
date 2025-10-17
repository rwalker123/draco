import { API_BASE_URL } from '../../config/env';
import { logNetworkEvent } from './networkLogger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  retryOnStatuses?: number[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const trimmedPath = path.replace(/^\//, '');
  const url = new URL(trimmedPath, `${API_BASE_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
};

export async function requestJson<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = 'GET', token, body, query, headers, retries, retryDelayMs, retryOnStatuses } = options;
  const url = buildUrl(path, query);
  const maxAttempts = Math.max(1, retries ?? (method === 'GET' ? 3 : 2));
  const delayMs = retryDelayMs ?? 500;
  const retryStatuses = retryOnStatuses ?? [408, 425, 429, 500, 502, 503, 504];

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    const requestId = generateRequestId();
    const startedAt = Date.now();

    logNetworkEvent({
      id: requestId,
      phase: 'start',
      method,
      url,
      body,
      attempt
    });

    const requestInit: globalThis.RequestInit = {
      method,
      headers: {
        ...defaultHeaders,
        ...(headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    let response: Response;

    try {
      response = await fetch(url, requestInit);
    } catch (error) {
      lastError = error;
      logNetworkEvent({
        id: requestId,
        phase: 'error',
        method,
        url,
        durationMs: Date.now() - startedAt,
        error,
        attempt
      });

      if (attempt >= maxAttempts) {
        throw error;
      }

      await wait(delayMs * attempt);
      continue;
    }

    const durationMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.text();

    logNetworkEvent({
      id: requestId,
      phase: 'end',
      method,
      url,
      status: response.status,
      durationMs,
      body: payload,
      attempt
    });

    if (response.ok) {
      return payload as TResponse;
    }

    const shouldRetry = retryStatuses.includes(response.status) || response.status >= 500;
    if (attempt < maxAttempts && shouldRetry) {
      lastError = new ApiError(
        `Request to ${url} failed with status ${response.status}`,
        response.status,
        payload,
      );
      await wait(delayMs * attempt);
      continue;
    }

    throw new ApiError(`Request to ${url} failed with status ${response.status}`, response.status, payload);
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
