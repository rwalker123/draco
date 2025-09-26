// Account-related interfaces and type definitions for Draco Sports Manager

// Utility types for account-related data
export interface AccountUrl {
  id: string;
  url: string;
}

// Field management types
export interface AccountField {
  id: string;
  name: string;
  address: string;
  accountId: string;
}

// Umpire management types
export interface AccountUmpire {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  displayName: string;
}

// Team and league summary types for account resources
export interface UserTeam {
  id: string;
  name: string;
  leagueName: string;
  logoUrl: string;
}

export interface AccountLeague {
  id: string;
  name: string;
  teamCount: number;
}
