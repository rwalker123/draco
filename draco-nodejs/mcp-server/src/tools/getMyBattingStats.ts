import { z } from 'zod';
import { getPlayerCareerStatistics } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveContact } from './helpers/resolveContact.js';
import { shapeBattingStatsText } from './helpers/shapeStats.js';

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
    const { rosterId } = await resolveContact(client, args.account_id);

    if (!rosterId) {
      auditLog({
        tool: TOOL_NAME,
        userId: ctx.userId,
        accountId: args.account_id,
        durationMs: Date.now() - start,
        status: 'ok',
        requestId: ctx.requestId,
      });
      return {
        content: [{ type: 'text', text: "You don't have player stats in this account." }],
      };
    }

    const { data } = await getPlayerCareerStatistics({
      client,
      path: { accountId: args.account_id, playerId: rosterId },
      throwOnError: true,
    });

    const text = shapeBattingStatsText(data);

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
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
