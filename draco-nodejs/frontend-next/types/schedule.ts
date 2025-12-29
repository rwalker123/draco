import { GameCardData } from '@/components/GameCard';

// Core data types
export interface Game {
  id: string;
  gameDate: string;
  homeTeamId: string;
  visitorTeamId: string;
  homeScore: number;
  visitorScore: number;
  comment: string;
  fieldId?: string;
  field?: {
    id: string;
    name: string;
    shortName: string;
    address: string;
    city: string;
    state: string;
  };
  teeId?: string;
  tee?: {
    id: string;
    teeName: string;
    teeColor: string;
  };
  gameStatus: number;
  gameStatusText: string;
  gameStatusShortText: string;
  gameType: number;
  hasGameRecap?: boolean;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
  league: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
}

export interface Team {
  id: string;
  teamId?: string;
  name: string;
  teamName?: string;
  logoUrl?: string;
  webAddress?: string;
  youtubeUserId?: string;
  defaultVideo?: string;
  autoPlayVideo?: boolean;
  seasonName?: string;
  leagueName?: string;
  divisionName?: string;
}

export interface Field {
  id: string;
  name: string;
  shortName: string;
  comment: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  directions: string;
  rainoutNumber: string;
  latitude: string;
  longitude: string;
}

export interface Umpire {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
}

export interface League {
  id: string;
  name: string;
}

// Enum definitions
export enum GameStatus {
  Scheduled = 0,
  Completed = 1,
  Rainout = 2,
  Postponed = 3,
  Forfeit = 4,
  DidNotReport = 5,
}

export enum GameType {
  RegularSeason = 0,
  Playoff = 1,
  Exhibition = 2,
}

// View and filter types
export type ViewMode = 'calendar' | 'list';
export type FilterType = 'day' | 'week' | 'month' | 'year';

// State management types
export interface DialogStates {
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  gameResultsDialogOpen: boolean;
  keepDialogOpen: boolean;
}

export interface GameFormState {
  gameDate: Date | null;
  gameTime: Date | null;
  homeTeamId: string;
  visitorTeamId: string;
  fieldId: string;
  comment: string;
  gameType: number;
  umpire1: string;
  umpire2: string;
  umpire3: string;
  umpire4: string;
}

export interface FilterState {
  filterType: FilterType;
  filterDate: Date;
  filterLeagueSeasonId: string;
  filterTeamSeasonId: string;
}

export interface ViewState {
  viewMode: ViewMode;
  startDate: Date;
  endDate: Date;
  isNavigating: boolean;
}

export interface LoadingState {
  loadingGames: boolean;
  loadingStaticData: boolean;
}

export interface ErrorState {
  error: string | null;
  success: string | null;
}

// GameDialog grouped prop types
// Component prop types
export interface ScheduleManagementProps {
  accountId: string;
}

export interface ViewComponentProps {
  filteredGames: Game[];
  canEditSchedule: boolean;
  onEditGame: (game: Game) => void;
  onGameResults: (game: Game) => void;
  onEditRecap?: (game: Game) => void;
  onViewRecap?: (game: Game) => void;
  convertGameToGameCardData: (game: Game) => GameCardData;
  timeZone: string;
  filterType: FilterType;
  filterDate: Date;
  setFilterType: (type: FilterType) => void;
  setFilterDate: (date: Date) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
  isNavigating?: boolean;
  navigateToWeek?: (direction: 'prev' | 'next') => void;
  navigate?: (direction: NavigationDirection, type?: FilterType) => void;
  loadingGames: boolean;
  canEditRecap?: (game: GameCardData) => boolean;
}

export interface DialogComponentProps {
  open: boolean;
  onClose: () => void;
  selectedGame?: Game | null;
  getTeamName: (teamId: string) => string;
}

export interface FilterComponentProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

// Navigation types
export type NavigationDirection = 'prev' | 'next';
