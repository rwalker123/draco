import { dbPitchingStatisticsRow, dbPlayerTeamAssignment } from '../types/dbTypes.js';
import { PlayerTeamsQueryOptions } from './IBattingStatisticsRepository.js';

export interface PitchingStatisticsQueryOptions {
  leagueId?: bigint;
  divisionId?: bigint;
  teamId?: bigint;
  isHistorical: boolean;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  minInningsPitched: number;
  includeAllGameTypes: boolean;
}

export interface IPitchingStatisticsRepository {
  findPitchingStatistics(query: PitchingStatisticsQueryOptions): Promise<dbPitchingStatisticsRow[]>;
  findTeamsForPlayers(
    playerIds: bigint[],
    query: PlayerTeamsQueryOptions,
  ): Promise<dbPlayerTeamAssignment[]>;
}
