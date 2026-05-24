export interface BuildPlayerStatisticsHrefOptions {
  accountId: string;
  contactId: string | number | null | undefined;
  returnTo?: string | null;
  returnLabel?: string | null;
}

export const buildPlayerStatisticsHref = ({
  accountId,
  contactId,
  returnTo,
  returnLabel,
}: BuildPlayerStatisticsHrefOptions): string | null => {
  if (!accountId) {
    return null;
  }

  if (contactId === null || contactId === undefined) {
    return null;
  }

  const identifier = typeof contactId === 'number' ? String(contactId) : String(contactId).trim();

  if (!identifier) {
    return null;
  }

  const basePath = `/account/${accountId}/players/${identifier}/statistics`;
  const query = new URLSearchParams();

  if (returnTo) {
    query.set('returnTo', returnTo);
    const label = returnLabel?.trim() ?? '';
    if (label.length > 0) {
      query.set('returnLabel', label);
    }
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `${basePath}?${queryString}` : basePath;
};
