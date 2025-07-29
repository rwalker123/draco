// Division-related Type Definitions for Draco Sports Manager

export interface DivisionSeasonWithTeams {
  id: bigint;
  divisionid: bigint;
  priority: number;
  divisiondefs: {
    id: bigint;
    name: string;
  };
}

export interface DivisionSeason {
  id: bigint;
  divisionid: bigint;
  priority: number;
  divisiondefs: {
    id: bigint;
    name: string;
  };
  teamsseason: Array<{
    id: bigint;
    teamid: bigint;
    name: string;
    teams: {
      id: bigint;
      webaddress: string | null;
      youtubeuserid: string | null;
      defaultvideo: string | null;
      autoplayvideo: boolean;
    };
  }>;
}
