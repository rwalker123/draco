/**
 * Scheduler problem specification types used by the internal solver endpoint.
 * These interfaces are intentionally self-contained so callers can provide all
 * necessary context without the solver reaching back into the database.
 */

export interface SchedulerSeasonConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  gameDurations?: {
    defaultMinutes?: number;
    weekendMinutes?: number;
    weekdayMinutes?: number;
  };
}

export interface SchedulerLeagueRef {
  id: string | number;
  name?: string;
}

export interface SchedulerTeam {
  id: string | number;
  teamSeasonId: string | number;
  divisionSeasonId?: string | number;
  league: SchedulerLeagueRef;
}

export interface SchedulerFieldProperties {
  hasLights?: boolean;
  maxParallelGames?: number;
}

export interface SchedulerField {
  id: string | number;
  name: string;
  properties?: SchedulerFieldProperties;
}

export interface SchedulerUmpire {
  id: string | number;
  name?: string;
  maxGamesPerDay?: number;
}

export interface SchedulerGameRequest {
  id: string | number;
  leagueSeasonId: string | number;
  homeTeamSeasonId: string | number;
  visitorTeamSeasonId: string | number;
  requiredUmpires?: number;
  preferredFieldIds?: Array<string | number>;
  earliestStart?: string;
  latestEnd?: string;
  durationMinutes?: number;
}

export interface SchedulerFieldSlot {
  id: string;
  fieldId: string | number;
  startTime: string;
  endTime: string;
}

export interface SchedulerAvailabilityWindow {
  startTime: string;
  endTime: string;
}

export interface SchedulerUmpireAvailability extends SchedulerAvailabilityWindow {
  umpireId: string | number;
}

export interface SchedulerTeamBlackout extends SchedulerAvailabilityWindow {
  teamSeasonId: string | number;
}

export interface SchedulerHardConstraints {
  respectTeamBlackouts?: boolean;
  respectUmpireAvailability?: boolean;
  respectFieldSlots?: boolean;
  maxGamesPerTeamPerDay?: number;
  maxGamesPerUmpirePerDay?: number;
  noTeamOverlap?: boolean;
  noUmpireOverlap?: boolean;
  noFieldOverlap?: boolean;
}

export interface SchedulerSoftConstraints {
  avoidBackToBackGames?: {
    enabled: boolean;
    minRestMinutes: number;
    weight?: number;
  };
  balanceEarlyVsLate?: {
    enabled: boolean;
    weight?: number;
  };
  spreadGamesAcrossDays?: {
    enabled: boolean;
    weight?: number;
  };
}

export interface SchedulerConstraints {
  hard?: SchedulerHardConstraints;
  soft?: SchedulerSoftConstraints;
}

export interface SchedulerObjectives {
  primary?: 'maximize_scheduled_games' | 'minimize_conflicts';
  secondary?: string[];
}

export interface SchedulerProblemSpec {
  season: SchedulerSeasonConfig;
  teams: SchedulerTeam[];
  fields: SchedulerField[];
  umpires: SchedulerUmpire[];
  games: SchedulerGameRequest[];
  fieldSlots: SchedulerFieldSlot[];
  umpireAvailability?: SchedulerUmpireAvailability[];
  teamBlackouts?: SchedulerTeamBlackout[];
  constraints?: SchedulerConstraints;
  objectives?: SchedulerObjectives;
  runId?: string;
}

export interface SchedulerAssignment {
  gameId: string | number;
  fieldId: string | number;
  startTime: string;
  endTime: string;
  umpireIds: Array<string | number>;
}

export interface SchedulerUnscheduledReason {
  gameId: string | number;
  reason: string;
}

export interface SchedulerMetrics {
  totalGames: number;
  scheduledGames: number;
  unscheduledGames: number;
  objectiveValue?: number;
}

export type SchedulerRunStatus = 'completed' | 'partial' | 'infeasible' | 'failed';

export interface SchedulerSolveResult {
  runId: string;
  status: SchedulerRunStatus;
  metrics: SchedulerMetrics;
  assignments: SchedulerAssignment[];
  unscheduled: SchedulerUnscheduledReason[];
}
