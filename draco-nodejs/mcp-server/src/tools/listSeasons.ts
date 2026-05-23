import { z } from 'zod';
import { listAccountSeasons } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { shapeSeasons } from './helpers/shapeSeasons.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'list_seasons';

export const listSeasonsInputSchema = {
  account_id: z.string().min(1),
};

export async function listSeasonsHandler(args: { account_id: string }): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    const { data } = await listAccountSeasons({
      client,
      path: { accountId: args.account_id },
      query: { includeDivisions: true },
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

    return jsonResult(shapeSeasons(data));
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
