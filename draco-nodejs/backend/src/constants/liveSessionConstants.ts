export const LIVE_SESSION_STATUS = {
  ACTIVE: 1,
  PAUSED: 2,
  FINALIZED: 3,
  STOPPED: 4,
  ABANDONED: 5,
} as const;

export type LiveSessionStatusValue = (typeof LIVE_SESSION_STATUS)[keyof typeof LIVE_SESSION_STATUS];

export const LIVE_SESSION_STATUS_MAP: Record<
  number,
  'active' | 'paused' | 'finalized' | 'stopped'
> = {
  [LIVE_SESSION_STATUS.ACTIVE]: 'active',
  [LIVE_SESSION_STATUS.PAUSED]: 'paused',
  [LIVE_SESSION_STATUS.FINALIZED]: 'finalized',
  [LIVE_SESSION_STATUS.STOPPED]: 'stopped',
};
