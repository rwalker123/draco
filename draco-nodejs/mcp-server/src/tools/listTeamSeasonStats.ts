import { z } from 'zod';
import { listTeamSeasonBattingStats, listTeamSeasonPitchingStats } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { shapeTeamBattingStats, shapeTeamPitchingStats } from './helpers/shapeTeamSeasonStats.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'list_team_season_stats';

export const listTeamSeasonStatsInputSchema = {
  account_id: z.string().min(1),
  team_season_id: z.string().min(1),
  stat_type: z.enum(['batting', 'pitching']),
  season_id: z.string().optional(),
};

export async function listTeamSeasonStatsHandler(args: {
  account_id: string;
  team_season_id: string;
  stat_type: 'batting' | 'pitching';
  season_id?: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    let seasonId = args.season_id;
    if (!seasonId) {
      const resolved = await resolveCurrentSeason(client, args.account_id);
      seasonId = resolved.seasonId;
    }

    if (args.stat_type === 'batting') {
      const { data } = await listTeamSeasonBattingStats({
        client,
        path: { accountId: args.account_id, seasonId, teamSeasonId: args.team_season_id },
        throwOnError: true,
      });
      auditLog({
        tool: TOOL_NAME,
        userId: ctx.userId,
        accountId: args.account_id,
        durationMs: Date.now() - start,
        status: 'ok',
        count: data.length,
        requestId: ctx.requestId,
      });
      return jsonResult(shapeTeamBattingStats(data));
    }

    const { data } = await listTeamSeasonPitchingStats({
      client,
      path: { accountId: args.account_id, seasonId, teamSeasonId: args.team_season_id },
      throwOnError: true,
    });
    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: data.length,
      requestId: ctx.requestId,
    });
    return jsonResult(shapeTeamPitchingStats(data));
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
