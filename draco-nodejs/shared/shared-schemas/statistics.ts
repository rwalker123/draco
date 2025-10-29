import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { booleanQueryParam } from './queryParams.js';

extendZodWithOpenApi(z);

export const PlayerBattingStatsSchema = z.object({
  playerId: bigintToStringSchema,
  playerName: nameSchema,
  teams: nameSchema.array().optional(), // Array of team names player played for
  teamName: nameSchema, // Formatted string of teams for display
  ab: z.number().min(0),
  h: z.number().min(0),
  r: z.number().min(0),
  d: z.number().min(0), // doubles
  t: z.number().min(0), // triples
  hr: z.number().min(0),
  rbi: z.number().min(0),
  bb: z.number().min(0),
  so: z.number().min(0),
  hbp: z.number().min(0),
  sb: z.number().min(0),
  sf: z.number().min(0),
  sh: z.number().min(0),
  // Calculated fields
  avg: z.number().min(0),
  obp: z.number().min(0),
  slg: z.number().min(0),
  ops: z.number().min(0),
  tb: z.number().min(0),
  pa: z.number().min(0),
});

export const PlayerBattingStatsBriefSchema = PlayerBattingStatsSchema.omit({
  teams: true,
  teamName: true,
  hbp: true,
  sb: true,
  sf: true,
  sh: true,
  tb: true,
  pa: true,
});

export const PlayerPitchingStatsSchema = z.object({
  playerId: bigintToStringSchema,
  playerName: nameSchema,
  teams: nameSchema.array().optional(), // Array of team names player played for
  teamName: nameSchema, // Formatted string of teams for display
  ip: z.number().min(0),
  ip2: z.number().min(0), // partial innings (outs)
  w: z.number().min(0),
  l: z.number().min(0),
  s: z.number().min(0), // saves
  h: z.number().min(0),
  r: z.number().min(0),
  er: z.number().min(0),
  bb: z.number().min(0),
  so: z.number().min(0),
  hr: z.number().min(0),
  bf: z.number().min(0), // batters faced
  wp: z.number().min(0), // wild pitches
  hbp: z.number().min(0),
  // Calculated fields
  era: z.number().min(0),
  whip: z.number().min(0),
  k9: z.number().min(0),
  bb9: z.number().min(0),
  oba: z.number().min(0), // opponent batting average
  slg: z.number().min(0), // opponent slugging
  ipDecimal: z.number().min(0), // innings pitched as decimal
});

export const PlayerPitchingStatsBriefSchema = PlayerPitchingStatsSchema.omit({
  teams: true,
  teamName: true,
  ip: true,
  ip2: true,
  hr: true,
  ipDecimal: true,
  bf: true,
  wp: true,
  hbp: true,
  k9: true,
  bb9: true,
  oba: true,
  slg: true,
}).extend({
  ip: z.string().describe('Innings pitched, rounded to nearest whole inning'),
});

export const StatisticsFiltersSchema = z.object({
  seasonId: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  leagueId: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  divisionId: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  teamId: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  isHistorical: booleanQueryParam.default(false),
  includeAllGameTypes: booleanQueryParam.default(false),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .default(1),
  pageSize: z
    .string()
    .transform((val) => parseInt(val))
    .default(50),
});

