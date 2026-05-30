import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listMyAccountsHandler } from './listMyAccounts.js';
import { listMyTeamsInputSchema, listMyTeamsHandler } from './listMyTeams.js';
import { getMyBattingStatsInputSchema, getMyBattingStatsHandler } from './getMyBattingStats.js';
import { getMyPitchingStatsInputSchema, getMyPitchingStatsHandler } from './getMyPitchingStats.js';
import { getAccountGamesInputSchema, getAccountGamesHandler } from './getAccountGames.js';
import { getRecentGamesInputSchema, getRecentGamesHandler } from './getRecentGames.js';
import { getTeamManagersInputSchema, getTeamManagersHandler } from './getTeamManagers.js';
import { getTeamRosterInputSchema, getTeamRosterHandler } from './getTeamRoster.js';
import { getTeamScheduleInputSchema, getTeamScheduleHandler } from './getTeamSchedule.js';
import { getUpcomingGamesInputSchema, getUpcomingGamesHandler } from './getUpcomingGames.js';
import { listSeasonsInputSchema, listSeasonsHandler } from './listSeasons.js';
import {
  listLeaderCategoriesInputSchema,
  listLeaderCategoriesHandler,
} from './listLeaderCategories.js';
import {
  getStatisticalLeadersInputSchema,
  getStatisticalLeadersHandler,
} from './getStatisticalLeaders.js';
import { searchPlayersInputSchema, searchPlayersHandler } from './searchPlayers.js';
import {
  getPlayerCareerStatsInputSchema,
  getPlayerCareerStatsHandler,
} from './getPlayerCareerStats.js';
import {
  listTeamSeasonStatsInputSchema,
  listTeamSeasonStatsHandler,
} from './listTeamSeasonStats.js';
import { getStandingsInputSchema, getStandingsHandler } from './getStandings.js';

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
    'get_account_games',
    {
      description:
        "List games scheduled across an entire account for a season, not limited to the user's own teams. Use `range` ('today', 'tonight', 'tomorrow', 'this_week', 'this_weekend') for natural date queries — dates are evaluated in the account's timezone, so to answer \"are there any games tonight?\" pass range='today'. Provide `from`/`to` (YYYY-MM-DD) for an explicit date range instead. To restrict to a specific league (e.g. an \"18+\" league, whose age group is part of the league name), first call list_seasons to find its league_season_id and pass it as `league_id`. Division filtering is not supported. Omit season_id to use the current season.",
      inputSchema: getAccountGamesInputSchema,
    },
    async (args) => getAccountGamesHandler(args),
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
        'List all ezRecSports accounts that the authenticated user belongs to. Use this first to discover account IDs needed by other tools.',
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

  server.registerTool(
    'list_seasons',
    {
      description:
        'List all seasons in an account, including each season’s leagues and divisions. Use this to find season_id, league_season_id (used as league_id by other stats tools), and division_season_id.',
      inputSchema: listSeasonsInputSchema,
    },
    async (args) => listSeasonsHandler(args),
  );

  server.registerTool(
    'list_leader_categories',
    {
      description:
        'List the batting and pitching leader categories available for the get_statistical_leaders tool (e.g., hr, rbi, avg, era, whip). Each category has a key, human label, and numeric format.',
      inputSchema: listLeaderCategoriesInputSchema,
    },
    async (args) => listLeaderCategoriesHandler(args),
  );

  server.registerTool(
    'get_statistical_leaders',
    {
      description:
        'Return the top players in a league for a given statistical category (e.g., "hr", "avg", "era"). league_id is the league_season_id from list_seasons. Use list_leader_categories first to see valid category keys. Set is_historical=true for all-time leaders.',
      inputSchema: getStatisticalLeadersInputSchema,
    },
    async (args) => getStatisticalLeadersHandler(args),
  );

  server.registerTool(
    'search_players',
    {
      description:
        'Search for players in an account by name. Returns a list of matching players with player_id values that can be used with get_player_career_stats. Query must be at least 2 characters.',
      inputSchema: searchPlayersInputSchema,
    },
    async (args) => searchPlayersHandler(args),
  );

  server.registerTool(
    'get_player_career_stats',
    {
      description:
        "Retrieve a specific player's career batting and pitching statistics broken down by season. Use search_players to find a player_id by name.",
      inputSchema: getPlayerCareerStatsInputSchema,
    },
    async (args) => getPlayerCareerStatsHandler(args),
  );

  server.registerTool(
    'list_team_season_stats',
    {
      description:
        'List per-player batting or pitching statistics for a specific team in a season. Set stat_type to "batting" or "pitching". Omit season_id to use the current season.',
      inputSchema: listTeamSeasonStatsInputSchema,
    },
    async (args) => listTeamSeasonStatsHandler(args),
  );

  server.registerTool(
    'get_standings',
    {
      description:
        'Return league standings for a season. By default returns standings grouped by league and division (`grouped=true`). Set `grouped=false` for a flat list of all teams. Optionally pass `league_id` (the league_season_id from list_seasons) to filter to a single league. Omit season_id to use the current season.',
      inputSchema: getStandingsInputSchema,
    },
    async (args) => getStandingsHandler(args),
  );
}
