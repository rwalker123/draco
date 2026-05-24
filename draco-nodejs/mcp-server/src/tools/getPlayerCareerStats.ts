import { z } from 'zod';
import { getPlayerCareerStatistics } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { shapeBattingStats, shapePitchingStats } from './helpers/shapeStats.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'get_player_career_stats';

export const getPlayerCareerStatsInputSchema = {
  account_id: z.string().min(1),
  player_id: z.string().min(1),
};

export async function getPlayerCareerStatsHandler(args: {
  account_id: string;
  player_id: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    const { data } = await getPlayerCareerStatistics({
      client,
      path: { accountId: args.account_id, playerId: args.player_id },
      throwOnError: true,
    });

    const batting = shapeBattingStats(data);
    const pitching = shapePitchingStats(data);

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      requestId: ctx.requestId,
    });

    return jsonResult({
      summary: `Career statistics for ${data.playerName}.`,
      player_id: args.player_id,
      player_name: data.playerName,
      batting: {
        count: batting.rows.length,
        rows: batting.rows,
      },
      pitching: {
        count: pitching.rows.length,
        rows: pitching.rows,
      },
    });
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
