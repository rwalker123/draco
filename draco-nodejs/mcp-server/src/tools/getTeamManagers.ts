import { z } from 'zod';
import { listTeamManagers } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { resolveCurrentSeason } from './helpers/resolveCurrentSeason.js';
import { shapeManagersText } from './helpers/shapeManagers.js';

const TOOL_NAME = 'get_team_managers';

export const getTeamManagersInputSchema = {
  account_id: z.string().min(1),
  team_season_id: z.string().min(1),
  season_id: z.string().optional(),
};

export async function getTeamManagersHandler(args: {
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

    const { data } = await listTeamManagers({
      client,
      path: { accountId: args.account_id, seasonId, teamSeasonId: args.team_season_id },
      throwOnError: true,
    });

    const teamName = data.length > 0 ? data[0].team.name : undefined;
    const text = shapeManagersText(data, teamName);

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: data.length,
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
