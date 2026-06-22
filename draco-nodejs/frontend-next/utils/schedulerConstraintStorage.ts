import type { SchedulerSeasonSolveRequest } from '@draco/shared-schemas';

export type SchedulerSoftConstraintKey =
  | 'avoidBackToBackGames'
  | 'spreadGamesAcrossDays'
  | 'balanceEarlyVsLate';

export interface SchedulerConstraintConfig {
  softOrder: SchedulerSoftConstraintKey[];
  avoidBackToBackGames: { enabled: boolean; minRestMinutes: number };
  spreadGamesAcrossDays: { enabled: boolean };
  balanceEarlyVsLate: { enabled: boolean };
  maxGamesPerTeamPerDay: { enabled: boolean; value: number };
  requireLightsAfter: { enabled: boolean; startHourLocal: number };
}

export const DEFAULT_CONSTRAINT_CONFIG: SchedulerConstraintConfig = {
  softOrder: ['avoidBackToBackGames', 'spreadGamesAcrossDays', 'balanceEarlyVsLate'],
  avoidBackToBackGames: { enabled: false, minRestMinutes: 2880 },
  spreadGamesAcrossDays: { enabled: false },
  balanceEarlyVsLate: { enabled: false },
  maxGamesPerTeamPerDay: { enabled: false, value: 1 },
  requireLightsAfter: { enabled: false, startHourLocal: 18 },
};

const SOFT_KEYS: SchedulerSoftConstraintKey[] = [
  'avoidBackToBackGames',
  'spreadGamesAcrossDays',
  'balanceEarlyVsLate',
];

const normalizeSoftOrder = (order: unknown): SchedulerSoftConstraintKey[] => {
  const provided = Array.isArray(order)
    ? order.filter((key): key is SchedulerSoftConstraintKey =>
        SOFT_KEYS.includes(key as SchedulerSoftConstraintKey),
      )
    : [];
  const deduped = Array.from(new Set(provided));
  for (const key of SOFT_KEYS) {
    if (!deduped.includes(key)) {
      deduped.push(key);
    }
  }
  return deduped;
};

const buildConstraintStorageKey = (accountId: string, seasonId: string): string =>
  `scheduler:constraintConfig:${accountId}:${seasonId}`;

const clampInt = (value: number, min: number, max?: number): number => {
  const floored = Math.max(min, Math.floor(value));
  return max === undefined ? floored : Math.min(max, floored);
};

export const cloneDefaultConfig = (): SchedulerConstraintConfig => ({
  softOrder: [...DEFAULT_CONSTRAINT_CONFIG.softOrder],
  avoidBackToBackGames: { ...DEFAULT_CONSTRAINT_CONFIG.avoidBackToBackGames },
  spreadGamesAcrossDays: { ...DEFAULT_CONSTRAINT_CONFIG.spreadGamesAcrossDays },
  balanceEarlyVsLate: { ...DEFAULT_CONSTRAINT_CONFIG.balanceEarlyVsLate },
  maxGamesPerTeamPerDay: { ...DEFAULT_CONSTRAINT_CONFIG.maxGamesPerTeamPerDay },
  requireLightsAfter: { ...DEFAULT_CONSTRAINT_CONFIG.requireLightsAfter },
});

