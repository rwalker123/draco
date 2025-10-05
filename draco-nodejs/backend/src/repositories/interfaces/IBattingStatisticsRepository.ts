import { dbBattingStatisticsRow, dbPlayerTeamAssignment } from '../types/dbTypes.js';

export interface BattingStatisticsQueryOptions {
  leagueId?: bigint;
  divisionId?: bigint;
  teamId?: bigint;
  isHistorical: boolean;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  minAtBats: number;
  includeAllGameTypes: boolean;
}

export interface PlayerTeamsQueryOptions {
  leagueId?: bigint;
  teamId?: bigint;
  isHistorical: boolean;
  includeAllGameTypes: boolean;
}

export interface IBattingStatisticsRepository {
  findBattingStatistics(query: BattingStatisticsQueryOptions): Promise<dbBattingStatisticsRow[]>;
  findTeamsForPlayers(
    playerIds: bigint[],
    query: PlayerTeamsQueryOptions,
  ): Promise<dbPlayerTeamAssignment[]>;
}
