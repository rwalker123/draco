import { z } from 'zod';
import { getCurrentSeason, listMyTeamSeasons } from '@draco/shared-api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { RosterSeasonMembership } from '@draco/shared-api-client';
import { getDracoClient } from '../sdkClient/createDracoClient.js';
import { mapSdkError } from '../sdkClient/errorMapping.js';
import { auditLog } from '../logging/auditLogger.js';
import { getContext } from '../auth/perRequestContext.js';
import { jsonResult } from './helpers/jsonResult.js';

const TOOL_NAME = 'list_my_teams';

export const listMyTeamsInputSchema = {
  account_id: z.string().min(1),
  season_id: z.string().optional(),
};

interface ShapedTeamMembership {
  team_season_id: string;
  team_name: string;
  league_season_id: string;
  league_name: string;
  division_season_id: string | null;
  division_name: string | null;
  jersey_number: string | null;
}

function shapeTeams(teams: RosterSeasonMembership[], seasonId: string, seasonName: string) {
  const shaped: ShapedTeamMembership[] = teams.map((t) => ({
    team_season_id: t.teamSeasonId,
    team_name: t.teamName,
    league_season_id: t.leagueSeasonId,
    league_name: t.leagueName,
    division_season_id: t.divisionSeasonId ?? null,
    division_name: t.divisionName ?? null,
    jersey_number: t.jerseyNumber ?? null,
  }));

  const summary =
    shaped.length === 0
      ? `You're not on any teams in ${seasonName}.`
      : `You're on ${shaped.length} team${shaped.length === 1 ? '' : 's'} in ${seasonName}.`;

  return {
    summary,
    season_id: seasonId,
    season_name: seasonName,
    count: shaped.length,
    teams: shaped,
  };
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

    return jsonResult(shapeTeams(teams, seasonId, seasonName));
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
