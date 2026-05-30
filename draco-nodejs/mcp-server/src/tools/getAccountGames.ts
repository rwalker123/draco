import { z } from 'zod';
import { listSeasonGames } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { getAccountTimezone } from './helpers/accountTimezone.js';
import { shapeGames } from './helpers/shapeGames.js';
import { jsonResult } from './helpers/jsonResult.js';
import {
  resolveGameDateWindow,
  filterGamesByLocalDate,
  type GameDateRange,
} from './helpers/resolveGameDateWindow.js';

const TOOL_NAME = 'get_account_games';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const BACKEND_FETCH_LIMIT = 200;

export const getAccountGamesInputSchema = {
  account_id: z.string().min(1),
  season_id: z.string().optional(),
  range: z.enum(['today', 'tonight', 'tomorrow', 'this_week', 'this_weekend']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  league_id: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
};

interface GetAccountGamesArgs {
  account_id: string;
  season_id?: string;
  range?: GameDateRange;
  from?: string;
  to?: string;
  league_id?: string;
  limit?: number;
}

function describeWindow(args: GetAccountGamesArgs): string {
  if (args.from || args.to) {
    if (args.from && args.to) {
      return `between ${args.from} and ${args.to}`;
    }
    return args.from ? `on or after ${args.from}` : `on or before ${args.to}`;
  }

  switch (args.range ?? 'today') {
    case 'tomorrow':
      return 'tomorrow';
    case 'this_week':
      return 'this week';
    case 'this_weekend':
      return 'this weekend';
    default:
      return 'today';
  }
}

function buildSummary(count: number, args: GetAccountGamesArgs): string {
  const when = describeWindow(args);
  const league = args.league_id ? ' in the selected league' : '';
  if (count === 0) {
    return `No games scheduled ${when}${league}.`;
  }
  return `${count} game${count === 1 ? '' : 's'} scheduled ${when}${league}.`;
}

export async function getAccountGamesHandler(args: GetAccountGamesArgs): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();
  const limit = args.limit ?? DEFAULT_LIMIT;

  try {
    const seasonId =
      args.season_id ?? (await resolveCurrentSeason(client, args.account_id)).seasonId;

    const timezone = await getAccountTimezone(client, args.account_id);

    const window = resolveGameDateWindow({
      range: args.range,
      from: args.from,
      to: args.to,
      timezone,
      now: new Date(),
    });

    const { data } = await listSeasonGames({
      client,
      path: { accountId: args.account_id, seasonId },
      query: {
        startDate: window.startDate,
        endDate: window.endDate,
        limit: BACKEND_FETCH_LIMIT,
        sortOrder: 'asc',
      },
      throwOnError: true,
    });

    let games = filterGamesByLocalDate(data.games, timezone, window.localStart, window.localEnd);

    if (args.league_id) {
      games = games.filter((game) => game.league.id === args.league_id);
    }

    const sorted = [...games].sort(
      (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime(),
    );
    const limited = sorted.slice(0, limit);
    const shaped = shapeGames(limited, timezone);

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: limited.length,
      requestId: ctx.requestId,
    });

    return jsonResult({
      summary: buildSummary(limited.length, args),
      timezone,
      count: limited.length,
      games: shaped,
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
