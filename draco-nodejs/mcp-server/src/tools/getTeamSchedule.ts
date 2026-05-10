import { z } from 'zod';
import { listTeamSeasonSchedule } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { getAccountTimezone } from './helpers/accountTimezone.js';
import { shapeGamesText } from './helpers/shapeGames.js';

const TOOL_NAME = 'get_team_schedule';

export const getTeamScheduleInputSchema = {
  account_id: z.string().min(1),
  team_season_id: z.string().min(1),
  season_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
};

export async function getTeamScheduleHandler(args: {
  account_id: string;
  team_season_id: string;
  season_id?: string;
  from?: string;
  to?: string;
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

    const { data } = await listTeamSeasonSchedule({
      client,
      path: { accountId: args.account_id, seasonId, teamSeasonId: args.team_season_id },
      query: {
        startDate: args.from,
        endDate: args.to,
        sortOrder: 'asc',
        limit: 100,
      },
      throwOnError: true,
    });

    const games = data.games;

    if (games.length === 0) {
      auditLog({
        tool: TOOL_NAME,
        userId: ctx.userId,
        accountId: args.account_id,
        durationMs: Date.now() - start,
        status: 'ok',
        count: 0,
        requestId: ctx.requestId,
      });
      return {
        content: [{ type: 'text', text: 'No games found for the specified date range.' }],
      };
    }

    const timezone = await getAccountTimezone(client, args.account_id);
    const text = `Team schedule (${games.length} game${games.length === 1 ? '' : 's'}):\n\n${shapeGamesText(games, timezone)}`;

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: games.length,
      requestId: ctx.requestId,
    });

    return { content: [{ type: 'text', text }] };
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