export const loadConstraintConfig = (
  accountId: string,
  seasonId: string,
): SchedulerConstraintConfig => {
  if (typeof window === 'undefined') return cloneDefaultConfig();
  try {
    const raw = window.localStorage.getItem(buildConstraintStorageKey(accountId, seasonId));
    if (!raw) return cloneDefaultConfig();
    const parsed = JSON.parse(raw) as Partial<SchedulerConstraintConfig>;
    return {
      softOrder: normalizeSoftOrder(parsed.softOrder),
      avoidBackToBackGames: {
        enabled: parsed.avoidBackToBackGames?.enabled === true,
        minRestMinutes:
          typeof parsed.avoidBackToBackGames?.minRestMinutes === 'number' &&
          Number.isFinite(parsed.avoidBackToBackGames.minRestMinutes)
            ? clampInt(parsed.avoidBackToBackGames.minRestMinutes, 0)
            : DEFAULT_CONSTRAINT_CONFIG.avoidBackToBackGames.minRestMinutes,
      },
      spreadGamesAcrossDays: { enabled: parsed.spreadGamesAcrossDays?.enabled === true },
      balanceEarlyVsLate: { enabled: parsed.balanceEarlyVsLate?.enabled === true },
      maxGamesPerTeamPerDay: {
        enabled: parsed.maxGamesPerTeamPerDay?.enabled === true,
        value:
          typeof parsed.maxGamesPerTeamPerDay?.value === 'number' &&
          Number.isFinite(parsed.maxGamesPerTeamPerDay.value)
            ? clampInt(parsed.maxGamesPerTeamPerDay.value, 1)
            : DEFAULT_CONSTRAINT_CONFIG.maxGamesPerTeamPerDay.value,
      },
      requireLightsAfter: {
        enabled: parsed.requireLightsAfter?.enabled === true,
        startHourLocal:
          typeof parsed.requireLightsAfter?.startHourLocal === 'number' &&
          Number.isFinite(parsed.requireLightsAfter.startHourLocal)
            ? clampInt(parsed.requireLightsAfter.startHourLocal, 0, 23)
            : DEFAULT_CONSTRAINT_CONFIG.requireLightsAfter.startHourLocal,
      },
    };
  } catch {
    return cloneDefaultConfig();
  }
};

export const saveConstraintConfig = (
  accountId: string,
  seasonId: string,
  config: SchedulerConstraintConfig,
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      buildConstraintStorageKey(accountId, seasonId),
      JSON.stringify(config),
    );
  } catch {}
};

export const buildSolveConstraints = (
  config: SchedulerConstraintConfig,
  maxGamesPerUmpirePerDay?: number,
): SchedulerSeasonSolveRequest['constraints'] => {
  const soft: NonNullable<NonNullable<SchedulerSeasonSolveRequest['constraints']>['soft']> = {};
  config.softOrder.forEach((key, index) => {
    const weight = config.softOrder.length - index;
    if (key === 'avoidBackToBackGames' && config.avoidBackToBackGames.enabled) {
      soft.avoidBackToBackGames = {
        enabled: true,
        minRestMinutes: config.avoidBackToBackGames.minRestMinutes,
        weight,
      };
    } else if (key === 'spreadGamesAcrossDays' && config.spreadGamesAcrossDays.enabled) {
      soft.spreadGamesAcrossDays = { enabled: true, weight };
    } else if (key === 'balanceEarlyVsLate' && config.balanceEarlyVsLate.enabled) {
      soft.balanceEarlyVsLate = { enabled: true, weight };
    }
  });

  const hard: NonNullable<NonNullable<SchedulerSeasonSolveRequest['constraints']>['hard']> = {};
  if (maxGamesPerUmpirePerDay !== undefined) {
    hard.maxGamesPerUmpirePerDay = Math.floor(maxGamesPerUmpirePerDay);
  }
  if (config.maxGamesPerTeamPerDay.enabled) {
    hard.maxGamesPerTeamPerDay = Math.floor(config.maxGamesPerTeamPerDay.value);
  }
  if (config.requireLightsAfter.enabled) {
    hard.requireLightsAfter = {
      enabled: true,
      startHourLocal: config.requireLightsAfter.startHourLocal,
    };
  }

  const hasSoft = Object.keys(soft).length > 0;
  const hasHard = Object.keys(hard).length > 0;
  if (!hasSoft && !hasHard) {
    return undefined;
  }

  return {
    ...(hasHard ? { hard } : {}),
    ...(hasSoft ? { soft } : {}),
  };
};
