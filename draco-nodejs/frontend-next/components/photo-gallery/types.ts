export interface TeamAlbumHierarchyTeam {
  teamId: string;
  teamSeasonId?: string;
  teamName: string;
  albumId: string;
  photoCount: number;
}

export interface TeamAlbumHierarchyDivision {
  id: string;
  name: string;
  teams: TeamAlbumHierarchyTeam[];
}

export interface TeamAlbumHierarchyGroup {
  leagueId: string;
  leagueName: string;
  divisions: TeamAlbumHierarchyDivision[];
  unassignedTeams: TeamAlbumHierarchyTeam[];
}
