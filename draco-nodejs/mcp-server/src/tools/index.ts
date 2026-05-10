import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listMyAccountsHandler } from './listMyAccounts.js';
import { listMyTeamsInputSchema, listMyTeamsHandler } from './listMyTeams.js';
import { getMyBattingStatsInputSchema, getMyBattingStatsHandler } from './getMyBattingStats.js';
import { getMyPitchingStatsInputSchema, getMyPitchingStatsHandler } from './getMyPitchingStats.js';
import { getRecentGamesInputSchema, getRecentGamesHandler } from './getRecentGames.js';
import { getTeamManagersInputSchema, getTeamManagersHandler } from './getTeamManagers.js';
import { getTeamRosterInputSchema, getTeamRosterHandler } from './getTeamRoster.js';
import { getTeamScheduleInputSchema, getTeamScheduleHandler } from './getTeamSchedule.js';
import { getUpcomingGamesInputSchema, getUpcomingGamesHandler } from './getUpcomingGames.js';

export function registerTools(server: McpServer): void {
  server.registerTool(
    'get_my_batting_stats',
    {
      description:
        "Retrieve the authenticated user's career batting statistics for a given account. Returns a stat table with AB, H, R, HR, RBI, AVG, OBP, SLG, and OPS. Returns a friendly message if the user has no player record in this account.",
      inputSchema: getMyBattingStatsInputSchema,
    },
    async (args) => getMyBattingStatsHandler(args),
  );

  server.registerTool(
    'get_my_pitching_stats',
    {
      description:
        "Retrieve the authenticated user's career pitching statistics for a given account. Returns a stat table with IP, W, L, S, ERA, WHIP, and K/9. Returns a friendly message if the user has no player record in this account.",
      inputSchema: getMyPitchingStatsInputSchema,
    },
    async (args) => getMyPitchingStatsHandler(args),
  );

  server.registerTool(
    'get_recent_games',
    {
      description:
        "List the most recently played games for the authenticated user's team(s) in a given account. Optionally scope to a specific team_season_id. Returns up to `limit` games sorted most-recent first.",
      inputSchema: getRecentGamesInputSchema,
    },
    async (args) => getRecentGamesHandler(args),
  );

  server.registerTool(
    'get_team_managers',
    {
      description:
        'List the managers (coaches/admins) for a specific team season. Provide the team_season_id from list_my_teams.',
      inputSchema: getTeamManagersInputSchema,
    },
    async (args) => getTeamManagersHandler(args),
  );

  server.registerTool(
    'get_team_roster',
    {
      description:
        'List roster members (name and jersey number) for a specific team season. Omit season_id to use the current season. PII such as phone, email, and address are never included.',
      inputSchema: getTeamRosterInputSchema,
    },
    async (args) => getTeamRosterHandler(args),
  );

  server.registerTool(
    'get_team_schedule',
    {
      description:
        "Retrieve a team's full schedule for a season with optional date range filtering. Use `from` and `to` as ISO date strings (YYYY-MM-DD). Omit season_id to use the current season.",
      inputSchema: getTeamScheduleInputSchema,
    },
    async (args) => getTeamScheduleHandler(args),
  );

  server.registerTool(
    'get_upcoming_games',
    {
      description:
        "List the next upcoming games for the authenticated user's team(s) in a given account. Optionally scope to a specific team_season_id. Returns up to `limit` games sorted soonest first.",
      inputSchema: getUpcomingGamesInputSchema,
    },
    async (args) => getUpcomingGamesHandler(args),
  );

  server.registerTool(
    'list_my_accounts',
    {
      description:
        'List all Draco accounts that the authenticated user belongs to. Use this first to discover account IDs needed by other tools.',
    },
    async () => listMyAccountsHandler(),
  );

  server.registerTool(
    'list_my_teams',
    {
      description:
        'List all teams the authenticated user is on for a given account and season. Omit season_id to use the current season.',
      inputSchema: listMyTeamsInputSchema,
    },
    async (args) => listMyTeamsHandler(args),
  );
}
