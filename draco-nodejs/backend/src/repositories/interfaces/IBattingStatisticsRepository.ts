import {
  dbBattingStatisticsRow,
  dbPlayerTeamAssignment,
  dbPlayerCareerBattingRow,
} from '../types/dbTypes.js';

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
  findAllTimeTeamBattingStatistics(
    masterTeamId: bigint,
    sortField: string,
    sortOrder: 'asc' | 'desc',
    pageSize: number,
    minAtBats: number,
  ): Promise<dbBattingStatisticsRow[]>;
  findTeamsForPlayers(
    playerIds: bigint[],
    query: PlayerTeamsQueryOptions,
  ): Promise<dbPlayerTeamAssignment[]>;
  findPlayerCareerBattingStats(
    accountId: bigint,
    playerId: bigint,
  ): Promise<dbPlayerCareerBattingRow[]>;
}
