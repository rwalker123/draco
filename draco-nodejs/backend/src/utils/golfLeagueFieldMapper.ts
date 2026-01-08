import {
  UpdateGolfLeagueSetupType,
  AbsentPlayerModeType,
  FullTeamAbsentModeType,
} from '@draco/shared-schemas';
import { DateUtils } from './dateUtils.js';
import { AbsentPlayerMode, FullTeamAbsentMode } from './golfConstants.js';
import { ValidationError } from './customErrors.js';

type FieldMapping<T> = {
  camelCase: keyof T;
  snakeCase: string;
  transform?: (value: unknown) => unknown;
};

const toBigIntOrNull = (value: unknown): bigint | null => (value ? BigInt(value as string) : null);

const toAbsentPlayerModeInt = (value: unknown): number => {
  const modes: Record<AbsentPlayerModeType, number> = {
    opponentWins: AbsentPlayerMode.OPPONENT_WINS,
    handicapPenalty: AbsentPlayerMode.HANDICAP_PENALTY,
    skipPairing: AbsentPlayerMode.SKIP_PAIRING,
  };
  return modes[value as AbsentPlayerModeType] ?? AbsentPlayerMode.OPPONENT_WINS;
};

const toFullTeamAbsentModeInt = (value: unknown): number => {
  const modes: Record<FullTeamAbsentModeType, number> = {
    forfeit: FullTeamAbsentMode.FORFEIT,
    handicapPenalty: FullTeamAbsentMode.HANDICAP_PENALTY,
  };
  return modes[value as FullTeamAbsentModeType] ?? FullTeamAbsentMode.FORFEIT;
};

const GOLF_LEAGUE_FIELD_MAPPINGS: FieldMapping<UpdateGolfLeagueSetupType>[] = [
  { camelCase: 'leagueDay', snakeCase: 'leagueday' },
  {
    camelCase: 'firstTeeTime',
    snakeCase: 'firstteetime',
    transform: (v) => DateUtils.parseTimeToUtcEpochDate(v as string),
  },
  { camelCase: 'timeBetweenTeeTimes', snakeCase: 'timebetweenteetimes' },
  { camelCase: 'holesPerMatch', snakeCase: 'holespermatch' },
  { camelCase: 'teeOffFormat', snakeCase: 'teeoffformat' },
  { camelCase: 'presidentId', snakeCase: 'presidentid', transform: toBigIntOrNull },
  { camelCase: 'vicePresidentId', snakeCase: 'vicepresidentid', transform: toBigIntOrNull },
  { camelCase: 'secretaryId', snakeCase: 'secretaryid', transform: toBigIntOrNull },
  { camelCase: 'treasurerId', snakeCase: 'treasurerid', transform: toBigIntOrNull },
  { camelCase: 'scoringType', snakeCase: 'scoringtype' },
  { camelCase: 'useBestBall', snakeCase: 'usebestball' },
  { camelCase: 'useHandicapScoring', snakeCase: 'usehandicapscoring' },
  { camelCase: 'perHolePoints', snakeCase: 'perholepoints' },
  { camelCase: 'perNinePoints', snakeCase: 'perninepoints' },
  { camelCase: 'perMatchPoints', snakeCase: 'permatchpoints' },
  { camelCase: 'totalHolesPoints', snakeCase: 'totalholespoints' },
  { camelCase: 'againstFieldPoints', snakeCase: 'againstfieldpoints' },
  { camelCase: 'againstFieldDescPoints', snakeCase: 'againstfielddescpoints' },
  {
    camelCase: 'absentPlayerMode',
    snakeCase: 'absentplayermode',
    transform: toAbsentPlayerModeInt,
  },
  { camelCase: 'absentPlayerPenalty', snakeCase: 'absentplayerpenalty' },
  {
    camelCase: 'fullTeamAbsentMode',
    snakeCase: 'fullteamabsentmode',
    transform: toFullTeamAbsentModeInt,
  },
];

export function validateAbsentPlayerPenalty(data: UpdateGolfLeagueSetupType): void {
  if (data.absentPlayerPenalty && data.absentPlayerPenalty > 0) {
    const effectiveMode = data.absentPlayerMode ?? 'opponentWins';
    if (effectiveMode !== 'handicapPenalty') {
      throw new ValidationError(
        'absentPlayerPenalty can only be set when absentPlayerMode is handicapPenalty',
      );
    }
  }
}

