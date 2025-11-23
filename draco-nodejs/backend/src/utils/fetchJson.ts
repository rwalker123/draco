export interface FetchJsonOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
    public readonly headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function fetchJson<T>(input: string | URL, options?: FetchJsonOptions): Promise<T> {
  const controller = new AbortController();
  const timeout =
    options?.timeoutMs != null
      ? setTimeout(() => controller.abort(), options.timeoutMs)
      : undefined;

  try {
    const response = await fetch(input, {
      method: options?.method ?? 'GET',
      headers: options?.headers,
      body: options?.body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      throw new HttpError(
        `Request to ${typeof input === 'string' ? input : input.toString()} failed with status ${
          response.status
        }: ${message}`,
        response.status,
        message,
        headers,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
