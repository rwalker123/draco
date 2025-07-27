import { teamsseason, teams, leagueseason, divisionseason } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface ITeamRepository extends IBaseRepository<teamsseason> {
  findBySeasonId(seasonId: bigint, accountId: bigint): Promise<teamsseason[]>;
  findTeamSeasonWithLeague(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<{
    id: number;
    teamname: string;
    leagueseason: leagueseason & {
      leagues: { name: string };
      divisionseason: divisionseason[];
    };
  } | null>;
  findTeamDefinition(teamId: bigint): Promise<teams | null>;
}
