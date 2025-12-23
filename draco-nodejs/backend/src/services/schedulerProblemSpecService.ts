import type {
  SchedulerProblemSpecPreview,
  SchedulerProblemSpec,
  SchedulerSeasonConfig,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonExclusion,
  SchedulerTeamExclusion,
  SchedulerUmpireExclusion,
  SchedulerTeam,
  SchedulerField,
  SchedulerUmpire,
  SchedulerGameRequest,
  SchedulerFieldSlot,
  SchedulerFieldAvailabilityRule,
  SchedulerFieldExclusionDate,
  SchedulerSeasonSolveRequest,
  SchedulerConstraints,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerProblemSpecRepository } from '../repositories/interfaces/ISchedulerProblemSpecRepository.js';
import type { ISeasonsRepository } from '../repositories/interfaces/ISeasonsRepository.js';
import type { ISchedulerFieldAvailabilityRulesRepository } from '../repositories/interfaces/ISchedulerFieldAvailabilityRulesRepository.js';
import type { ISchedulerFieldExclusionDatesRepository } from '../repositories/interfaces/ISchedulerFieldExclusionDatesRepository.js';
import type { ISchedulerSeasonConfigRepository } from '../repositories/interfaces/ISchedulerSeasonConfigRepository.js';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../repositories/interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';
import type { ISchedulerSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import type { ISchedulerUmpireExclusionsRepository } from '../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import { SchedulerSeasonWindowConfigResponseFormatter } from '../responseFormatters/schedulerSeasonWindowConfigResponseFormatter.js';
import { SchedulerSeasonExclusionResponseFormatter } from '../responseFormatters/schedulerSeasonExclusionResponseFormatter.js';
import { SchedulerTeamExclusionResponseFormatter } from '../responseFormatters/schedulerTeamExclusionResponseFormatter.js';
import { SchedulerUmpireExclusionResponseFormatter } from '../responseFormatters/schedulerUmpireExclusionResponseFormatter.js';
import { DEFAULT_FIELD_START_INCREMENT_MINUTES } from '../constants/fieldConstants.js';

const isBitSet = (mask: number, bit: number): boolean => (mask & (1 << bit)) !== 0;

const nextDate = (date: string): string => {
  const advanced = DateUtils.addDaysUtcDateOnly(date, 1);
  if (!advanced) {
    throw new ValidationError('Invalid date while generating field slots');
  }
  return advanced;
};

const parseHhmmToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map((segment) => Number.parseInt(segment, 10));
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new ValidationError('Invalid HH:mm time while generating field slots');
  }
  return hours * 60 + minutes;
};

