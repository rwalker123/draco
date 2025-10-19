import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { SeasonSchema } from './seasonBase.js';
import { LeagueSeasonWithDivisionSchema } from './league.js';

extendZodWithOpenApi(z);

export * from './seasonBase.js';

export const CurrentSeasonResponseSchema = z.union([SeasonSchema, LeagueSeasonWithDivisionSchema]);

export type CurrentSeasonResponseType = z.infer<typeof CurrentSeasonResponseSchema>;