export const BattingStatisticsFiltersSchema = StatisticsFiltersSchema.omit({
  seasonId: true,
}).extend({
  minAB: z
    .string()
    .transform((val) => parseInt(val))
    .default(10),
  sortField: z.string().default('avg'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const PitchingStatisticsFiltersSchema = StatisticsFiltersSchema.omit({
  seasonId: true,
}).extend({
  minIP: z
    .string()
    .transform((val) => parseInt(val))
    .default(1),
  sortField: z.string().default('era'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const LeaderStatisticsFiltersSchema = StatisticsFiltersSchema.omit({
  seasonId: true,
}).extend({
  minAB: z
    .string()
    .transform((val) => parseInt(val))
    .default(0),
  minIP: z
    .string()
    .transform((val) => parseInt(val))
    .default(0),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .default(5),
});

export const LeaderRowSchema = z.object({
  playerId: bigintToStringSchema,
  playerName: nameSchema,
  teams: nameSchema.array().optional(),
  teamName: nameSchema,
  statValue: z.number().min(0),
  category: z.string(),
  rank: z.number(),
  isTie: z.boolean().optional(),
  tieCount: z.number().optional(),
});

export const LeaderCategorySchema = z.object({
  key: z.string(),
  label: z.string(),
  format: z.string(),
});

export const LeaderCategoriesSchema = z.object({
  batting: LeaderCategorySchema.array(),
  pitching: LeaderCategorySchema.array(),
});

export type PlayerBattingStatsType = z.infer<typeof PlayerBattingStatsSchema>;
export type PlayerPitchingStatsType = z.infer<typeof PlayerPitchingStatsSchema>;
export type StatisticsFiltersType = z.infer<typeof StatisticsFiltersSchema>;
export type LeaderRowType = z.infer<typeof LeaderRowSchema>;
export type LeaderCategoryType = z.infer<typeof LeaderCategorySchema>;
export type LeaderCategoriesType = z.infer<typeof LeaderCategoriesSchema>;
export type BattingStatisticsFiltersType = z.infer<typeof BattingStatisticsFiltersSchema>;
export type PitchingStatisticsFiltersType = z.infer<typeof PitchingStatisticsFiltersSchema>;
export type LeaderStatisticsFiltersType = z.infer<typeof LeaderStatisticsFiltersSchema>;
export type PlayerBattingStatsBriefType = z.infer<typeof PlayerBattingStatsBriefSchema>;
export type PlayerPitchingStatsBriefType = z.infer<typeof PlayerPitchingStatsBriefSchema>;

export const TeamStatsPlayerSummarySchema = z.object({
  rosterSeasonId: bigintToStringSchema,
  playerId: bigintToStringSchema,
  contactId: bigintToStringSchema,
  playerName: nameSchema,
  playerNumber: z.number().int().min(0).nullable(),
  photoUrl: z.string().url().nullable().optional(),
});

export const GameBattingStatInputSchema = z.object({
  ab: z.number().int().min(0),
  h: z.number().int().min(0),
  r: z.number().int().min(0),
  d: z.number().int().min(0),
  t: z.number().int().min(0),
  hr: z.number().int().min(0),
  rbi: z.number().int().min(0),
  so: z.number().int().min(0),
  bb: z.number().int().min(0),
  hbp: z.number().int().min(0),
  sb: z.number().int().min(0),
  cs: z.number().int().min(0),
  sf: z.number().int().min(0),
  sh: z.number().int().min(0),
  re: z.number().int().min(0),
  intr: z.number().int().min(0),
  lob: z.number().int().min(0),
});

export const CreateGameBattingStatSchema = GameBattingStatInputSchema.extend({
  rosterSeasonId: bigintToStringSchema,
});

export const GameBattingStatLineSchema = GameBattingStatInputSchema.extend({
  statId: bigintToStringSchema,
  rosterSeasonId: bigintToStringSchema,
  playerId: bigintToStringSchema,
  contactId: bigintToStringSchema,
  playerName: nameSchema,
  playerNumber: z.number().int().min(0).nullable(),
  tb: z.number().min(0),
  pa: z.number().min(0),
  avg: z.number().min(0),
  obp: z.number().min(0),
  slg: z.number().min(0),
  ops: z.number().min(0),
});

export const GameBattingTotalsSchema = GameBattingStatLineSchema.pick({
  ab: true,
  h: true,
  r: true,
  d: true,
  t: true,
  hr: true,
  rbi: true,
  so: true,
  bb: true,
  hbp: true,
  sb: true,
  cs: true,
  sf: true,
  sh: true,
  re: true,
  intr: true,
  lob: true,
  tb: true,
  pa: true,
  avg: true,
  obp: true,
  slg: true,
  ops: true,
});

export const GameBattingStatsSchema = z.object({
  gameId: bigintToStringSchema,
  teamSeasonId: bigintToStringSchema,
  stats: GameBattingStatLineSchema.array(),
  totals: GameBattingTotalsSchema,
  availablePlayers: TeamStatsPlayerSummarySchema.array(),
});

export const UpdateGameBattingStatSchema = GameBattingStatInputSchema;

export const GamePitchingStatInputSchema = z.object({
  ipDecimal: z.number().min(0),
  w: z.number().int().min(0),
  l: z.number().int().min(0),
  s: z.number().int().min(0),
  h: z.number().int().min(0),
  r: z.number().int().min(0),
  er: z.number().int().min(0),
  d: z.number().int().min(0),
  t: z.number().int().min(0),
  hr: z.number().int().min(0),
  so: z.number().int().min(0),
  bb: z.number().int().min(0),
  bf: z.number().int().min(0),
  wp: z.number().int().min(0),
  hbp: z.number().int().min(0),
  bk: z.number().int().min(0),
  sc: z.number().int().min(0),
});

export const CreateGamePitchingStatSchema = GamePitchingStatInputSchema.extend({
  rosterSeasonId: bigintToStringSchema,
});

export const GamePitchingStatLineSchema = GamePitchingStatInputSchema.extend({
  statId: bigintToStringSchema,
  rosterSeasonId: bigintToStringSchema,
  playerId: bigintToStringSchema,
  contactId: bigintToStringSchema,
  playerName: nameSchema,
  playerNumber: z.number().int().min(0).nullable(),
  ip: z.number().min(0),
  ip2: z.number().int().min(0),
  era: z.number().min(0),
  whip: z.number().min(0),
  k9: z.number().min(0),
  bb9: z.number().min(0),
  oba: z.number().min(0),
  slg: z.number().min(0),
});

export const GamePitchingTotalsSchema = GamePitchingStatLineSchema.pick({
  ipDecimal: true,
  w: true,
  l: true,
  s: true,
  h: true,
  r: true,
  er: true,
  d: true,
  t: true,
  hr: true,
  so: true,
  bb: true,
  bf: true,
  wp: true,
  hbp: true,
  bk: true,
  sc: true,
  ip: true,
  ip2: true,
  era: true,
  whip: true,
  k9: true,
  bb9: true,
  oba: true,
  slg: true,
});

export const GamePitchingStatsSchema = z.object({
  gameId: bigintToStringSchema,
  teamSeasonId: bigintToStringSchema,
  stats: GamePitchingStatLineSchema.array(),
  totals: GamePitchingTotalsSchema,
  availablePlayers: TeamStatsPlayerSummarySchema.array(),
});

export const UpdateGamePitchingStatSchema = GamePitchingStatInputSchema;

export const TeamCompletedGameSchema = z.object({
  gameId: bigintToStringSchema,
  gameDate: z.string().describe('ISO date string'),
  opponentTeamName: nameSchema,
  isHomeTeam: z.boolean(),
  homeScore: z.number().int().min(0),
  visitorScore: z.number().int().min(0),
  gameStatus: z.number().int(),
});

export const TeamCompletedGamesSchema = TeamCompletedGameSchema.array();

export const GameAttendanceSchema = z.object({
  playerIds: z.string().array(),
});

export const UpdateGameAttendanceSchema = GameAttendanceSchema;

export type TeamStatsPlayerSummaryType = z.infer<typeof TeamStatsPlayerSummarySchema>;
export type GameBattingStatLineType = z.infer<typeof GameBattingStatLineSchema>;
export type GameBattingTotalsType = z.infer<typeof GameBattingTotalsSchema>;
export type GameBattingStatsType = z.infer<typeof GameBattingStatsSchema>;
export type GamePitchingStatLineType = z.infer<typeof GamePitchingStatLineSchema>;
export type GamePitchingTotalsType = z.infer<typeof GamePitchingTotalsSchema>;
export type GamePitchingStatsType = z.infer<typeof GamePitchingStatsSchema>;
export type TeamCompletedGameType = z.infer<typeof TeamCompletedGameSchema>;
export type GameAttendanceType = z.infer<typeof GameAttendanceSchema>;
export type CreateGameBattingStatType = z.infer<typeof CreateGameBattingStatSchema>;
export type UpdateGameBattingStatType = z.infer<typeof UpdateGameBattingStatSchema>;
export type CreateGamePitchingStatType = z.infer<typeof CreateGamePitchingStatSchema>;
export type UpdateGamePitchingStatType = z.infer<typeof UpdateGamePitchingStatSchema>;
export type UpdateGameAttendanceType = z.infer<typeof UpdateGameAttendanceSchema>;
