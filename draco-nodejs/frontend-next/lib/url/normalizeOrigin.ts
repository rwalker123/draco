export const normalizeOrigin = (origin?: string | null): string | null => {
  if (!origin) {
    return null;
  }

  return origin.replace(/\/+$/, '');
};
