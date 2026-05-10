import { z } from 'zod';
import { getCurrentSeason, listMyTeamSeasons } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { RosterSeasonMembership } from '@draco/shared-api-client';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';

const TOOL_NAME = 'list_my_teams';

export const listMyTeamsInputSchema = {
  account_id: z.string().min(1),
  season_id: z.string().optional(),
};

function shapeTeamsText(teams: RosterSeasonMembership[], seasonName: string): string {
  if (teams.length === 0) {
    return `You're not on any teams in ${seasonName}.`;
  }

  const lines = teams.map((t) => {
    const division = t.divisionName ? `, ${t.divisionName}` : '';
    const jersey = t.jerseyNumber != null ? `, jersey #${t.jerseyNumber}` : ', no jersey';
    return `- ${t.teamName} (${t.leagueName}${division})${jersey}`;
  });

  return `You're on ${teams.length} team${teams.length === 1 ? '' : 's'} in ${seasonName}:\n${lines.join('\n')}`;
}

export async function listMyTeamsHandler(args: {
  account_id: string;
  season_id?: string;
}): Promise<CallToolResult> {
  const ctx = getContext();
  const start = Date.now();
  const client = getDracoClient();

  try {
    let seasonId = args.season_id;
    let seasonName = 'the current season';

    if (!seasonId) {
      const { data: season } = await getCurrentSeason({
        client,
        path: { accountId: args.account_id },
        throwOnError: true,
      });
      seasonId = season.id;
      seasonName = season.name;
    }

    const { data: teams } = await listMyTeamSeasons({
      client,
      path: { accountId: args.account_id, seasonId },
      throwOnError: true,
    });

    auditLog({
      tool: TOOL_NAME,
      userId: ctx.userId,
      accountId: args.account_id,
      durationMs: Date.now() - start,
      status: 'ok',
      count: teams.length,
      requestId: ctx.requestId,
    });

    return {
      content: [{ type: 'text', text: shapeTeamsText(teams, seasonName) }],
    };
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
