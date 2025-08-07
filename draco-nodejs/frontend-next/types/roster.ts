import { Contact } from './users';

// Types for roster operations
export interface RosterFormData {
  playerNumber: number;
  submittedWaiver: boolean;
  submittedDriversLicense: boolean;
  firstYear: number;
}

export interface RosterPlayer {
  id: string;
  contactId: string;
  submittedDriversLicense: boolean;
  firstYear: number;
  contact: Contact; // Maps to backend RosterPlayer with ContactEntry
}

export interface RosterMember {
  id: string;
  playerNumber: number;
  inactive: boolean;
  submittedWaiver: boolean;
  dateAdded: string;
  player: RosterPlayer; // Contains RosterPlayer with full Contact
}

export interface TeamRosterData {
  teamSeason: {
    id: string;
    name: string;
  };
  rosterMembers: RosterMember[];
}

// Manager type matching backend's formatted response
export interface ManagerType {
  id: string;
  teamSeasonId: string; // Backend returns camelCase
  contact: Contact; // Backend returns nested contact object (not contacts)
}
