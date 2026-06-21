import type {
  SchedulerAssignment,
  SchedulerConstraints,
  SchedulerFieldSlot,
  SchedulerFixedGame,
  SchedulerGameRequest,
  SchedulerHardConstraints,
  SchedulerLeagueExclusion,
  SchedulerProblemSpec,
  SchedulerSoftConstraints,
  SchedulerSolveResult,
  SchedulerTeamBlackout,
  SchedulerTeamExclusion,
  SchedulerUmpireAvailability,
  SchedulerUmpireExclusion,
  SchedulerUnscheduledReason,
  SchedulerSeasonExclusion,
} from '@draco/shared-schemas';
import crypto from 'node:crypto';
import { ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

const DEFAULT_BACK_TO_BACK_WEIGHT = 3;
const DEFAULT_SPREAD_WEIGHT = 2;
const DEFAULT_EARLY_LATE_WEIGHT = 1;
const EARLY_LATE_SPLIT_HOUR_LOCAL = 17;

interface Interval {
  start: Date;
  end: Date;
}

interface GameCandidateContext {
  game: SchedulerGameRequest;
  durationMinutes: number;
}

interface SlotCandidate {
  slot: SchedulerFieldSlot;
  start: Date;
  durationEnd: Date;
  umpireIds: string[];
}

const normalizeSchedulerId = (value: string | number): string => {
  return String(value).trim();
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

const buildDeterministicRunId = ({
  accountId,
  idempotencyKey,
  problemSpec,
}: {
  accountId?: bigint;
  idempotencyKey?: string;
  problemSpec: SchedulerProblemSpec;
}): string => {
  const hash = crypto.createHash('sha256');
  const accountPrefix = accountId ? `sched_account_${accountId.toString()}` : 'sched';

  if (idempotencyKey) {
    hash.update(`${accountPrefix}:key:${idempotencyKey}`);
    return `${accountPrefix}_${hash.digest('hex').slice(0, 16)}`;
  }

  const canonicalProblem = stableStringify({
    ...problemSpec,
    runId: undefined,
  });

  hash.update(`${accountPrefix}:spec:${canonicalProblem}`);
  return `${accountPrefix}_${hash.digest('hex').slice(0, 16)}`;
};

export class SchedulerEngineService {
  solve(
    problemSpec: SchedulerProblemSpec,
    context?: { accountId?: bigint; idempotencyKey?: string; timeZoneId?: string },
  ): SchedulerSolveResult {
    this.validateProblemSpec(problemSpec);

    const timeZoneId =
      context?.timeZoneId?.trim() ||
      problemSpec.constraints?.hard?.requireLightsAfter?.timeZone?.trim() ||
      'UTC';

    const runId =
      problemSpec.runId ??
      buildDeterministicRunId({
        accountId: context?.accountId,
        idempotencyKey: context?.idempotencyKey,
        problemSpec,
      });
    const assignments: SchedulerAssignment[] = [];
    const unscheduled: SchedulerUnscheduledReason[] = [];

    const hard = this.withDefaultHardConstraints(problemSpec.constraints);
    const soft = problemSpec.constraints?.soft;
    const availability = this.groupUmpireAvailability(
      problemSpec.umpireAvailability,
      problemSpec.umpires,
      problemSpec.season,
    );
    const seasonExclusions = this.groupSeasonExclusions(problemSpec.seasonExclusions);
    const teamExclusions = this.groupTeamExclusions(problemSpec.teamExclusions);
    const leagueExclusions = this.groupLeagueExclusions(problemSpec.leagueExclusions);
    const umpireExclusions = this.groupUmpireExclusions(problemSpec.umpireExclusions);
    const umpireDailyLimitById = this.buildUmpireDailyLimitIndex(problemSpec.umpires);
    const fieldCapacityById = this.buildFieldCapacityIndex(problemSpec.fields);
    const fieldLightsById = this.buildFieldLightsIndex(problemSpec.fields);
    const teamBlackouts = this.groupTeamBlackouts(problemSpec.teamBlackouts);

    const teamSchedule: Map<string, Interval[]> = new Map();
    const fieldSchedule: Map<string, Interval[]> = new Map();
    const umpireSchedule: Map<string, Interval[]> = new Map();
    const teamDailyCounts: Map<string, Map<string, number>> = new Map();
    const umpireDailyCounts: Map<string, Map<string, number>> = new Map();

    this.seedFixedOccupancy(
      problemSpec.fixedGames,
      { teamSchedule, fieldSchedule, umpireSchedule, teamDailyCounts, umpireDailyCounts },
      timeZoneId,
    );

    const sortedGames = [...problemSpec.games].sort((a, b) => {
      const aStart = a.earliestStart ? new Date(a.earliestStart).getTime() : 0;
      const bStart = b.earliestStart ? new Date(b.earliestStart).getTime() : 0;
      if (aStart === bStart) {
        return String(a.id).localeCompare(String(b.id));
      }
      return aStart - bStart;
    });

    const sortedSlots = [...problemSpec.fieldSlots].sort((a, b) => {
      const aStart = new Date(a.startTime).getTime();
      const bStart = new Date(b.startTime).getTime();
      if (aStart === bStart) {
        return String(a.fieldId).localeCompare(String(b.fieldId));
      }
      return aStart - bStart;
    });

    for (const game of sortedGames) {
      const durationMinutes = this.resolveGameDuration(game, problemSpec.season);
      const candidate: GameCandidateContext = { game, durationMinutes };
      const assignment = this.findAssignment(
        candidate,
        sortedSlots,
        hard,
        availability,
        seasonExclusions,
        teamBlackouts,
        teamExclusions,
        leagueExclusions,
        umpireExclusions,
        umpireDailyLimitById,
        fieldCapacityById,
        fieldLightsById,
        {
          teamSchedule,
          fieldSchedule,
          umpireSchedule,
          teamDailyCounts,
          umpireDailyCounts,
        },
        timeZoneId,
        soft,
      );

      if (assignment) {
        assignments.push(assignment);
      } else {
        unscheduled.push({
          gameId: game.id,
          reason: 'No valid slot found given hard constraints',
        });
      }
    }

    const metrics = {
      totalGames: problemSpec.games.length,
      scheduledGames: assignments.length,
      unscheduledGames: unscheduled.length,
      objectiveValue: assignments.length,
    };

    const status: SchedulerSolveResult['status'] =
      metrics.scheduledGames === metrics.totalGames
        ? 'completed'
        : metrics.scheduledGames > 0
          ? 'partial'
          : 'infeasible';

    return {
      runId,
      status,
      metrics,
      assignments,
      unscheduled,
    };
  }

  private withDefaultHardConstraints(constraints?: SchedulerConstraints): SchedulerHardConstraints {
    const defaults: SchedulerHardConstraints = {
      respectFieldSlots: true,
      respectTeamBlackouts: true,
      respectUmpireAvailability: true,
      maxGamesPerTeamPerDay: undefined,
      maxGamesPerUmpirePerDay: undefined,
    };

    return { ...defaults, ...(constraints?.hard ?? {}) };
  }

  private validateProblemSpec(problemSpec: SchedulerProblemSpec): void {
    if (!problemSpec.season) {
      throw new ValidationError('Season information is required');
    }

    if (!Array.isArray(problemSpec.games) || problemSpec.games.length === 0) {
      throw new ValidationError('At least one game is required');
    }

    if (!Array.isArray(problemSpec.fieldSlots) || problemSpec.fieldSlots.length === 0) {
      throw new ValidationError('At least one field slot is required');
    }

    const dateFields: Array<{ value?: string; name: string }> = [
      { value: problemSpec.season.startDate, name: 'season:startDate' },
      { value: problemSpec.season.endDate, name: 'season:endDate' },
    ];
    problemSpec.games.forEach((game) => {
      dateFields.push({ value: game.earliestStart, name: `game:${game.id}:earliestStart` });
      dateFields.push({ value: game.latestEnd, name: `game:${game.id}:latestEnd` });
    });
    problemSpec.fieldSlots.forEach((slot) => {
      dateFields.push({ value: slot.startTime, name: `fieldSlot:${slot.id}:start` });
      dateFields.push({ value: slot.endTime, name: `fieldSlot:${slot.id}:end` });
    });

    dateFields.forEach(({ value, name }) => {
      if (value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          throw new ValidationError(`Invalid date for ${name}`);
        }
      }
    });

    const seasonStart = new Date(problemSpec.season.startDate);
    const seasonEnd = new Date(problemSpec.season.endDate);
    if (seasonStart > seasonEnd) {
      throw new ValidationError('Season startDate must be before endDate');
    }

    this.ensureValidIntervals(problemSpec);
    this.ensureReferentialIntegrity(problemSpec);
  }

  private ensureValidIntervals(problemSpec: SchedulerProblemSpec): void {
    for (const game of problemSpec.games) {
      if (game.earliestStart && game.latestEnd) {
        const earliest = new Date(game.earliestStart);
        const latest = new Date(game.latestEnd);
        if (earliest >= latest) {
          throw new ValidationError(`Game ${game.id} earliestStart must be before latestEnd`);
        }
      }
    }

    for (const slot of problemSpec.fieldSlots) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      if (start >= end) {
        throw new ValidationError(`Field slot ${slot.id} startTime must be before endTime`);
      }
    }

    for (const blackout of problemSpec.teamBlackouts ?? []) {
      const start = new Date(blackout.startTime);
      const end = new Date(blackout.endTime);
      if (start >= end) {
        throw new ValidationError(
          `Team blackout ${blackout.teamSeasonId} startTime must be before endTime`,
        );
      }
    }

    for (const exclusion of problemSpec.seasonExclusions ?? []) {
      const start = new Date(exclusion.startTime);
      const end = new Date(exclusion.endTime);
      if (start >= end) {
        throw new ValidationError('Season exclusion startTime must be before endTime');
      }
    }

    for (const exclusion of problemSpec.teamExclusions ?? []) {
      const start = new Date(exclusion.startTime);
      const end = new Date(exclusion.endTime);
      if (start >= end) {
        throw new ValidationError(
          `Team exclusion ${exclusion.teamSeasonId} startTime must be before endTime`,
        );
      }
    }

    for (const exclusion of problemSpec.leagueExclusions ?? []) {
      const start = new Date(exclusion.startTime);
      const end = new Date(exclusion.endTime);
      if (start >= end) {
        throw new ValidationError(
          `League exclusion ${exclusion.id} (leagueSeason ${exclusion.leagueSeasonId}) startTime must be before endTime`,
        );
      }
    }

    for (const exclusion of problemSpec.umpireExclusions ?? []) {
      const start = new Date(exclusion.startTime);
      const end = new Date(exclusion.endTime);
      if (start >= end) {
        throw new ValidationError(
          `Umpire exclusion ${exclusion.umpireId} startTime must be before endTime`,
        );
      }
    }

    for (const availability of problemSpec.umpireAvailability ?? []) {
      const start = new Date(availability.startTime);
      const end = new Date(availability.endTime);
      if (start >= end) {
        throw new ValidationError(
          `Umpire availability ${availability.umpireId} startTime must be before endTime`,
        );
      }
    }
  }

  private ensureReferentialIntegrity(problemSpec: SchedulerProblemSpec): void {
    const teamSeasonIds = problemSpec.teams.map((team) => team.teamSeasonId);
    const fieldIds = problemSpec.fields.map((field) => field.id);
    const umpireIds = problemSpec.umpires.map((umpire) => normalizeSchedulerId(umpire.id));

    const duplicateTeamSeasonIds = this.collectDuplicates(teamSeasonIds);
    if (duplicateTeamSeasonIds.length) {
      throw new ValidationError(
        `Duplicate teamSeasonId values: ${duplicateTeamSeasonIds.join(', ')}`,
      );
    }

    const duplicateFieldIds = this.collectDuplicates(fieldIds);
    if (duplicateFieldIds.length) {
      throw new ValidationError(`Duplicate fieldId values: ${duplicateFieldIds.join(', ')}`);
    }

    const duplicateUmpireIds = this.collectDuplicates(umpireIds);
    if (duplicateUmpireIds.length) {
      throw new ValidationError(`Duplicate umpireId values: ${duplicateUmpireIds.join(', ')}`);
    }

    const teamSeasonIdSet = new Set(teamSeasonIds);
    const fieldIdSet = new Set(fieldIds);
    const umpireIdSet = new Set(umpireIds);

    for (const game of problemSpec.games) {
      if (!teamSeasonIdSet.has(game.homeTeamSeasonId)) {
        throw new ValidationError(
          `Unknown homeTeamSeasonId for game ${game.id}: ${game.homeTeamSeasonId}`,
        );
      }
      if (!teamSeasonIdSet.has(game.visitorTeamSeasonId)) {
        throw new ValidationError(
          `Unknown visitorTeamSeasonId for game ${game.id}: ${game.visitorTeamSeasonId}`,
        );
      }
      if (game.homeTeamSeasonId === game.visitorTeamSeasonId) {
        throw new ValidationError(`Game ${game.id} must reference two different teams`);
      }

      for (const preferredFieldId of game.preferredFieldIds ?? []) {
        if (!fieldIdSet.has(preferredFieldId)) {
          throw new ValidationError(
            `Unknown preferredFieldId for game ${game.id}: ${preferredFieldId}`,
          );
        }
      }
    }

    for (const slot of problemSpec.fieldSlots) {
      if (!fieldIdSet.has(slot.fieldId)) {
        throw new ValidationError(`Unknown fieldId for field slot ${slot.id}: ${slot.fieldId}`);
      }
    }

    for (const blackout of problemSpec.teamBlackouts ?? []) {
      if (!teamSeasonIdSet.has(blackout.teamSeasonId)) {
        throw new ValidationError(`Unknown teamSeasonId for blackout: ${blackout.teamSeasonId}`);
      }
    }

    for (const exclusion of problemSpec.teamExclusions ?? []) {
      if (!teamSeasonIdSet.has(exclusion.teamSeasonId)) {
        throw new ValidationError(
          `Unknown teamSeasonId for team exclusion: ${exclusion.teamSeasonId}`,
        );
      }
    }

    for (const availability of problemSpec.umpireAvailability ?? []) {
      if (!umpireIdSet.has(normalizeSchedulerId(availability.umpireId))) {
        throw new ValidationError(
          `Unknown umpireId for umpire availability: ${availability.umpireId}`,
        );
      }
    }

    for (const exclusion of problemSpec.umpireExclusions ?? []) {
      if (!umpireIdSet.has(normalizeSchedulerId(exclusion.umpireId))) {
        throw new ValidationError(`Unknown umpireId for umpire exclusion: ${exclusion.umpireId}`);
      }
    }
  }

  private collectDuplicates(values: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) {
        duplicates.add(value);
      } else {
        seen.add(value);
      }
    }
    return [...duplicates].sort((a, b) => a.localeCompare(b));
  }

  private resolveGameDuration(
    game: SchedulerGameRequest,
    season: SchedulerProblemSpec['season'],
  ): number {
    if (game.durationMinutes && game.durationMinutes > 0) {
      return game.durationMinutes;
    }

    const baseDuration = season.gameDurations?.defaultMinutes ?? 60;
    if (!game.earliestStart) {
      return baseDuration;
    }

    const date = new Date(game.earliestStart);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend && season.gameDurations?.weekendMinutes) {
      return season.gameDurations.weekendMinutes;
    }

    if (!isWeekend && season.gameDurations?.weekdayMinutes) {
      return season.gameDurations.weekdayMinutes;
    }

    return baseDuration;
  }

  private groupUmpireAvailability(
    availability: SchedulerUmpireAvailability[] | undefined,
    umpires: Array<{ id: string | number }>,
    season: SchedulerProblemSpec['season'],
  ): Map<string, Interval[]> {
    const map = new Map<string, Interval[]>();
    const windows =
      availability && availability.length
        ? availability.map((slot) => ({
            ...slot,
            umpireId: normalizeSchedulerId(slot.umpireId),
          }))
        : umpires.map((umpire) => ({
            umpireId: normalizeSchedulerId(umpire.id),
            startTime: DateUtils.normalizeDateOnlyToUtcDayStart(season.startDate),
            endTime: DateUtils.normalizeDateOnlyToUtcDayEnd(season.endDate),
          }));

    windows.forEach((slot) => {
      const parsed = this.toInterval(slot.startTime, slot.endTime);
      const list = map.get(slot.umpireId) ?? [];
      list.push(parsed);
      map.set(slot.umpireId, list);
    });
    return map;
  }

  private buildUmpireDailyLimitIndex(
    umpires: Array<{ id: string | number; maxGamesPerDay?: number }>,
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const umpire of umpires) {
      if (umpire.maxGamesPerDay !== undefined) {
        map.set(normalizeSchedulerId(umpire.id), umpire.maxGamesPerDay);
      }
    }
    return map;
  }

  private buildFieldCapacityIndex(
    fields: Array<{ id: string; properties?: { maxParallelGames?: number } }>,
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const field of fields) {
      const capacity = field.properties?.maxParallelGames;
      if (capacity !== undefined && Number.isFinite(capacity)) {
        map.set(field.id, Math.max(1, Math.floor(capacity)));
      }
    }
    return map;
  }

  private buildFieldLightsIndex(
    fields: Array<{ id: string; properties?: { hasLights?: boolean } }>,
  ): Map<string, boolean> {
    const map = new Map<string, boolean>();
    for (const field of fields) {
      map.set(field.id, field.properties?.hasLights === true);
    }
    return map;
  }

  private groupTeamBlackouts(blackouts?: SchedulerTeamBlackout[]): Map<string, Interval[]> {
    const map = new Map<string, Interval[]>();
    (blackouts ?? []).forEach((slot) => {
      const parsed = this.toInterval(slot.startTime, slot.endTime);
      const list = map.get(slot.teamSeasonId) ?? [];
      list.push(parsed);
      map.set(slot.teamSeasonId, list);
    });
    return map;
  }

  private groupSeasonExclusions(exclusions?: SchedulerSeasonExclusion[]): Interval[] {
    const enabled = (exclusions ?? []).filter((exclusion) => exclusion.enabled);
    return enabled.map((exclusion) => this.toInterval(exclusion.startTime, exclusion.endTime));
  }

  private groupTeamExclusions(exclusions?: SchedulerTeamExclusion[]): Map<string, Interval[]> {
    const map = new Map<string, Interval[]>();
    (exclusions ?? [])
      .filter((exclusion) => exclusion.enabled)
      .forEach((exclusion) => {
        const parsed = this.toInterval(exclusion.startTime, exclusion.endTime);
        const list = map.get(exclusion.teamSeasonId) ?? [];
        list.push(parsed);
        map.set(exclusion.teamSeasonId, list);
      });
    return map;
  }

  private groupLeagueExclusions(exclusions?: SchedulerLeagueExclusion[]): Map<string, Interval[]> {
    const map = new Map<string, Interval[]>();
    (exclusions ?? [])
      .filter((exclusion) => exclusion.enabled)
      .forEach((exclusion) => {
        const parsed = this.toInterval(exclusion.startTime, exclusion.endTime);
        const list = map.get(exclusion.leagueSeasonId) ?? [];
        list.push(parsed);
        map.set(exclusion.leagueSeasonId, list);
      });
    return map;
  }

  private groupUmpireExclusions(exclusions?: SchedulerUmpireExclusion[]): Map<string, Interval[]> {
    const map = new Map<string, Interval[]>();
    (exclusions ?? [])
      .filter((exclusion) => exclusion.enabled)
      .forEach((exclusion) => {
        const umpireId = normalizeSchedulerId(exclusion.umpireId);
        const parsed = this.toInterval(exclusion.startTime, exclusion.endTime);
        const list = map.get(umpireId) ?? [];
        list.push(parsed);
        map.set(umpireId, list);
      });
    return map;
  }

  private toInterval(start: string, end: string): Interval {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid date in interval');
    }

    return { start: startDate, end: endDate };
  }

  private buildSlotCandidate(
    slot: SchedulerFieldSlot,
    candidate: GameCandidateContext,
    constraints: SchedulerHardConstraints,
    availability: Map<string, Interval[]>,
    seasonExclusions: Interval[],
    teamBlackouts: Map<string, Interval[]>,
    teamExclusions: Map<string, Interval[]>,
    leagueExclusions: Map<string, Interval[]>,
    umpireExclusions: Map<string, Interval[]>,
    umpireDailyLimitById: Map<string, number>,
    fieldCapacityById: Map<string, number>,
    fieldLightsById: Map<string, boolean>,
    schedules: {
      teamSchedule: Map<string, Interval[]>;
      fieldSchedule: Map<string, Interval[]>;
      umpireSchedule: Map<string, Interval[]>;
      teamDailyCounts: Map<string, Map<string, number>>;
      umpireDailyCounts: Map<string, Map<string, number>>;
    },
    timeZoneId: string,
  ): SlotCandidate | null {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);

    const durationEnd = new Date(start.getTime() + candidate.durationMinutes * 60000);
    if (durationEnd > end) {
      return null;
    }

    if (
      seasonExclusions.some((exclusion) => this.overlaps(exclusion, { start, end: durationEnd }))
    ) {
      return null;
    }

    if (this.intersectsTeamExclusion(candidate.game, start, durationEnd, teamExclusions)) {
      return null;
    }

    if (this.intersectsLeagueExclusion(candidate.game, start, durationEnd, leagueExclusions)) {
      return null;
    }

    if (!this.slotWithinGameWindow(candidate.game, start, durationEnd)) {
      return null;
    }

    if (
      constraints.respectTeamBlackouts &&
      this.intersectsBlackout(candidate.game, start, durationEnd, teamBlackouts)
    ) {
      return null;
    }

    if (this.violatesLightsRequirement(slot.fieldId, start, constraints, fieldLightsById)) {
      return null;
    }

    if (
      this.hasFieldCapacityConflict(
        slot.fieldId,
        start,
        durationEnd,
        schedules.fieldSchedule,
        fieldCapacityById.get(slot.fieldId) ?? 1,
      )
    ) {
      return null;
    }

    if (
      this.hasConflict(
        candidate.game.homeTeamSeasonId,
        start,
        durationEnd,
        schedules.teamSchedule,
      ) ||
      this.hasConflict(
        candidate.game.visitorTeamSeasonId,
        start,
        durationEnd,
        schedules.teamSchedule,
      )
    ) {
      return null;
    }

    const umpireIds = this.selectUmpires(
      candidate.game,
      start,
      durationEnd,
      constraints,
      availability,
      umpireExclusions,
      umpireDailyLimitById,
      schedules.umpireSchedule,
      schedules.umpireDailyCounts,
      timeZoneId,
    );

    if (!umpireIds) {
      return null;
    }

    if (
      constraints.maxGamesPerTeamPerDay !== undefined &&
      !this.withinDailyLimit(
        candidate.game.homeTeamSeasonId,
        start,
        constraints.maxGamesPerTeamPerDay,
        schedules.teamDailyCounts,
        timeZoneId,
      )
    ) {
      return null;
    }

    if (
      constraints.maxGamesPerTeamPerDay !== undefined &&
      !this.withinDailyLimit(
        candidate.game.visitorTeamSeasonId,
        start,
        constraints.maxGamesPerTeamPerDay,
        schedules.teamDailyCounts,
        timeZoneId,
      )
    ) {
      return null;
    }

    return { slot, start, durationEnd, umpireIds };
  }

  private commitBooking(
    cand: SlotCandidate,
    game: SchedulerGameRequest,
    schedules: {
      teamSchedule: Map<string, Interval[]>;
      fieldSchedule: Map<string, Interval[]>;
      umpireSchedule: Map<string, Interval[]>;
      teamDailyCounts: Map<string, Map<string, number>>;
      umpireDailyCounts: Map<string, Map<string, number>>;
    },
    timeZoneId: string,
  ): void {
    this.addBooking(cand.slot.fieldId, cand.start, cand.durationEnd, schedules.fieldSchedule);
    this.addBooking(game.homeTeamSeasonId, cand.start, cand.durationEnd, schedules.teamSchedule);
    this.addBooking(game.visitorTeamSeasonId, cand.start, cand.durationEnd, schedules.teamSchedule);
    this.incrementDailyCount(
      game.homeTeamSeasonId,
      cand.start,
      schedules.teamDailyCounts,
      timeZoneId,
    );
    this.incrementDailyCount(
      game.visitorTeamSeasonId,
      cand.start,
      schedules.teamDailyCounts,
      timeZoneId,
    );
    for (const umpireId of cand.umpireIds) {
      this.addBooking(umpireId, cand.start, cand.durationEnd, schedules.umpireSchedule);
      this.incrementDailyCount(umpireId, cand.start, schedules.umpireDailyCounts, timeZoneId);
    }
  }

  private findAssignment(
    candidate: GameCandidateContext,
    sortedSlots: SchedulerFieldSlot[],
    constraints: SchedulerHardConstraints,
    availability: Map<string, Interval[]>,
    seasonExclusions: Interval[],
    teamBlackouts: Map<string, Interval[]>,
    teamExclusions: Map<string, Interval[]>,
    leagueExclusions: Map<string, Interval[]>,
    umpireExclusions: Map<string, Interval[]>,
    umpireDailyLimitById: Map<string, number>,
    fieldCapacityById: Map<string, number>,
    fieldLightsById: Map<string, boolean>,
    schedules: {
      teamSchedule: Map<string, Interval[]>;
      fieldSchedule: Map<string, Interval[]>;
      umpireSchedule: Map<string, Interval[]>;
      teamDailyCounts: Map<string, Map<string, number>>;
      umpireDailyCounts: Map<string, Map<string, number>>;
    },
    timeZoneId: string,
    soft?: SchedulerSoftConstraints,
  ): SchedulerAssignment | undefined {
    const preferredFields = candidate.game.preferredFieldIds ?? [];
    const preferredFieldSet = preferredFields.length ? new Set(preferredFields) : undefined;
    const passes = preferredFieldSet
      ? [
          sortedSlots.filter((slot) => preferredFieldSet.has(slot.fieldId)),
          sortedSlots.filter((slot) => !preferredFieldSet.has(slot.fieldId)),
        ]
      : [sortedSlots];

    const softActive = this.hasActiveSoftConstraints(soft);

    for (const slots of passes) {
      let best: SlotCandidate | undefined;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const slot of slots) {
        const cand = this.buildSlotCandidate(
          slot,
          candidate,
          constraints,
          availability,
          seasonExclusions,
          teamBlackouts,
          teamExclusions,
          leagueExclusions,
          umpireExclusions,
          umpireDailyLimitById,
          fieldCapacityById,
          fieldLightsById,
          schedules,
          timeZoneId,
        );
        if (!cand) {
          continue;
        }

        if (!softActive) {
          best = cand;
          break;
        }

        const score = this.scoreCandidate(
          candidate.game,
          cand.start,
          cand.durationEnd,
          soft,
          schedules.teamSchedule,
          timeZoneId,
        );
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      }

      if (best) {
        this.commitBooking(best, candidate.game, schedules, timeZoneId);
        return {
          gameId: candidate.game.id,
          fieldId: best.slot.fieldId,
          startTime: best.start.toISOString(),
          endTime: best.durationEnd.toISOString(),
          umpireIds: best.umpireIds,
        };
      }
    }

    return undefined;
  }

  private hasActiveSoftConstraints(soft: SchedulerSoftConstraints | undefined): boolean {
    if (!soft) {
      return false;
    }
    return (
      soft.avoidBackToBackGames?.enabled === true ||
      soft.balanceEarlyVsLate?.enabled === true ||
      soft.spreadGamesAcrossDays?.enabled === true
    );
  }

  private isEarlySlot(date: Date, timeZoneId: string): boolean {
    const hour = DateUtils.getHourInTimeZone(date, timeZoneId);
    const effectiveHour = hour !== null ? hour : date.getUTCHours();
    return effectiveHour < EARLY_LATE_SPLIT_HOUR_LOCAL;
  }

  private scoreCandidate(
    game: SchedulerGameRequest,
    start: Date,
    end: Date,
    soft: SchedulerSoftConstraints | undefined,
    teamSchedule: Map<string, Interval[]>,
    timeZoneId: string,
  ): number {
    let penalty = 0;
    const teams = [game.homeTeamSeasonId, game.visitorTeamSeasonId];

    for (const team of teams) {
      const bookings = teamSchedule.get(team) ?? [];

      if (soft?.avoidBackToBackGames?.enabled && soft.avoidBackToBackGames.minRestMinutes > 0) {
        const weight = soft.avoidBackToBackGames.weight ?? DEFAULT_BACK_TO_BACK_WEIGHT;
        const minRest = soft.avoidBackToBackGames.minRestMinutes;
        let minGap = Number.POSITIVE_INFINITY;
        for (const booking of bookings) {
          const gapAfterBooking = (start.getTime() - booking.end.getTime()) / 60000;
          const gapBeforeBooking = (booking.start.getTime() - end.getTime()) / 60000;
          const gap = Math.min(
            gapAfterBooking >= 0 ? gapAfterBooking : Number.POSITIVE_INFINITY,
            gapBeforeBooking >= 0 ? gapBeforeBooking : Number.POSITIVE_INFINITY,
          );
          if (gap < minGap) {
            minGap = gap;
          }
        }
        if (minGap !== Number.POSITIVE_INFINITY && minGap < minRest) {
          penalty += weight * ((minRest - minGap) / minRest);
        }
      }

      if (soft?.spreadGamesAcrossDays?.enabled) {
        const weight = soft.spreadGamesAcrossDays.weight ?? DEFAULT_SPREAD_WEIGHT;
        const candidateDayKey = this.formatDayKeyInTimeZone(start, timeZoneId);
        const sameDayCount = bookings.filter(
          (booking) => this.formatDayKeyInTimeZone(booking.start, timeZoneId) === candidateDayKey,
        ).length;
        penalty += weight * sameDayCount;
      }

      if (soft?.balanceEarlyVsLate?.enabled) {
        const weight = soft.balanceEarlyVsLate.weight ?? DEFAULT_EARLY_LATE_WEIGHT;
        const candidateIsEarly = this.isEarlySlot(start, timeZoneId);
        let earlyCount = 0;
        let lateCount = 0;
        for (const booking of bookings) {
          if (this.isEarlySlot(booking.start, timeZoneId)) {
            earlyCount += 1;
          } else {
            lateCount += 1;
          }
        }
        const sameSide = candidateIsEarly ? earlyCount : lateCount;
        const otherSide = candidateIsEarly ? lateCount : earlyCount;
        penalty += weight * Math.max(0, sameSide - otherSide);
      }
    }

    return penalty;
  }

  private violatesLightsRequirement(
    fieldId: string,
    slotStart: Date,
    constraints: SchedulerHardConstraints,
    fieldLightsById: Map<string, boolean>,
  ): boolean {
    const rule = constraints.requireLightsAfter;
    if (!rule?.enabled) {
      return false;
    }

    const hour = DateUtils.getHourInTimeZone(slotStart, rule.timeZone);
    if (hour === null) {
      throw new ValidationError('Invalid timeZone for requireLightsAfter constraint');
    }

    if (hour < rule.startHourLocal) {
      return false;
    }

    return fieldLightsById.get(fieldId) !== true;
  }

  private slotWithinGameWindow(
    game: SchedulerGameRequest,
    gameStart: Date,
    gameEnd: Date,
  ): boolean {
    if (game.earliestStart) {
      const earliest = new Date(game.earliestStart);
      if (gameStart < earliest) {
        return false;
      }
    }

    if (game.latestEnd) {
      const latest = new Date(game.latestEnd);
      if (gameEnd > latest) {
        return false;
      }
    }

    return true;
  }

  private intersectsBlackout(
    game: SchedulerGameRequest,
    start: Date,
    end: Date,
    teamBlackouts: Map<string, Interval[]>,
  ): boolean {
    const teams = [game.homeTeamSeasonId, game.visitorTeamSeasonId];
    for (const team of teams) {
      const blocks = teamBlackouts.get(team) ?? [];
      if (blocks.some((block) => this.overlaps(block, { start, end }))) {
        return true;
      }
    }
    return false;
  }

  private intersectsTeamExclusion(
    game: SchedulerGameRequest,
    start: Date,
    end: Date,
    teamExclusions: Map<string, Interval[]>,
  ): boolean {
    const teams = [game.homeTeamSeasonId, game.visitorTeamSeasonId];
    for (const team of teams) {
      const blocks = teamExclusions.get(team) ?? [];
      if (blocks.some((block) => this.overlaps(block, { start, end }))) {
        return true;
      }
    }
    return false;
  }

  private intersectsLeagueExclusion(
    game: SchedulerGameRequest,
    start: Date,
    end: Date,
    leagueExclusions: Map<string, Interval[]>,
  ): boolean {
    if (!game.leagueSeasonId) {
      return false;
    }
    const blocks = leagueExclusions.get(game.leagueSeasonId) ?? [];
    return blocks.some((block) => this.overlaps(block, { start, end }));
  }

  private selectUmpires(
    game: SchedulerGameRequest,
    start: Date,
    end: Date,
    constraints: SchedulerHardConstraints,
    availability: Map<string, Interval[]>,
    umpireExclusions: Map<string, Interval[]>,
    umpireDailyLimitById: Map<string, number>,
    umpireSchedule: Map<string, Interval[]>,
    umpireDailyCounts: Map<string, Map<string, number>>,
    timeZoneId: string,
  ): string[] | undefined {
    const required = game.requiredUmpires ?? 1;
    if (required === 0) {
      return [];
    }

    const availableUmpires: string[] = [];
    for (const [umpireId, slots] of availability.entries()) {
      const excluded = (umpireExclusions.get(umpireId) ?? []).some((block) =>
        this.overlaps(block, { start, end }),
      );
      if (excluded) {
        continue;
      }

      const hasAvailability =
        !constraints.respectUmpireAvailability ||
        slots.some((slot) => this.contains(slot, { start, end }));
      if (!hasAvailability) {
        continue;
      }

      if (this.hasConflict(umpireId, start, end, umpireSchedule)) {
        continue;
      }

      const perUmpireMax = umpireDailyLimitById.get(umpireId);
      const globalMax = constraints.maxGamesPerUmpirePerDay;
      const maxGamesPerDay =
        globalMax !== undefined && perUmpireMax !== undefined
          ? Math.min(globalMax, perUmpireMax)
          : (globalMax ?? perUmpireMax);
      if (
        maxGamesPerDay !== undefined &&
        !this.withinDailyLimit(umpireId, start, maxGamesPerDay, umpireDailyCounts, timeZoneId)
      ) {
        continue;
      }

      availableUmpires.push(umpireId);
      if (availableUmpires.length === required) {
        break;
      }
    }

    return availableUmpires.length === required ? availableUmpires : undefined;
  }

  private hasConflict(
    key: string,
    start: Date,
    end: Date,
    schedule: Map<string, Interval[]>,
  ): boolean {
    const bookings = schedule.get(key) ?? [];
    return bookings.some((existing) => this.overlaps(existing, { start, end }));
  }

  private hasFieldCapacityConflict(
    fieldId: string,
    start: Date,
    end: Date,
    schedule: Map<string, Interval[]>,
    capacity: number,
  ): boolean {
    const normalizedCapacity = Math.max(1, Math.floor(capacity));
    const bookings = schedule.get(fieldId) ?? [];
    const overlapping = bookings.reduce((count, existing) => {
      return this.overlaps(existing, { start, end }) ? count + 1 : count;
    }, 0);

    return overlapping >= normalizedCapacity;
  }

  private overlaps(a: Interval, b: Interval): boolean {
    return a.start < b.end && b.start < a.end;
  }

  private contains(container: Interval, target: Interval): boolean {
    return container.start <= target.start && container.end >= target.end;
  }

  private seedFixedOccupancy(
    fixedGames: SchedulerFixedGame[] | undefined,
    schedules: {
      teamSchedule: Map<string, Interval[]>;
      fieldSchedule: Map<string, Interval[]>;
      umpireSchedule: Map<string, Interval[]>;
      teamDailyCounts: Map<string, Map<string, number>>;
      umpireDailyCounts: Map<string, Map<string, number>>;
    },
    timeZoneId: string,
  ): void {
    for (const fixed of fixedGames ?? []) {
      const start = new Date(fixed.startTime);
      const end = new Date(fixed.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        continue;
      }
      if (fixed.fieldId) {
        this.addBooking(fixed.fieldId, start, end, schedules.fieldSchedule);
      }
      for (const teamId of fixed.teamSeasonIds) {
        this.addBooking(teamId, start, end, schedules.teamSchedule);
        this.incrementDailyCount(teamId, start, schedules.teamDailyCounts, timeZoneId);
      }
      for (const umpireId of fixed.umpireIds ?? []) {
        this.addBooking(umpireId, start, end, schedules.umpireSchedule);
        this.incrementDailyCount(umpireId, start, schedules.umpireDailyCounts, timeZoneId);
      }
    }
  }

  private addBooking(key: string, start: Date, end: Date, schedule: Map<string, Interval[]>): void {
    const bookings = schedule.get(key) ?? [];
    bookings.push({ start, end });
    schedule.set(key, bookings);
  }

  private incrementDailyCount(
    key: string,
    date: Date,
    counts: Map<string, Map<string, number>>,
    timeZoneId: string,
  ): void {
    const dayKey = this.formatDayKeyInTimeZone(date, timeZoneId);
    const current = counts.get(key) ?? new Map<string, number>();
    current.set(dayKey, (current.get(dayKey) ?? 0) + 1);
    counts.set(key, current);
  }

  private withinDailyLimit(
    key: string,
    date: Date,
    maxPerDay: number,
    counts: Map<string, Map<string, number>>,
    timeZoneId: string,
  ): boolean {
    const dayKey = this.formatDayKeyInTimeZone(date, timeZoneId);
    const existing = counts.get(key)?.get(dayKey) ?? 0;
    return existing < maxPerDay;
  }

  /**
   * Daily limits are computed in the account time zone so "per day" matches the schedule calendar users see.
   */
  private formatDayKeyInTimeZone(date: Date, timeZoneId: string): string {
    const tz = timeZoneId.trim() || 'UTC';
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
}
