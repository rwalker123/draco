import type { ComponentType } from 'react';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { Game, Field, Umpire } from '@/types/schedule';
import type { TeamSeasonType } from '@draco/shared-schemas';

export interface ScheduleLocation {
  id: string;
  name: string;
  shortName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
}

export interface ScheduleOfficial {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
}

export interface LoadGamesParams {
  accountId: string;
  seasonId: string;
  startDate: Date;
  endDate: Date;
  apiClient: Client;
}

export interface LoadLocationsParams {
  accountId: string;
  apiClient: Client;
}

export interface LoadOfficialsParams {
  accountId: string;
  apiClient: Client;
}

export interface GameDialogProps {
  // Dialog state
  open: boolean;
  mode: 'create' | 'edit';

  // Data
  accountId: string;
  timeZone: string;
  leagues: Array<{ id: string; name: string }>;
  locations: ScheduleLocation[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;
  selectedGame?: Game | null;

  // Defaults for create mode
  defaultLeagueSeasonId?: string;
  defaultGameDate?: Date;

  // Permissions
  canEditSchedule: boolean;

  // Callbacks
  onClose: () => void;
  onSuccess: (result: { message: string; game?: Game }) => void;
  onError: (error: string) => void;
  onDelete?: () => void;

  // Sport-specific extensions (optional, used by baseball)
  officials?: ScheduleOfficial[];
}

export interface ScoreEntryDialogProps {
  open: boolean;
  accountId: string;
  selectedGame: Game | null;
  timeZone: string;
  onClose: () => void;
  onSuccess?: (payload: { game: Game; message: string }) => void;
  onError?: (message: string) => void;
  getTeamName: (teamId: string) => string;
}

export interface CreateGameParams {
  accountId: string;
  seasonId: string;
  leagueSeasonId: string;
  data: unknown;
  apiClient: Client;
}

export interface UpdateGameParams {
  accountId: string;
  gameId: string;
  data: unknown;
  apiClient: Client;
}

export interface DeleteGameParams {
  accountId: string;
  seasonId: string;
  gameId: string;
  apiClient: Client;
}

export interface SportScheduleAdapter {
  sportType: string;

  locationLabel: string;
  hasOfficials: boolean;
  officialLabel?: string;

  loadLocations: (params: LoadLocationsParams) => Promise<ScheduleLocation[]>;
  loadOfficials?: (params: LoadOfficialsParams) => Promise<ScheduleOfficial[]>;
  loadGames: (params: LoadGamesParams) => Promise<Game[]>;

  createGame: (params: CreateGameParams) => Promise<Game>;
  updateGame: (params: UpdateGameParams) => Promise<Game>;
  deleteGame: (params: DeleteGameParams) => Promise<void>;

  GameDialog: ComponentType<GameDialogProps>;
  ScoreEntryDialog: ComponentType<ScoreEntryDialogProps>;
}

export function mapFieldToLocation(field: Field): ScheduleLocation {
  return {
    id: field.id,
    name: field.name,
    shortName: field.shortName,
    address: field.address,
    city: field.city,
    state: field.state,
    zipCode: field.zipCode,
    latitude: field.latitude,
    longitude: field.longitude,
  };
}

export function mapUmpireToOfficial(umpire: Umpire): ScheduleOfficial {
  return {
    id: umpire.id,
    contactId: umpire.contactId,
    firstName: umpire.firstName,
    lastName: umpire.lastName,
    email: umpire.email,
    displayName: umpire.displayName,
  };
}
