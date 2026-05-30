import { z } from 'zod';
import { listSeasonGames } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { getAccountTimezone } from './helpers/accountTimezone.js';
import { shapeGames } from './helpers/shapeGames.js';
import { jsonResult } from './helpers/jsonResult.js';
import { localDateSchema } from './helpers/dateSchema.js';
import {
  resolveGameDateWindow,
  filterGamesByLocalDate,
  type GameDateRange,
} from './helpers/resolveGameDateWindow.js';

const TOOL_NAME = 'get_account_games';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export const getAccountGamesInputSchema = {
  account_id: z.string().min(1),
  season_id: z.string().optional(),
  range: z.enum(['today', 'tonight', 'tomorrow', 'this_week', 'this_weekend']).optional(),
  from: localDateSchema.optional(),
  to: localDateSchema.optional(),
  league_id: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
};

type SeasonGame = NonNullable<Awaited<ReturnType<typeof listSeasonGames>>['data']>['games'][number];

async function fetchSeasonGamesInWindow(
  client: Client,
  accountId: string,
  seasonId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ games: SeasonGame[]; truncated: boolean }> {
  const games: SeasonGame[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (page <= MAX_PAGES && (page - 1) * PAGE_SIZE < total) {
    const { data } = await listSeasonGames({
      client,
      path: { accountId, seasonId },
      query: { startDate, endDate, page, limit: PAGE_SIZE, sortOrder: 'asc' },
      throwOnError: true,
    });

    games.push(...data.games);
    total = data.pagination.total;

    if (data.games.length === 0) {
      break;
    }
    page += 1;
  }

  return { games, truncated: games.length < total };
}

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

    const { games: windowGames, truncated } = await fetchSeasonGamesInWindow(
      client,
      args.account_id,
      seasonId,
      window.startDate,
      window.endDate,
    );

    if (truncated) {
      console.warn(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: 'account_games_truncated',
          tool: TOOL_NAME,
          accountId: args.account_id,
          fetched: windowGames.length,
          maxPages: MAX_PAGES,
        }),
      );
    }

    let games = filterGamesByLocalDate(windowGames, timezone, window.localStart, window.localEnd);

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

    const summary = truncated
      ? `${buildSummary(limited.length, args)} (results may be incomplete — too many games in range; narrow the date range or league.)`
      : buildSummary(limited.length, args);

    return jsonResult({
      summary,
      timezone,
      count: limited.length,
      truncated,
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