const formatMinutesToHhmm = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export class SchedulerProblemSpecService {
  constructor(
    private readonly schedulerRepo: ISchedulerProblemSpecRepository = RepositoryFactory.getSchedulerProblemSpecRepository(),
    private readonly seasonsRepository: ISeasonsRepository = RepositoryFactory.getSeasonsRepository(),
    private readonly fieldAvailabilityRulesRepository: ISchedulerFieldAvailabilityRulesRepository = RepositoryFactory.getSchedulerFieldAvailabilityRulesRepository(),
    private readonly fieldExclusionDatesRepository: ISchedulerFieldExclusionDatesRepository = RepositoryFactory.getSchedulerFieldExclusionDatesRepository(),
    private readonly schedulerSeasonConfigRepository: ISchedulerSeasonConfigRepository = RepositoryFactory.getSchedulerSeasonConfigRepository(),
    private readonly schedulerSeasonLeagueSelectionsRepository: ISchedulerSeasonLeagueSelectionsRepository = RepositoryFactory.getSchedulerSeasonLeagueSelectionsRepository(),
    private readonly schedulerSeasonExclusionsRepository: ISchedulerSeasonExclusionsRepository = RepositoryFactory.getSchedulerSeasonExclusionsRepository(),
    private readonly schedulerTeamSeasonExclusionsRepository: ISchedulerTeamSeasonExclusionsRepository = RepositoryFactory.getSchedulerTeamSeasonExclusionsRepository(),
    private readonly schedulerUmpireExclusionsRepository: ISchedulerUmpireExclusionsRepository = RepositoryFactory.getSchedulerUmpireExclusionsRepository(),
  ) {}

  async buildProblemSpecPreview(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<SchedulerProblemSpecPreview> {
    const base = await this.loadBaseSpecData(accountId, seasonId);

    return {
      season: base.season,
      teams: base.teams,
      fields: base.fields,
      umpires: base.umpires,
      games: base.games,
      fieldSlots: base.fieldSlots,
      fieldAvailabilityRules: base.fieldAvailabilityRules,
      fieldExclusionDates: base.fieldExclusionDates,
      seasonWindowConfig: base.seasonWindowConfig,
      seasonExclusions: base.seasonExclusions,
      teamExclusions: base.teamExclusions,
      umpireExclusions: base.umpireExclusions,
    };
  }

  async buildProblemSpec(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonSolveRequest,
  ): Promise<SchedulerProblemSpec> {
    const { problemSpec } = await this.buildProblemSpecForSolve(accountId, seasonId, request);
    return problemSpec;
  }

  async buildProblemSpecForSolve(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonSolveRequest,
  ): Promise<{ problemSpec: SchedulerProblemSpec; timeZoneId: string }> {
    const base = await this.loadBaseSpecData(accountId, seasonId);
    const filteredGames = request.gameIds?.length
      ? base.games.filter((game) => request.gameIds?.includes(game.id))
      : base.games;

    const requiredUmpiresOverride =
      request.umpiresPerGame ?? base.seasonWindowConfig.umpiresPerGame ?? 2;
    const normalizedGames = filteredGames.map((game) => ({
      ...game,
      requiredUmpires: requiredUmpiresOverride,
    }));

    if (normalizedGames.length === 0) {
      throw new ValidationError('No games found to schedule for the provided selection');
    }

    const normalizedConstraints = this.normalizeConstraints(request.constraints, base.timeZoneId);
    const maxGamesPerUmpirePerDayDefault = base.seasonWindowConfig.maxGamesPerUmpirePerDay;
    const constraintsWithDefaults =
      maxGamesPerUmpirePerDayDefault === undefined || maxGamesPerUmpirePerDayDefault === null
        ? normalizedConstraints
        : {
            ...(normalizedConstraints ?? {}),
            hard: {
              ...((normalizedConstraints?.hard ?? {}) as NonNullable<SchedulerConstraints>['hard']),
              maxGamesPerUmpirePerDay:
                normalizedConstraints?.hard?.maxGamesPerUmpirePerDay ??
                maxGamesPerUmpirePerDayDefault,
            },
          };

    return {
      timeZoneId: base.timeZoneId,
      problemSpec: {
        season: base.season,
        teams: base.teams,
        fields: base.fields,
        umpires: base.umpires,
        games: normalizedGames,
        fieldSlots: base.fieldSlots,
        seasonExclusions: base.seasonExclusions,
        teamExclusions: base.teamExclusions,
        umpireExclusions: base.umpireExclusions,
        umpireAvailability: undefined,
        teamBlackouts: undefined,
        constraints: constraintsWithDefaults,
        objectives: request.objectives,
        runId: undefined,
      },
    };
  }

  private normalizeConstraints(
    constraints: SchedulerSeasonSolveRequest['constraints'] | undefined,
    timeZoneId: string,
  ): SchedulerConstraints | undefined {
    if (!constraints) {
      return undefined;
    }

    const hard = constraints?.hard;
    const requireLightsAfter = hard?.requireLightsAfter;
    const normalizedHard: NonNullable<SchedulerConstraints>['hard'] | undefined = hard
      ? {
          ...hard,
          requireLightsAfter: requireLightsAfter
            ? { ...requireLightsAfter, timeZone: timeZoneId }
            : undefined,
        }
      : undefined;

    return {
      ...constraints,
      hard: normalizedHard,
    };
  }

  private async loadBaseSpecData(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<
    SchedulerProblemSpecPreview & {
      timeZoneId: string;
      seasonWindowConfig: SchedulerSeasonWindowConfig;
      seasonExclusions: SchedulerSeasonExclusion[];
      teamExclusions: SchedulerTeamExclusion[];
      umpireExclusions: SchedulerUmpireExclusion[];
    }
  > {
    const account = await this.schedulerRepo.findAccount(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);
    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const timeZoneId = account.timezoneid?.trim();
    if (!timeZoneId) {
      throw new ValidationError('Account timezone is required to generate field slots');
    }

    const [
      teams,
      fields,
      umpires,
      games,
      ruleRecords,
      exclusionRecords,
      seasonConfigRecord,
      leagueSelectionRecords,
      seasonExclusionRecords,
      teamExclusionRecords,
      umpireExclusionRecords,
    ] = await Promise.all([
      this.schedulerRepo.listSeasonTeams(seasonId),
      this.schedulerRepo.listAccountFields(accountId),
      this.schedulerRepo.listAccountUmpires(accountId),
      this.schedulerRepo.listSeasonGames(seasonId),
      this.fieldAvailabilityRulesRepository.listForSeason(accountId, seasonId),
      this.fieldExclusionDatesRepository.listForSeason(accountId, seasonId),
      this.schedulerSeasonConfigRepository.findForSeason(accountId, seasonId),
      this.schedulerSeasonLeagueSelectionsRepository.listForSeason(accountId, seasonId),
      this.schedulerSeasonExclusionsRepository.listForSeason(accountId, seasonId),
      this.schedulerTeamSeasonExclusionsRepository.listForSeason(accountId, seasonId),
      this.schedulerUmpireExclusionsRepository.listForSeason(accountId, seasonId),
    ]);

    if (!seasonConfigRecord) {
      throw new ValidationError(
        'Season scheduling window is not configured. Set season start/end dates to enable scheduling.',
      );
    }

    const selectedLeagueSeasonIds = leagueSelectionRecords
      .filter((row) => row.enabled)
      .map((row) => row.leagueseasonid.toString());
    const seasonWindowConfig = SchedulerSeasonWindowConfigResponseFormatter.formatConfig(
      seasonConfigRecord,
      selectedLeagueSeasonIds,
    );

    const schedulerTeams: SchedulerTeam[] = teams.map((team) => ({
      id: team.teamid.toString(),
      teamSeasonId: team.id.toString(),
      divisionSeasonId: team.divisionseasonid?.toString(),
      league: { id: team.leagueseasonid.toString() },
    }));

    const schedulerFields: SchedulerField[] = fields.map((field) => ({
      id: field.id.toString(),
      name: field.name,
      properties: {
        hasLights: field.haslights === true,
        maxParallelGames: field.maxparallelgames ?? 1,
        startIncrementMinutes:
          field.schedulerstartincrementminutes ?? DEFAULT_FIELD_START_INCREMENT_MINUTES,
      },
    }));

    const startIncrementByFieldId = new Map<string, number>();
    schedulerFields.forEach((field) => {
      const increment = field.properties?.startIncrementMinutes;
      if (increment !== undefined && Number.isFinite(increment)) {
        startIncrementByFieldId.set(field.id, increment);
      }
    });

    const schedulerUmpires: SchedulerUmpire[] = umpires.map((umpire) => ({
      id: umpire.id.toString(),
      name:
        [umpire.contacts.firstname, umpire.contacts.lastname].filter(Boolean).join(' ').trim() ||
        umpire.contacts.email ||
        undefined,
      maxGamesPerDay: undefined,
    }));

    const schedulerGames: SchedulerGameRequest[] = games.map((game) => ({
      id: game.id.toString(),
      leagueSeasonId: game.leagueid.toString(),
      homeTeamSeasonId: game.hteamid.toString(),
      visitorTeamSeasonId: game.vteamid.toString(),
      requiredUmpires: undefined,
      preferredFieldIds: game.fieldid ? [game.fieldid.toString()] : undefined,
      earliestStart: undefined,
      latestEnd: undefined,
      durationMinutes: undefined,
    }));

    const rules: SchedulerFieldAvailabilityRule[] = ruleRecords.map((record) => {
      const startDate = DateUtils.formatDateForResponse(record.startdate);
      const endDate = DateUtils.formatDateForResponse(record.enddate);

      return {
        id: record.id.toString(),
        seasonId: record.seasonid.toString(),
        fieldId: record.fieldid.toString(),
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        daysOfWeekMask: record.daysofweekmask,
        startTimeLocal: record.starttimelocal,
        endTimeLocal: record.endtimelocal,
        enabled: record.enabled,
      };
    });

    const fieldExclusionDates: SchedulerFieldExclusionDate[] = exclusionRecords.map((record) => {
      const date = DateUtils.formatDateForResponse(record.exclusiondate);
      if (!date) {
        throw new ValidationError('Invalid field exclusion date');
      }

      return {
        id: record.id.toString(),
        seasonId: record.seasonid.toString(),
        fieldId: record.fieldid.toString(),
        date,
        note: record.note ?? undefined,
        enabled: record.enabled,
      };
    });

    const windowStartDate = seasonWindowConfig.startDate;
    const windowEndDate = seasonWindowConfig.endDate;
    if (windowStartDate > windowEndDate) {
      throw new ValidationError('Season startDate must be on or before endDate');
    }

    const seasonConfig: SchedulerSeasonConfig = {
      id: season.id.toString(),
      name: season.name,
      startDate: windowStartDate,
      endDate: windowEndDate,
      gameDurations: undefined,
    };

    const enabledExclusions = fieldExclusionDates.filter((exclusion) => exclusion.enabled);
    const exclusionsByFieldId = this.groupFieldExclusions(enabledExclusions);

    const fieldSlots = this.generateFieldSlotsFromRules(
      rules,
      timeZoneId,
      {
        startDate: windowStartDate,
        endDate: windowEndDate,
      },
      exclusionsByFieldId,
      startIncrementByFieldId,
    );

    const seasonExclusions =
      SchedulerSeasonExclusionResponseFormatter.formatExclusions(seasonExclusionRecords).exclusions;
    const teamExclusions =
      SchedulerTeamExclusionResponseFormatter.formatExclusions(teamExclusionRecords).exclusions;
    const umpireExclusions =
      SchedulerUmpireExclusionResponseFormatter.formatExclusions(umpireExclusionRecords).exclusions;

    const filteredFieldSlots = this.filterSlotsBySeasonExclusionStarts(
      fieldSlots,
      seasonExclusions,
    );

    return {
      season: seasonConfig,
      teams: schedulerTeams,
      fields: schedulerFields,
      umpires: schedulerUmpires,
      games: schedulerGames,
      fieldSlots: filteredFieldSlots,
      fieldAvailabilityRules: rules,
      fieldExclusionDates,
      seasonWindowConfig,
      seasonExclusions,
      teamExclusions,
      umpireExclusions,
      timeZoneId,
    };
  }

  private filterSlotsBySeasonExclusionStarts(
    slots: SchedulerFieldSlot[],
    exclusions: SchedulerSeasonExclusion[],
  ): SchedulerFieldSlot[] {
    const enabled = exclusions.filter((exclusion) => exclusion.enabled);
    if (enabled.length === 0) {
      return slots;
    }

    const windows = enabled.map((exclusion) => ({
      start: new Date(exclusion.startTime),
      end: new Date(exclusion.endTime),
    }));

    return slots.filter((slot) => {
      const start = new Date(slot.startTime);
      return !windows.some((window) => start >= window.start && start < window.end);
    });
  }

  private groupFieldExclusions(
    exclusions: SchedulerFieldExclusionDate[],
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const exclusion of exclusions) {
      const dates = map.get(exclusion.fieldId) ?? new Set<string>();
      dates.add(exclusion.date);
      map.set(exclusion.fieldId, dates);
    }
    return map;
  }

  private generateFieldSlotsFromRules(
    rules: SchedulerFieldAvailabilityRule[],
    timeZoneId: string,
    window: { startDate: string; endDate: string },
    exclusionsByFieldId: Map<string, Set<string>>,
    startIncrementByFieldId: Map<string, number>,
  ): SchedulerFieldSlot[] {
    const slots: SchedulerFieldSlot[] = [];

    for (const rule of rules) {
      if (!rule.enabled) {
        continue;
      }

      const rawStartDate = rule.startDate ?? window.startDate;
      const rawEndDate = rule.endDate ?? window.endDate;
      const ruleStartDate = rawStartDate < window.startDate ? window.startDate : rawStartDate;
      const ruleEndDate = rawEndDate > window.endDate ? window.endDate : rawEndDate;
      if (ruleStartDate > ruleEndDate) {
        continue;
      }

      let dateCursor = ruleStartDate;
      const endDate = ruleEndDate;
      const windowStartMinutes = parseHhmmToMinutes(rule.startTimeLocal);
      const windowEndMinutes = parseHhmmToMinutes(rule.endTimeLocal);
      const increment = Math.max(
        1,
        Math.floor(
          startIncrementByFieldId.get(rule.fieldId) ?? DEFAULT_FIELD_START_INCREMENT_MINUTES,
        ),
      );

      while (dateCursor <= endDate) {
        const excludedDates = exclusionsByFieldId.get(rule.fieldId);
        if (excludedDates?.has(dateCursor)) {
          dateCursor = nextDate(dateCursor);
          continue;
        }

        const midnightLocalUtc = DateUtils.parseLocalDateTimeToUtcDate(
          dateCursor,
          '00:00',
          timeZoneId,
        );
        if (!midnightLocalUtc) {
          throw new ValidationError(
            'Invalid date or account timezone while generating field slots',
          );
        }

        const weekday = DateUtils.getWeekdayIndexMondayZeroInTimeZone(midnightLocalUtc, timeZoneId);
        if (weekday === null) {
          throw new ValidationError('Invalid account timezone while generating field slots');
        }

        if (isBitSet(rule.daysOfWeekMask, weekday)) {
          const windowEnd = DateUtils.parseLocalDateTimeToUtcDate(
            dateCursor,
            rule.endTimeLocal,
            timeZoneId,
          );
          if (!windowEnd) {
            throw new ValidationError('Invalid rule end time or account timezone');
          }

          const maxStarts = Math.ceil((windowEndMinutes - windowStartMinutes) / increment) + 1;
          let guard = 0;
          for (
            let startMinutes = windowStartMinutes;
            startMinutes < windowEndMinutes;
            startMinutes += increment
          ) {
            const startTimeLocal = formatMinutesToHhmm(startMinutes);
            const start = DateUtils.parseLocalDateTimeToUtcDate(
              dateCursor,
              startTimeLocal,
              timeZoneId,
            );
            if (!start) {
              throw new ValidationError('Invalid rule start time or account timezone');
            }

            slots.push({
              id: `rule_${rule.id}_${dateCursor}_${start.toISOString()}`,
              fieldId: rule.fieldId,
              startTime: start.toISOString(),
              endTime: windowEnd.toISOString(),
            });

            guard += 1;
            if (guard > maxStarts) {
              throw new ValidationError(
                'Field schedulerStartIncrementMinutes produced too many slots in one day',
              );
            }
          }
        }

        dateCursor = nextDate(dateCursor);
      }
    }

    return slots;
  }
}
