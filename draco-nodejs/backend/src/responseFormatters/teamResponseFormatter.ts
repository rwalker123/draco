import { teamsseason } from '@prisma/client';
import { getContactPhotoUrl, getLogoUrl } from '../config/logo.js';
import {
  dbTeam,
  dbTeamSeasonManagerContact,
  dbTeamSeasonRecord,
  dbTeamSeasonWithLeaguesAndTeams,
  dbTeamsWithLeaguesAndDivisions,
  dbTeamWithLeague,
  dbUserManagerTeams,
  dbUserTeams,
} from '../repositories/index.js';
import {
  TeamManagerWithTeamsType,
  TeamSeasonType,
  TeamSeasonNameType,
  TeamSeasonRecordType,
} from '@draco/shared-schemas';

export class TeamResponseFormatter {
  static formatAndCombineTeamsWithLeagueResponse(
    accountId: bigint,
    userTeams: dbUserTeams[],
    managedTeams: dbUserManagerTeams[],
  ): TeamSeasonType[] {
    // Combine and deduplicate teams
    const allTeams = [...userTeams, ...managedTeams];

    const uniqueTeams = new Map<string, TeamSeasonType>();

    allTeams.forEach((team) => {
      const teamSeason = team.teamsseason;

      const teamId = teamSeason.id.toString();
      if (!uniqueTeams.has(teamId)) {
        uniqueTeams.set(teamId, {
          id: teamId,
          name: teamSeason.name,
          team: {
            id: teamSeason.teams.id.toString(),
            logoUrl: getLogoUrl(accountId.toString(), teamSeason.teamid.toString()),
          },
          league: {
            id: teamSeason.leagueseason.id.toString(),
            name: teamSeason.leagueseason.league.name,
          },
        });
      }
    });

    return Array.from(uniqueTeams.values());
  }

  static formatTeamsWithLeaguesAndDivisions(
    accountId: bigint,
    teamsWithLeaguesAndDivisions: dbTeamsWithLeaguesAndDivisions[],
  ): TeamSeasonType[] {
    return teamsWithLeaguesAndDivisions.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      team: {
        id: team.teamid.toString(),
        webAddress: team.teams.webaddress,
        youtubeUserId: team.teams.youtubeuserid,
        defaultVideo: team.teams.defaultvideo,
        autoPlayVideo: team.teams.autoplayvideo,
        logoUrl: getLogoUrl(accountId.toString(), team.teamid.toString()),
      },
      league: {
        id: team.leagueseason.league.id.toString(),
        name: team.leagueseason.league.name,
      },
      division: team.divisionseason?.divisiondefs
        ? {
            id: team.divisionseason.divisiondefs.id.toString(),
            name: team.divisionseason.divisiondefs.name,
          }
        : undefined,
    }));
  }

  static formatTeamSeasonWithRecord(
    accountId: bigint,
    teamSeason: dbTeamSeasonWithLeaguesAndTeams,
    record: dbTeamSeasonRecord,
  ): TeamSeasonRecordType {
    return {
      id: teamSeason.id.toString(),
      name: teamSeason.name,
      team: {
        id: teamSeason.teamid.toString(),
        webAddress: teamSeason.teams?.webaddress || null,
        youtubeUserId: teamSeason.teams?.youtubeuserid || null,
        defaultVideo: teamSeason.teams?.defaultvideo || null,
        autoPlayVideo: teamSeason.teams?.autoplayvideo || false,
        logoUrl: getLogoUrl(accountId.toString(), teamSeason.teamid.toString()),
      },
      league: {
        id: teamSeason.leagueseason.league.id.toString(),
        name: teamSeason.leagueseason.league.name,
      },
      division: undefined, // Not included in details query currently
      season: {
        id: teamSeason.leagueseason?.season?.id?.toString() || 'unknown',
        name: teamSeason.leagueseason?.season?.name || 'Unknown Season',
        accountId: accountId.toString(),
      },
      record: {
        w: record.wins,
        l: record.losses,
        t: record.ties,
      },
    };
  }

  static formatTeamManagerWithTeams(
    accountId: bigint,
    teamManagersResult: dbTeamSeasonManagerContact[],
  ): TeamManagerWithTeamsType[] {
    // Group team managers by contact
    const teamManagersMap = new Map<string, TeamManagerWithTeamsType>();

    for (const row of teamManagersResult) {
      const contactId = row.contacts.id.toString();

      if (!teamManagersMap.has(contactId)) {
        teamManagersMap.set(contactId, {
          id: contactId,
          firstName: row.contacts.firstname,
          lastName: row.contacts.lastname,
          middleName: '', // Team manager queries don't include middle name
          email: row.contacts.email || undefined,
          photoUrl: getContactPhotoUrl(accountId.toString(), contactId),
          teams: [],
        });
      }

      const manager = teamManagersMap.get(contactId)!;
      manager.teams.push({
        teamSeasonId: row.teamsseason.id.toString(),
        teamName: row.teamsseason.name,
      });
    }

    const teamManagers = Array.from(teamManagersMap.values());
    return teamManagers;
  }

  static formatTeamSeasonName(teamSeason: teamsseason): TeamSeasonNameType {
    return {
      id: teamSeason.id.toString(),
      name: teamSeason.name,
    };
  }
  static formatTeamSeasonSummary(accountId: bigint, team: dbTeamWithLeague): TeamSeasonType {
    return {
      id: team.id.toString(),
      name: team.name,
      team: {
        id: team.teamid.toString(),
        webAddress: team.teams?.webaddress || null,
        youtubeUserId: team.teams?.youtubeuserid || null,
        defaultVideo: team.teams?.defaultvideo || null,
        autoPlayVideo: team.teams?.autoplayvideo || false,
        logoUrl: getLogoUrl(accountId.toString(), team.teamid.toString()),
      },
      division: undefined, // Not included in summary
      league: {
        id: team.leagueseason.league.id.toString(),
        name: team.leagueseason.league.name,
      },
    };
  }

  static formatTeamsResponse(accountId: bigint, teams: dbTeam[]): TeamSeasonType[] {
    return teams.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      team: {
        id: team.teamid.toString(),
        webAddress: team.teams?.webaddress || null,
        youtubeUserId: team.teams?.youtubeuserid || null,
        defaultVideo: team.teams?.defaultvideo || null,
        autoPlayVideo: team.teams?.autoplayvideo || false,
        logoUrl: getLogoUrl(accountId.toString(), team.teamid.toString()),
      },
      division: undefined, // Not included in this response
      league: undefined, // Not included in this response
    }));
  }
}
