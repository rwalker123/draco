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
  SchedulerSeasonSolveRequest,
  SchedulerConstraints,
} from '@draco/shared-schemas';
import type { availablefields, fieldopenhours, fieldcloseddates } from '#prisma/client';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerProblemSpecRepository } from '../repositories/interfaces/ISchedulerProblemSpecRepository.js';
import type { ISeasonsRepository } from '../repositories/interfaces/ISeasonsRepository.js';
import type { IFieldScheduleConfigRepository } from '../repositories/interfaces/IFieldScheduleConfigRepository.js';
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
import { DEFAULT_SCHEDULER_GAME_LENGTH_MINUTES } from '../constants/fieldConstants.js';

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
    private readonly fieldScheduleConfigRepository: IFieldScheduleConfigRepository = RepositoryFactory.getFieldScheduleConfigRepository(),
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

    const sourceGames: SchedulerGameRequest[] =
      request.matchups && request.matchups.length > 0
        ? request.matchups
        : request.gameIds?.length
          ? base.games.filter((game) => request.gameIds?.includes(game.id))
          : base.games;

    const requiredUmpiresOverride =
      request.umpiresPerGame ?? base.seasonWindowConfig.umpiresPerGame ?? 2;
    const normalizedGames = sourceGames.map((game) => ({
      ...game,
      requiredUmpires: requiredUmpiresOverride,
    }));

    if (normalizedGames.length === 0) {
      throw new ValidationError('No games found to schedule for the provided selection');
    }

    const normalizedConstraints = this.normalizeConstraints(request.constraints, base.timeZoneId);
    const maxGamesPerUmpirePerDayDefault = base.seasonWindowConfig.maxGamesPerUmpirePerDay;
    const constraintsWithHardDefaults =
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
    const defaultSoft: NonNullable<SchedulerConstraints>['soft'] = {
      avoidBackToBackGames: { enabled: true, minRestMinutes: 2880, weight: 3 },
      spreadGamesAcrossDays: { enabled: true, weight: 2 },
      balanceEarlyVsLate: { enabled: true, weight: 1 },
    };
    const constraintsWithDefaults =
      constraintsWithHardDefaults?.soft !== undefined
        ? constraintsWithHardDefaults
        : {
            ...(constraintsWithHardDefaults ?? {}),
            soft: defaultSoft,
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
      openHoursRecords,
      closedDateRecords,
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
      this.fieldScheduleConfigRepository.listOpenHoursForAccount(accountId),
      this.fieldScheduleConfigRepository.listClosedDatesForAccount(accountId),
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
      },
    }));

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

    const openHoursByFieldId = this.groupOpenHoursByFieldId(openHoursRecords);
    const closedDatesByFieldId = this.groupClosedDatesByFieldId(closedDateRecords);

    const fieldSlots = this.generateFieldSlots(
      fields,
      openHoursByFieldId,
      closedDatesByFieldId,
      seasonConfig,
      timeZoneId,
      { startDate: windowStartDate, endDate: windowEndDate },
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
      seasonWindowConfig,
      seasonExclusions,
      teamExclusions,
      umpireExclusions,
      timeZoneId,
    };
  }

  private groupOpenHoursByFieldId(
    records: fieldopenhours[],
  ): Map<string, { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }[]> {
    const map = new Map<
      string,
      { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }[]
    >();
    for (const record of records) {
      const fieldId = record.fieldid.toString();
      const entries = map.get(fieldId) ?? [];
      entries.push({
        dayOfWeek: record.dayofweek,
        startTimeLocal: record.starttimelocal,
        endTimeLocal: record.endtimelocal,
      });
      map.set(fieldId, entries);
    }
    return map;
  }

  private groupClosedDatesByFieldId(records: fieldcloseddates[]): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const record of records) {
      const fieldId = record.fieldid.toString();
      const dates = map.get(fieldId) ?? new Set<string>();
      const startKey = DateUtils.formatDateForResponse(record.closeddate);
      if (startKey) {
        const endRaw = DateUtils.formatDateForResponse(record.enddate);
        const endKey = endRaw && endRaw >= startKey ? endRaw : startKey;
        let cursor = startKey;
        let guard = 0;
        while (cursor <= endKey) {
          dates.add(cursor);
          cursor = nextDate(cursor);
          guard += 1;
          if (guard > 1000) {
            break;
          }
        }
      }
      map.set(fieldId, dates);
    }
    return map;
  }

  private generateFieldSlots(
    fields: availablefields[],
    openHoursByFieldId: Map<
      string,
      { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }[]
    >,
    closedDatesByFieldId: Map<string, Set<string>>,
    seasonConfig: SchedulerSeasonConfig,
    timeZoneId: string,
    window: { startDate: string; endDate: string },
  ): SchedulerFieldSlot[] {
    const slots: SchedulerFieldSlot[] = [];

    for (const field of fields) {
      if (field.scheduleenabled !== true) {
        continue;
      }

      const fieldId = field.id.toString();
      const fieldOpenHours = openHoursByFieldId.get(fieldId) ?? [];
      if (fieldOpenHours.length === 0) {
        continue;
      }

      const openHoursByDayOfWeek = new Map(fieldOpenHours.map((entry) => [entry.dayOfWeek, entry]));

      const durationCandidates: number[] = [];
      if (seasonConfig.gameDurations?.defaultMinutes !== undefined) {
        durationCandidates.push(seasonConfig.gameDurations.defaultMinutes);
      }
      if (field.gamelengthminutes !== null && field.gamelengthminutes !== undefined) {
        durationCandidates.push(field.gamelengthminutes);
      }
      const gameLength =
        durationCandidates.length > 0
          ? Math.min(...durationCandidates)
          : DEFAULT_SCHEDULER_GAME_LENGTH_MINUTES;

      const bufferMinutes = field.bufferminutes ?? 0;
      const spacing = Math.max(1, Math.floor(gameLength + bufferMinutes));

      const closedDates = closedDatesByFieldId.get(fieldId) ?? new Set<string>();

      let dateCursor = window.startDate;
      const endDate = window.endDate;

      while (dateCursor <= endDate) {
        if (closedDates.has(dateCursor)) {
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

        const openEntry = openHoursByDayOfWeek.get(weekday);
        if (!openEntry) {
          dateCursor = nextDate(dateCursor);
          continue;
        }

        const windowStartMinutes = parseHhmmToMinutes(openEntry.startTimeLocal);
        const windowEndMinutes = parseHhmmToMinutes(openEntry.endTimeLocal);

        const windowEnd = DateUtils.parseLocalDateTimeToUtcDate(
          dateCursor,
          openEntry.endTimeLocal,
          timeZoneId,
        );
        if (!windowEnd) {
          throw new ValidationError('Invalid field open hours end time or account timezone');
        }

        const maxStarts = Math.ceil((windowEndMinutes - windowStartMinutes) / spacing) + 1;
        let guard = 0;

        for (
          let startMinutes = windowStartMinutes;
          startMinutes + gameLength <= windowEndMinutes;
          startMinutes += spacing
        ) {
          const startTimeLocal = formatMinutesToHhmm(startMinutes);
          const start = DateUtils.parseLocalDateTimeToUtcDate(
            dateCursor,
            startTimeLocal,
            timeZoneId,
          );
          if (!start) {
            throw new ValidationError('Invalid field open hours start time or account timezone');
          }

          slots.push({
            id: `field_${fieldId}_${dateCursor}_${start.toISOString()}`,
            fieldId,
            startTime: start.toISOString(),
            endTime: windowEnd.toISOString(),
          });

          guard += 1;
          if (guard > maxStarts) {
            throw new ValidationError(
              'Field open hours configuration produced too many slots in one day',
            );
          }
        }

        dateCursor = nextDate(dateCursor);
      }
    }

    return slots;
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
}
