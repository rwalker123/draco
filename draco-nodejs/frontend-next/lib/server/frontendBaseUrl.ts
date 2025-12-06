import { normalizeOrigin } from '../url/normalizeOrigin';

type MinimalHeaders = { get(name: string): string | null } | null | undefined;

export const getServerFrontendBaseUrl = (incomingHeaders?: MinimalHeaders): string | null => {
  if (!incomingHeaders) {
    return null;
  }

  const host = incomingHeaders.get('x-forwarded-host') ?? incomingHeaders.get('host');
  const proto = incomingHeaders.get('x-forwarded-proto') ?? 'https';

  if (!host) {
    return null;
  }

  return normalizeOrigin(`${proto}://${host}`);
};
