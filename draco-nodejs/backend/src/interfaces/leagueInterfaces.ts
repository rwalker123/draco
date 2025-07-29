// League-related Type Definitions for Draco Sports Manager

import { DivisionSeasonWithTeams } from './divisionInterfaces';
import { TeamSeason } from './teamInterfaces';

export interface LeagueSeasonWithRelations {
  id: bigint;
  league: {
    id: bigint;
    name: string;
    accountid: bigint;
  };
  divisionseason?: DivisionSeasonWithTeams[];
  teamsseason?: TeamSeason[];
}

export interface PrismaWhereClause {
  leagueid: bigint;
  gamedate?: {
    gte: Date;
    lte: Date;
  };
  OR?: Array<
    | {
        hteamid: bigint;
      }
    | {
        vteamid: bigint;
      }
  >;
}
