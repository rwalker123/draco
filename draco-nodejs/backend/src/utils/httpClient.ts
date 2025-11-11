import https from 'node:https';
import { URL } from 'node:url';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export async function httpsJsonRequest<T>(
  input: string | URL,
  options?: HttpRequestOptions,
): Promise<T> {
  const url = typeof input === 'string' ? new URL(input) : input;

  const requestOptions: https.RequestOptions = {
    method: options?.method ?? 'GET',
    headers: options?.headers,
  };

  return await new Promise<T>((resolve, reject) => {
    const req = https.request(url, requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        const status = res.statusCode ?? 0;

        if (status >= 400) {
          reject(
            new Error(
              `Request to ${url.toString()} failed with status ${status}: ${body || res.statusMessage}`,
            ),
          );
          return;
        }

        if (!body) {
          resolve({} as T);
          return;
        }

        try {
          resolve(JSON.parse(body) as T);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Unknown parse error';
          reject(
            new Error(
              `Failed to parse JSON response from ${url.toString()}: ${reason}. Payload: ${body}`,
            ),
          );
        }
      });
    });

    req.on('error', reject);

    if (options?.timeoutMs) {
      req.setTimeout(options.timeoutMs, () => {
        req.destroy(
          new Error(`Request to ${url.toString()} timed out after ${options.timeoutMs}ms`),
        );
      });
    }

    if (options?.body) {
      req.write(options.body);
    }

    req.end();
  });
}
