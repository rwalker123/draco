type MinimalHeaders = { get(name: string): string | null } | null | undefined;

const normalizeOrigin = (origin?: string | null): string | null => {
  if (!origin) {
    return null;
  }

  return origin.replace(/\/+$/, '');
};

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
