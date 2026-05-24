import { z } from 'zod';
import { getPlayerCareerStatistics } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveContact } from './helpers/resolveContact.js';
import { shapeBattingStats } from './helpers/shapeStats.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'get_my_batting_stats';

export const getMyBattingStatsInputSchema = {
  account_id: z.string().min(1),
};

export async function getMyBattingStatsHandler(args: {
  account_id: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    const { contactId, rosterId } = await resolveContact(client, args.account_id);

    if (!rosterId) {
      auditLog({
        tool: TOOL_NAME,
        userId: ctx.userId,
        accountId: args.account_id,
        durationMs: Date.now() - start,
        status: 'ok',
        requestId: ctx.requestId,
      });
      return jsonResult({
        summary: "You don't have player stats in this account.",
        player_name: null,
        rows: [],
      });
    }

    const { data } = await getPlayerCareerStatistics({
      client,
      path: { accountId: args.account_id, playerId: contactId },
      throwOnError: true,
    });

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      requestId: ctx.requestId,
    });

    return jsonResult(shapeBattingStats(data));
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
