// Account-related interfaces and type definitions for Draco Sports Manager

// Account search and public display types
export interface AccountSearchResult {
  id: string;
  name: string;
  accountType?: string;
  firstYear: number | null;
  affiliation?: string;
  urls: { id: string; url: string }[];
}

export interface PublicAccountResponse {
  id: string;
  name: string;
  accountType?: string;
  accountTypeId: string;
  firstYear: number | null;
  affiliation?: { name: string; url: string } | null;
  timezoneId: string;
  twitterAccountName: string;
  facebookFanPage: string;
  urls: { id: string; url: string }[];
  accountLogoUrl: string;
}

export interface PublicSeasonResponse {
  id: string;
  name: string;
  isCurrent: boolean;
}

// Account management and listing types
export interface AccountListContact {
  userid: string;
  firstname: string;
  lastname: string;
  email: string | null;
}

export interface AccountListResponse {
  id: string;
  name: string;
  accountTypeId: string;
  accountType?: string;
  ownerUserId: string | null;
  ownerName: string;
  ownerEmail: string | null;
  firstYear: number | null;
  affiliationId: string;
  affiliation?: string;
  timezoneId: string;
  twitterAccountName: string;
  youtubeUserId: string | null;
  facebookFanPage: string | null;
  defaultVideo: string;
  autoPlayVideo: boolean;
  accountLogoUrl: string;
}

// Utility types for account-related data
export interface AccountAffiliation {
  id: bigint;
  name: string;
  url: string;
}

export interface AccountType {
  id: string;
  name: string;
  filePath: string;
}

export interface AccountUrl {
  id: string;
  url: string;
}

// Season-related types for accounts
export interface PublicSeason {
  id: bigint;
  name: string;
}

// Contact and user management types
// Re-export ContactSearchResult from contactInterfaces for backward compatibility
export { ContactSearchResult } from './contactInterfaces';

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
