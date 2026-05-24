import { z } from 'zod';
import { listStatisticalLeaders } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { shapeLeaders } from './helpers/shapeLeaders.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'get_statistical_leaders';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const getStatisticalLeadersInputSchema = {
  account_id: z.string().min(1),
  league_id: z.string().min(1),
  category: z.string().min(1),
  division_id: z.string().optional(),
  team_id: z.string().optional(),
  is_historical: z.boolean().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
};

export async function getStatisticalLeadersHandler(args: {
  account_id: string;
  league_id: string;
  category: string;
  division_id?: string;
  team_id?: string;
  is_historical?: boolean;
  limit?: number;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();
  const limit = args.limit ?? DEFAULT_LIMIT;

  try {
    const { data } = await listStatisticalLeaders({
      client,
      path: { accountId: args.account_id, leagueId: args.league_id },
      query: {
        category: args.category,
        divisionId: args.division_id,
        teamId: args.team_id,
        isHistorical: args.is_historical,
        limit: String(limit),
      },
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

    return jsonResult(shapeLeaders(data, args.category));
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
