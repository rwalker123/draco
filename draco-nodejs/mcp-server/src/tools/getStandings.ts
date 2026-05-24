import { z } from 'zod';
import { getSeasonStandings } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { shapeGroupedStandings, shapeFlatStandings } from './helpers/shapeStandings.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'get_standings';

export const getStandingsInputSchema = {
  account_id: z.string().min(1),
  season_id: z.string().optional(),
  grouped: z.boolean().optional(),
  league_id: z.string().optional(),
};

export async function getStandingsHandler(args: {
  account_id: string;
  season_id?: string;
  grouped?: boolean;
  league_id?: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();
  const grouped = args.grouped ?? true;

  try {
    let seasonId = args.season_id;
    if (!seasonId) {
      const resolved = await resolveCurrentSeason(client, args.account_id);
      seasonId = resolved.seasonId;
    }

    const { data } = await getSeasonStandings({
      client,
      path: { accountId: args.account_id, seasonId },
      query: { grouped },
      throwOnError: true,
    });

    const shaped = grouped
      ? shapeGroupedStandings(data, seasonId, args.league_id)
      : shapeFlatStandings(data, seasonId, args.league_id);

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      requestId: ctx.requestId,
    });

    return jsonResult(shaped);
  } catch (err) {
    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'error',
      requestId: ctx.requestId,
    });
    mapSdkError(err, { tool: TOOL_NAME });
  }
}
