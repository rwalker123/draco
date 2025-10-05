import {
  LeagueSeasonWithDivisionType,
  SeasonParticipantCountDataType,
  SeasonType,
} from '@draco/shared-schemas';
import {
  dbLeagueSeasonBasic,
  dbSeason,
  dbSeasonWithLeagues,
} from '../repositories/index.js';

interface SeasonFormatOptions {
  includeDivisions: boolean;
  currentSeasonId?: bigint | null;
  forceCurrent?: boolean;
}

export class SeasonResponseFormatter {
  static formatSeasonsWithLeagues(
    seasons: dbSeasonWithLeagues[],
    options: SeasonFormatOptions,
  ): LeagueSeasonWithDivisionType[] {
    return seasons.map((season) => this.formatSeasonWithLeagues(season, options));
  }

  static formatSeasonWithLeagues(
    season: dbSeasonWithLeagues,
    { includeDivisions, currentSeasonId, forceCurrent }: SeasonFormatOptions,
  ): LeagueSeasonWithDivisionType {
    const isCurrent = forceCurrent
      ? true
      : currentSeasonId
      ? season.id === currentSeasonId
      : false;

    return {
      id: season.id.toString(),
      name: season.name,
      accountId: season.accountid.toString(),
      isCurrent,
      leagues: season.leagueseason.map((leagueSeason) => {
        const baseLeague = {
          id: leagueSeason.id.toString(),
          league: {
            id: leagueSeason.leagueid.toString(),
            name: leagueSeason.league.name,
          },
        };

        if (!includeDivisions || !leagueSeason.divisionseason) {
          return baseLeague;
        }

        return {
          ...baseLeague,
          divisions: leagueSeason.divisionseason.map((division) => ({
            id: division.id.toString(),
            division: {
              id: division.divisiondefs?.id.toString() ?? '0',
              name: division.divisiondefs?.name ?? 'Unknown Division',
            },
            priority: division.priority ?? 0,
          })),
        };
      }),
    };
  }

  static formatSeason(season: dbSeason, options?: { isCurrent?: boolean }): SeasonType {
    const result: SeasonType = {
      id: season.id.toString(),
      name: season.name,
      accountId: season.accountid.toString(),
    };

    if (typeof options?.isCurrent === 'boolean') {
      result.isCurrent = options.isCurrent;
    }

    return result;
  }

  static formatSeasonWithLeagueBasics(
    season: dbSeason,
    leagueSeasons: dbLeagueSeasonBasic[],
    options?: { isCurrent?: boolean },
  ): LeagueSeasonWithDivisionType {
    const formattedLeagues = leagueSeasons.map((leagueSeason) => ({
      id: leagueSeason.id.toString(),
      league: {
        id: leagueSeason.leagueid.toString(),
        name: leagueSeason.league.name,
      },
    }));

    return {
      ...this.formatSeason(season, options),
      isCurrent: options?.isCurrent ?? false,
      leagues: formattedLeagues,
    };
  }

  static formatParticipantCount(
    seasonId: bigint,
    participantCount: number,
  ): SeasonParticipantCountDataType {
    return {
      seasonId: seasonId.toString(),
      participantCount,
    };
  }
}
