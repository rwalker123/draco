import type {
  SchedulerProblemSpecPreview,
  SchedulerProblemSpec,
  SchedulerSeasonConfig,
  SchedulerTeam,
  SchedulerField,
  SchedulerUmpire,
  SchedulerGameRequest,
  SchedulerFieldSlot,
  SchedulerFieldAvailabilityRule,
  SchedulerSeasonSolveRequest,
  SchedulerConstraints,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerProblemSpecRepository } from '../repositories/interfaces/ISchedulerProblemSpecRepository.js';
import type { ISeasonsRepository } from '../repositories/interfaces/ISeasonsRepository.js';
import type { ISchedulerFieldAvailabilityRulesRepository } from '../repositories/interfaces/ISchedulerFieldAvailabilityRulesRepository.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

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

const minDateString = (values: string[]): string | undefined => {
  if (values.length === 0) {
    return undefined;
  }
  return values.reduce((min, value) => (value < min ? value : min), values[0]);
};

const maxDateString = (values: string[]): string | undefined => {
  if (values.length === 0) {
    return undefined;
  }
  return values.reduce((max, value) => (value > max ? value : max), values[0]);
};

export class SchedulerProblemSpecService {
  constructor(
    private readonly schedulerRepo: ISchedulerProblemSpecRepository = RepositoryFactory.getSchedulerProblemSpecRepository(),
    private readonly seasonsRepository: ISeasonsRepository = RepositoryFactory.getSeasonsRepository(),
    private readonly fieldAvailabilityRulesRepository: ISchedulerFieldAvailabilityRulesRepository = RepositoryFactory.getSchedulerFieldAvailabilityRulesRepository(),
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
    };
  }

  async buildProblemSpec(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonSolveRequest,
  ): Promise<SchedulerProblemSpec> {
    const base = await this.loadBaseSpecData(accountId, seasonId);
    const filteredGames = request.gameIds?.length
      ? base.games.filter((game) => request.gameIds?.includes(game.id))
      : base.games;

    if (filteredGames.length === 0) {
      throw new ValidationError('No games found to schedule for the provided selection');
    }

    return {
      season: base.season,
      teams: base.teams,
      fields: base.fields,
      umpires: base.umpires,
      games: filteredGames,
      fieldSlots: base.fieldSlots,
      umpireAvailability: undefined,
      teamBlackouts: undefined,
      constraints: this.normalizeConstraints(request.constraints, base.timeZoneId),
      objectives: request.objectives,
      runId: undefined,
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

    const [teams, fields, umpires, games, ruleRecords] = await Promise.all([
      this.schedulerRepo.listSeasonTeams(seasonId),
      this.schedulerRepo.listAccountFields(accountId),
      this.schedulerRepo.listAccountUmpires(accountId),
      this.schedulerRepo.listSeasonGames(seasonId),
      this.fieldAvailabilityRulesRepository.listForSeason(accountId, seasonId),
    ]);

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
      },
    }));

    const schedulerUmpires: SchedulerUmpire[] = umpires.map((umpire) => ({
      id: umpire.id.toString(),
      name: undefined,
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
      if (!startDate || !endDate) {
        throw new ValidationError('Invalid rule date range');
      }

      return {
        id: record.id.toString(),
        seasonId: record.seasonid.toString(),
        fieldId: record.fieldid.toString(),
        startDate,
        endDate,
        daysOfWeekMask: record.daysofweekmask,
        startTimeLocal: record.starttimelocal,
        endTimeLocal: record.endtimelocal,
        startIncrementMinutes: record.startincrementminutes,
        enabled: record.enabled,
      };
    });

    const enabledRules = rules.filter((rule) => rule.enabled);
    const derivedStartDate = minDateString(enabledRules.map((rule) => rule.startDate));
    const derivedEndDate = maxDateString(enabledRules.map((rule) => rule.endDate));

    if (!derivedStartDate || !derivedEndDate) {
      throw new ValidationError(
        'At least one enabled field availability rule is required to derive season startDate/endDate',
      );
    }

    const seasonConfig: SchedulerSeasonConfig = {
      id: season.id.toString(),
      name: season.name,
      startDate: derivedStartDate,
      endDate: derivedEndDate,
      gameDurations: undefined,
    };

    const fieldSlots = this.generateFieldSlotsFromRules(rules, timeZoneId);

    return {
      season: seasonConfig,
      teams: schedulerTeams,
      fields: schedulerFields,
      umpires: schedulerUmpires,
      games: schedulerGames,
      fieldSlots,
      fieldAvailabilityRules: rules,
      timeZoneId,
    };
  }

  private generateFieldSlotsFromRules(
    rules: SchedulerFieldAvailabilityRule[],
    timeZoneId: string,
  ): SchedulerFieldSlot[] {
    const slots: SchedulerFieldSlot[] = [];

    for (const rule of rules) {
      if (!rule.enabled) {
        continue;
      }

      let dateCursor = rule.startDate;
      const endDate = rule.endDate;
      const windowStartMinutes = parseHhmmToMinutes(rule.startTimeLocal);
      const windowEndMinutes = parseHhmmToMinutes(rule.endTimeLocal);
      const increment = Math.max(1, Math.floor(rule.startIncrementMinutes));

      while (dateCursor <= endDate) {
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
                'Rule startIncrementMinutes produced too many slots in one day',
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
