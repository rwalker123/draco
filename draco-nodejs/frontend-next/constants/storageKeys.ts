export const ACCOUNT_STORAGE_KEY = 'draco:selected-account';
export const REMEMBER_ME_KEY = 'draco:rememberMe';

export const STAT_COLUMN_ORDER_KEY_PREFIX = 'draco:stat-column-order';

export const statColumnOrderKey = (variant: 'batting' | 'pitching'): string =>
  `${STAT_COLUMN_ORDER_KEY_PREFIX}:${variant}`;
