import {
  DivisionSeasonType,
  DivisionSeasonWithTeamsType,
  GameType,
  LeagueSeasonType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  LeagueSetupType,
  LeagueType,
  TeamSeasonWithPlayerCountType,
} from '@draco/shared-schemas';
import {
  dbDivisionSeasonWithDefinition,
  dbDivisionSeasonWithTeams,
  dbLeague,
  dbLeagueSeasonWithDivisionDetails,
  dbLeagueSeasonWithTeams,
  dbScheduleGameWithDetails,
} from '../repositories/index.js';
import { getLogoUrl } from '../config/logo.js';
import { ScheduleResponseFormatter } from './scheduleResponseFormatter.js';

interface TeamCountOptions {
  includePlayerCount: boolean;
  includeManagerCount: boolean;
  playerCounts?: Map<string, number>;
  managerCounts?: Map<string, number>;
}

interface LeagueSetupFormatOptions extends TeamCountOptions {
  includeTeams: boolean;
  includeUnassignedTeams: boolean;
  accountId: bigint;
}

type LeagueSeasonForFormatting = Pick<
  dbLeagueSeasonWithTeams,
  'id' | 'league' | 'divisionseason' | 'teamsseason'
> & {
  season?: dbLeagueSeasonWithTeams['season'];
};

export class LeagueResponseFormatter {
  static format(league: dbLeague): LeagueType {
    return {
      id: league.id.toString(),
      name: league.name,
      accountId: league.accountid.toString(),
    };
  }

  static formatMany(leagues: dbLeague[]): LeagueType[] {
    return leagues.map((league) => this.format(league));
  }

  static formatLeagueSetup(
    leagueSeasons: dbLeagueSeasonWithTeams[],
    options: LeagueSetupFormatOptions,
  ): LeagueSetupType {
    const leagueSeasonResponses = leagueSeasons.map((leagueSeason) =>
      this.buildLeagueSeasonWithTeams(leagueSeason, options),
    );

    const firstSeason = leagueSeasons[0]?.season;
    const season = firstSeason
      ? {
          id: firstSeason.id.toString(),
          name: firstSeason.name,
          accountId: firstSeason.accountid.toString(),
        }
      : undefined;

    return {
      season,
      leagueSeasons: leagueSeasonResponses,
    };
  }

  static formatLeagueSeasonDetails(
    leagueSeason: dbLeagueSeasonWithDivisionDetails,
    accountId: bigint,
  ): LeagueSeasonWithDivisionTeamsAndUnassignedType {
    const payload: LeagueSeasonForFormatting = {
      id: leagueSeason.id,
      league: leagueSeason.league,
      divisionseason: leagueSeason.divisionseason,
      teamsseason: leagueSeason.teamsseason,
    };

    return this.buildLeagueSeasonWithTeams(payload, {
      includeTeams: true,
      includeUnassignedTeams: true,
      includePlayerCount: false,
      includeManagerCount: false,
      accountId,
    });
  }

  static formatLeagueSeasonSummary(data: {
    leagueSeasonId: bigint;
    leagueId: bigint;
    leagueName: string;
    seasonId: bigint;
    seasonName: string;
  }): LeagueSeasonType {
    return {
      id: data.leagueSeasonId.toString(),
      league: {
        id: data.leagueId.toString(),
        name: data.leagueName,
      },
      season: {
        id: data.seasonId.toString(),
        name: data.seasonName,
      },
    };
  }

  static formatDivisionSeasons(
    accountId: bigint,
    divisions: dbDivisionSeasonWithTeams[],
  ): DivisionSeasonWithTeamsType[] {
    return divisions.map((division) =>
      this.buildDivisionSeason(division, accountId, {
        includePlayerCount: false,
        includeManagerCount: false,
      }),
    );
  }

  static formatDivisionSeason(division: dbDivisionSeasonWithDefinition): DivisionSeasonType {
    return {
      id: division.id.toString(),
      division: {
        id: division.divisionid.toString(),
        name: division.divisiondefs.name,
      },
      priority: division.priority,
    };
  }

  static formatLeagueSeasonGames(
    games: dbScheduleGameWithDetails[],
    teamNames: Map<string, string>,
  ): GameType[] {
    return ScheduleResponseFormatter.formatGamesList(games, teamNames);
  }

  private static buildLeagueSeasonWithTeams(
    leagueSeason: LeagueSeasonForFormatting,
    options: LeagueSetupFormatOptions,
  ): LeagueSeasonWithDivisionTeamsAndUnassignedType {
    const accountId = options.accountId;

    const response: LeagueSeasonWithDivisionTeamsAndUnassignedType = {
      id: leagueSeason.id.toString(),
      league: {
        id: leagueSeason.league.id.toString(),
        name: leagueSeason.league.name,
      },
    };

    if (options.includeTeams) {
      const divisions = (leagueSeason.divisionseason ?? []).map((divisionSeason) =>
        this.buildDivisionSeason(divisionSeason, accountId, options),
      );

      if (divisions.length) {
        response.divisions = divisions;
      }

      if (options.includeUnassignedTeams) {
        const unassignedTeams = (leagueSeason.teamsseason ?? []).filter(
          (teamSeason) => !teamSeason.divisionseasonid,
        );

        if (unassignedTeams.length) {
          response.unassignedTeams = unassignedTeams.map((teamSeason) =>
            this.buildTeamSeason(teamSeason, accountId, options),
          );
        }
      }
    }

    return response;
  }

  private static buildDivisionSeason(
    divisionSeason: dbDivisionSeasonWithTeams,
    accountId: bigint,
    options: TeamCountOptions,
  ): DivisionSeasonWithTeamsType {
    const formatted: DivisionSeasonWithTeamsType = {
      id: divisionSeason.id.toString(),
      division: {
        id: divisionSeason.divisiondefs.id.toString(),
        name: divisionSeason.divisiondefs.name,
      },
      priority: divisionSeason.priority,
      teams: (divisionSeason.teamsseason ?? []).map((teamSeason) =>
        this.buildTeamSeason(teamSeason, accountId, options),
      ),
    };

    return formatted;
  }

  private static buildTeamSeason(
    teamSeason: {
      id: bigint;
      name: string;
      teams: {
        id: bigint;
        webaddress: string | null;
        youtubeuserid: string | null;
        defaultvideo: string | null;
        autoplayvideo: boolean;
      };
    },
    accountId: bigint,
    options: TeamCountOptions,
  ): TeamSeasonWithPlayerCountType {
    const teamSeasonId = teamSeason.id.toString();
    const teamId = teamSeason.teams.id.toString();

    const response: TeamSeasonWithPlayerCountType = {
      id: teamSeasonId,
      name: teamSeason.name,
      team: {
        id: teamId,
        webAddress: teamSeason.teams.webaddress,
        youtubeUserId: teamSeason.teams.youtubeuserid,
        defaultVideo: teamSeason.teams.defaultvideo,
        autoPlayVideo: teamSeason.teams.autoplayvideo,
        logoUrl: getLogoUrl(accountId.toString(), teamId),
      },
    };

    if (options.includePlayerCount) {
      const playerCount = options.playerCounts?.get(teamSeasonId) ?? 0;
      response.playerCount = playerCount;
    }

    if (options.includeManagerCount) {
      const managerCount = options.managerCounts?.get(teamSeasonId) ?? 0;
      response.managerCount = managerCount;
    }

    return response;
  }
}
