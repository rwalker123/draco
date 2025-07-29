// Team-related Type Definitions for Draco Sports Manager

export interface TeamSeason {
  id: bigint;
  teamid: bigint;
  name: string;
  divisionseasonid: bigint | null;
  teams: {
    id: bigint;
    webaddress: string | null;
    youtubeuserid: string | null;
    defaultvideo: string | null;
    autoplayvideo: boolean;
  };
}
