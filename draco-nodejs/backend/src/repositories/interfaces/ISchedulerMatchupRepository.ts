export interface ISchedulerMatchupRepository {
  listLeagueTeamsWithDivision(
    leagueSeasonIds: bigint[],
  ): Promise<
    Array<{ leagueseasonid: bigint; teamseasonid: bigint; divisionseasonid: bigint | null }>
  >;

  listLeagueSeasonIdsBySeasonAndAccount(seasonId: bigint, accountId: bigint): Promise<bigint[]>;
}
