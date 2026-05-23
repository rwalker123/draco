import { getMyAccounts } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { shapeAccounts } from './helpers/shapeAccount.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'list_my_accounts';

export async function listMyAccountsHandler(): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  try {
    const { data } = await getMyAccounts({
      client: getDracoClient(),
      throwOnError: true,
    });
    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      durationMs: Date.now() - start,
      status: 'ok',
      count: data.length,
      requestId: ctx.requestId,
    });
    return jsonResult(shapeAccounts(data));
  } catch (err) {
    const e = err as { message?: string; status?: number; response?: { status?: number } };
    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      durationMs: Date.now() - start,
      status: 'error',
      requestId: ctx.requestId,
      errorMessage: e?.message ?? String(err),
      errorStatus: e?.response?.status ?? e?.status,
    });
    mapSdkError(err, { tool: TOOL_NAME });
  }
}
