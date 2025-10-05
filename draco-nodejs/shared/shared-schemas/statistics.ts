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
