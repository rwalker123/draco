export interface FetchJsonOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
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
      throw new Error(
        `Request to ${typeof input === 'string' ? input : input.toString()} failed with status ${
          response.status
        }: ${message}`,
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
