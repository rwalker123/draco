import { z } from 'zod';
import { listTeamSeasonGames } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { resolveMyTeamSeasons } from './helpers/resolveMyTeamSeasons.js';
import { getAccountTimezone } from './helpers/accountTimezone.js';
import { shapeGamesText } from './helpers/shapeGames.js';

const TOOL_NAME = 'get_recent_games';
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

export const getRecentGamesInputSchema = {
  account_id: z.string().min(1),
  team_season_id: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT).optional(),
};

export async function getRecentGamesHandler(args: {
  account_id: string;
  team_season_id?: string;
  limit?: number;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();
  const limit = args.limit ?? DEFAULT_LIMIT;

  try {
    const { seasonId } = await resolveCurrentSeason(client, args.account_id);

    const teamSeasonIds = args.team_season_id
      ? [args.team_season_id]
      : await resolveMyTeamSeasons(client, args.account_id, seasonId);

    if (teamSeasonIds.length === 0) {
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
        content: [{ type: 'text', text: "You're not on any teams in the current season." }],
      };
    }

    const results = await Promise.all(
      teamSeasonIds.map((teamSeasonId) =>
        listTeamSeasonGames({
          client,
          path: { accountId: args.account_id, seasonId, teamSeasonId },
          query: { recent: true, limit: MAX_LIMIT },
          throwOnError: true,
        }),
      ),
    );

    const allRecent = results.flatMap((r) => r.data.recent);
    allRecent.sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
    const games = allRecent.slice(0, limit);

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
        content: [{ type: 'text', text: 'You have no recent games.' }],
      };
    }

    const timezone = await getAccountTimezone(client, args.account_id);
    const text = `Your ${games.length} most recent game${games.length === 1 ? '' : 's'}:\n\n${shapeGamesText(games, timezone)}`;

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
