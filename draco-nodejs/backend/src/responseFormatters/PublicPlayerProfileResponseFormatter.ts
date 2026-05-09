import { PublicPlayerProfileType, PublicPlayerTeamAffiliationType } from '@draco/shared-schemas';
import {
  dbBaseContact,
  dbPlayerCurrentSeasonTeam,
  dbSeason,
} from '../repositories/types/dbTypes.js';
import { ContactResponseFormatter } from './responseFormatters.js';

export class PublicPlayerProfileResponseFormatter {
  static formatTeam(team: dbPlayerCurrentSeasonTeam): PublicPlayerTeamAffiliationType {
    return {
      teamSeasonId: team.teamSeasonId.toString(),
      teamId: team.teamId.toString(),
      seasonId: team.seasonId.toString(),
      leagueSeasonId: team.leagueSeasonId.toString(),
      leagueName: team.leagueName,
      teamName: team.teamName,
    };
  }

  static format(
    accountId: bigint,
    contact: dbBaseContact,
    currentSeason: dbSeason | null,
    teams: dbPlayerCurrentSeasonTeam[],
    hasCareerStatistics: boolean,
  ): PublicPlayerProfileType {
    return {
      contact: ContactResponseFormatter.formatPublicContactSummary(accountId, contact),
      currentSeason: currentSeason
        ? { id: currentSeason.id.toString(), name: currentSeason.name }
        : null,
      teams: teams.map((team) => this.formatTeam(team)),
      hasCareerStatistics,
    };
  }
}
