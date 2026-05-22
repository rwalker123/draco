import { z } from 'zod';
import { getLeaderCategories } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { shapeLeaderCategories } from './helpers/shapeLeaders.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'list_leader_categories';

export const listLeaderCategoriesInputSchema = {
  account_id: z.string().min(1),
};

export async function listLeaderCategoriesHandler(args: {
  account_id: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    const { data } = await getLeaderCategories({
      client,
      path: { accountId: args.account_id },
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

    return jsonResult(shapeLeaderCategories(data));
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
