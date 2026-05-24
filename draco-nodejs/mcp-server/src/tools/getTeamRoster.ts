import { z } from 'zod';
import { getPublicTeamRosterMembers } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { shapeRoster } from './helpers/shapeRoster.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'get_team_roster';

export const getTeamRosterInputSchema = {
  account_id: z.string().min(1),
  team_season_id: z.string().min(1),
  season_id: z.string().optional(),
};

export async function getTeamRosterHandler(args: {
  account_id: string;
  team_season_id: string;
  season_id?: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    let seasonId = args.season_id;
    if (!seasonId) {
      const resolved = await resolveCurrentSeason(client, args.account_id);
      seasonId = resolved.seasonId;
    }

    const { data } = await getPublicTeamRosterMembers({
      client,
      path: { accountId: args.account_id, seasonId, teamSeasonId: args.team_season_id },
      throwOnError: true,
    });

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: data.rosterMembers.length,
      requestId: ctx.requestId,
    });

    return jsonResult(shapeRoster(data));
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
