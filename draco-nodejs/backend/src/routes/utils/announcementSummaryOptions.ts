import type { Request } from 'express';

const MAX_SUMMARY_LIMIT = 25;
const DEFAULT_SUMMARY_LIMIT = 10;

export interface AnnouncementSummaryOptions {
  limit: number;
  includeSpecialOnly: boolean;
}

export const parseAnnouncementSummaryOptions = (
  query: Request['query'],
): AnnouncementSummaryOptions => {
  const limitValue = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const includeSpecialOnlyValue = Array.isArray(query.includeSpecialOnly)
    ? query.includeSpecialOnly[0]
    : query.includeSpecialOnly;

  let limit: number | undefined;
  if (typeof limitValue === 'string' && limitValue.trim().length > 0) {
    const parsed = Number.parseInt(limitValue, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_SUMMARY_LIMIT);
    }
  }

  const includeSpecialOnly = includeSpecialOnlyValue === 'true';

  return { limit: limit ?? DEFAULT_SUMMARY_LIMIT, includeSpecialOnly };
};
