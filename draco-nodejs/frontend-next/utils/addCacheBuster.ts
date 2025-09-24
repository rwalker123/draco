const ABSOLUTE_URL_REGEX = /^([a-z][a-z0-9+.-]*:)?\/\//i;

export function addCacheBuster(url: string | null, timestamp: number = Date.now()): string | null {
  if (!url) {
    return null;
  }

  const cacheBuster = String(timestamp);

  // Preserve relative URLs to avoid Next.js image host restrictions
  if (!ABSOLUTE_URL_REGEX.test(url)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}k=${cacheBuster}`;
  }

  try {
    const resolved = new URL(url);
    resolved.searchParams.set('k', cacheBuster);
    return resolved.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}k=${cacheBuster}`;
  }
}
