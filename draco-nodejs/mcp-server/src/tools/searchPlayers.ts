import { z } from 'zod';
import { searchPublicContacts } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'search_players';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const searchPlayersInputSchema = {
  account_id: z.string().min(1),
  query: z.string().min(2),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
};

export async function searchPlayersHandler(args: {
  account_id: string;
  query: string;
  limit?: number;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();
  const limit = args.limit ?? DEFAULT_LIMIT;

  try {
    const { data } = await searchPublicContacts({
      client,
      path: { accountId: args.account_id },
      query: { query: args.query, limit: String(limit) },
      throwOnError: true,
    });

    const players = data.results.map((c) => ({
      player_id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      first_name: c.firstName,
      last_name: c.lastName,
    }));

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: players.length,
      requestId: ctx.requestId,
    });

    return jsonResult({
      summary:
        players.length === 0
          ? `No players found matching "${args.query}".`
          : `Found ${players.length} player${players.length === 1 ? '' : 's'} matching "${args.query}". Use player_id with get_player_career_stats.`,
      query: args.query,
      count: players.length,
      players,
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