export function mapGolfLeagueFieldsForUpdate(
  data: UpdateGolfLeagueSetupType,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of GOLF_LEAGUE_FIELD_MAPPINGS) {
    const value = data[mapping.camelCase];
    if (value !== undefined) {
      result[mapping.snakeCase] = mapping.transform ? mapping.transform(value) : value;
    }
  }

  return result;
}

type DefaultValues = {
  leagueDay: number;
  firstTeeTime: Date;
  timeBetweenTeeTimes: number;
  holesPerMatch: number;
  teeOffFormat: number;
  scoringType: string;
  useBestBall: boolean;
  useHandicapScoring: boolean;
  perHolePoints: number;
  perNinePoints: number;
  perMatchPoints: number;
  totalHolesPoints: number;
  againstFieldPoints: number;
  againstFieldDescPoints: number;
  absentPlayerMode: number;
  absentPlayerPenalty: number;
  fullTeamAbsentMode: number;
};

const DEFAULTS: DefaultValues = {
  leagueDay: 2,
  firstTeeTime: new Date(Date.UTC(1970, 0, 1, 8, 0, 0)),
  timeBetweenTeeTimes: 10,
  holesPerMatch: 9,
  teeOffFormat: 0,
  scoringType: 'team',
  useBestBall: false,
  useHandicapScoring: true,
  perHolePoints: 0,
  perNinePoints: 0,
  perMatchPoints: 0,
  totalHolesPoints: 0,
  againstFieldPoints: 0,
  againstFieldDescPoints: 0,
  absentPlayerMode: AbsentPlayerMode.OPPONENT_WINS,
  absentPlayerPenalty: 0,
  fullTeamAbsentMode: FullTeamAbsentMode.FORFEIT,
};

export function mapGolfLeagueFieldsForCreate(
  accountId: bigint,
  leagueSeasonId: bigint,
  data: UpdateGolfLeagueSetupType,
): Record<string, unknown> {
  return {
    accountid: accountId,
    leagueseasonid: leagueSeasonId,
    leagueday: data.leagueDay ?? DEFAULTS.leagueDay,
    firstteetime: data.firstTeeTime
      ? DateUtils.parseTimeToUtcEpochDate(data.firstTeeTime)
      : DEFAULTS.firstTeeTime,
    timebetweenteetimes: data.timeBetweenTeeTimes ?? DEFAULTS.timeBetweenTeeTimes,
    holespermatch: data.holesPerMatch ?? DEFAULTS.holesPerMatch,
    teeoffformat: data.teeOffFormat ?? DEFAULTS.teeOffFormat,
    presidentid: data.presidentId ? BigInt(data.presidentId) : null,
    vicepresidentid: data.vicePresidentId ? BigInt(data.vicePresidentId) : null,
    secretaryid: data.secretaryId ? BigInt(data.secretaryId) : null,
    treasurerid: data.treasurerId ? BigInt(data.treasurerId) : null,
    scoringtype: data.scoringType ?? DEFAULTS.scoringType,
    usebestball: data.useBestBall ?? DEFAULTS.useBestBall,
    usehandicapscoring: data.useHandicapScoring ?? DEFAULTS.useHandicapScoring,
    perholepoints: data.perHolePoints ?? DEFAULTS.perHolePoints,
    perninepoints: data.perNinePoints ?? DEFAULTS.perNinePoints,
    permatchpoints: data.perMatchPoints ?? DEFAULTS.perMatchPoints,
    totalholespoints: data.totalHolesPoints ?? DEFAULTS.totalHolesPoints,
    againstfieldpoints: data.againstFieldPoints ?? DEFAULTS.againstFieldPoints,
    againstfielddescpoints: data.againstFieldDescPoints ?? DEFAULTS.againstFieldDescPoints,
    absentplayermode: data.absentPlayerMode
      ? toAbsentPlayerModeInt(data.absentPlayerMode)
      : DEFAULTS.absentPlayerMode,
    absentplayerpenalty: data.absentPlayerPenalty ?? DEFAULTS.absentPlayerPenalty,
    fullteamabsentmode: data.fullTeamAbsentMode
      ? toFullTeamAbsentModeInt(data.fullTeamAbsentMode)
      : DEFAULTS.fullTeamAbsentMode,
  };
}
