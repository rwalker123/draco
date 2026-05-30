import type {
  SchedulerApplyRequest,
  SchedulerApplyResult,
  SchedulerGameRequest,
  SchedulerTeam,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import type { IFieldRepository } from '../repositories/interfaces/IFieldRepository.js';
import type { ISchedulerSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import type { ISchedulerUmpireExclusionsRepository } from '../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import type { dbScheduleCreateData, dbScheduleUpdateData } from '../repositories/index.js';
import { ValidationError } from '../utils/customErrors.js';
import { ValidationUtils } from '../utils/validationUtils.js';
import { DateUtils } from '../utils/dateUtils.js';
import { GameStatus, GameType } from '../types/gameEnums.js';

const MAX_UMPIRES_PER_GAME = 4;

const withDefaultHardConstraints = (
  constraints: SchedulerApplyRequest['constraints'],
): NonNullable<SchedulerApplyRequest['constraints']>['hard'] => {
  const defaults: NonNullable<SchedulerApplyRequest['constraints']>['hard'] = {
    respectFieldSlots: true,
    respectTeamBlackouts: true,
    respectUmpireAvailability: true,
    maxGamesPerTeamPerDay: undefined,
    maxGamesPerUmpirePerDay: undefined,
    requireLightsAfter: undefined,
  };

  return { ...defaults, ...(constraints?.hard ?? {}) };
};

export class SchedulerApplyService {
  private readonly scheduleRepository: IScheduleRepository;
  private readonly fieldRepository: IFieldRepository;
  private readonly schedulerSeasonExclusionsRepository: ISchedulerSeasonExclusionsRepository;
  private readonly schedulerTeamSeasonExclusionsRepository: ISchedulerTeamSeasonExclusionsRepository;
  private readonly schedulerUmpireExclusionsRepository: ISchedulerUmpireExclusionsRepository;

  constructor(repositories?: {
    scheduleRepository?: IScheduleRepository;
    fieldRepository?: IFieldRepository;
    schedulerSeasonExclusionsRepository?: ISchedulerSeasonExclusionsRepository;
    schedulerTeamSeasonExclusionsRepository?: ISchedulerTeamSeasonExclusionsRepository;
    schedulerUmpireExclusionsRepository?: ISchedulerUmpireExclusionsRepository;
  }) {
    this.scheduleRepository =
      repositories?.scheduleRepository ?? RepositoryFactory.getScheduleRepository();
    this.fieldRepository = repositories?.fieldRepository ?? RepositoryFactory.getFieldRepository();
    this.schedulerSeasonExclusionsRepository =
      repositories?.schedulerSeasonExclusionsRepository ??
      RepositoryFactory.getSchedulerSeasonExclusionsRepository();
    this.schedulerTeamSeasonExclusionsRepository =
      repositories?.schedulerTeamSeasonExclusionsRepository ??
      RepositoryFactory.getSchedulerTeamSeasonExclusionsRepository();
    this.schedulerUmpireExclusionsRepository =
      repositories?.schedulerUmpireExclusionsRepository ??
      RepositoryFactory.getSchedulerUmpireExclusionsRepository();
  }

  private overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
    return a.start < b.end && b.start < a.end;
  }

  private buildUtcDayRange(date: Date): { start: Date; end: Date; dayKey: string } {
    const dayKey = date.toISOString().slice(0, 10);
    const start = new Date(`${dayKey}T00:00:00.000Z`);
    const end = new Date(`${dayKey}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end, dayKey };
  }

  async applyProposal(
    accountId: bigint,
    request: SchedulerApplyRequest,
    context?: {
      seasonId?: bigint;
      matchups?: SchedulerGameRequest[];
      seasonTeams?: SchedulerTeam[];
    },
  ): Promise<SchedulerApplyResult> {
    const targetGameIds = this.resolveTargetGameIds(request);
    const appliedGameIds: string[] = [];
    const skipped: Array<{ gameId: string; reason: string }> = [];
    const fieldMetaById = new Map<string, { hasLights: boolean; maxParallelGames: number }>();
    const hard = withDefaultHardConstraints(request.constraints);
    const matchupById = new Map<string, SchedulerGameRequest>(
      (context?.matchups ?? []).map((m) => [m.id, m]),
    );
    const seasonLeagueByTeamSeasonId = context?.seasonTeams
      ? new Map<string, string>(
          context.seasonTeams.map((team) => [team.teamSeasonId, team.league.id]),
        )
      : undefined;

    const seasonExclusions: Array<{ start: Date; end: Date }> = [];
    const teamExclusionsByTeamSeasonId = new Map<string, Array<{ start: Date; end: Date }>>();
    const umpireExclusionsByUmpireId = new Map<string, Array<{ start: Date; end: Date }>>();

    if (context?.seasonId) {
      const [seasonExclusionRecords, teamExclusionRecords, umpireExclusionRecords] =
        await Promise.all([
          this.schedulerSeasonExclusionsRepository.listForSeason(accountId, context.seasonId),
          this.schedulerTeamSeasonExclusionsRepository.listForSeason(accountId, context.seasonId),
          this.schedulerUmpireExclusionsRepository.listForSeason(accountId, context.seasonId),
        ]);

      seasonExclusionRecords
        .filter((record) => record.enabled)
        .forEach((record) => {
          seasonExclusions.push({ start: record.starttime, end: record.endtime });
        });

      teamExclusionRecords
        .filter((record) => record.enabled)
        .forEach((record) => {
          const key = record.teamseasonid.toString();
          const list = teamExclusionsByTeamSeasonId.get(key) ?? [];
          list.push({ start: record.starttime, end: record.endtime });
          teamExclusionsByTeamSeasonId.set(key, list);
        });

      umpireExclusionRecords
        .filter((record) => record.enabled)
        .forEach((record) => {
          const key = record.umpireid.toString();
          const list = umpireExclusionsByUmpireId.get(key) ?? [];
          list.push({ start: record.starttime, end: record.endtime });
          umpireExclusionsByUmpireId.set(key, list);
        });
    }

    for (const assignment of request.assignments) {
      if (targetGameIds && !targetGameIds.has(assignment.gameId)) {
        continue;
      }

      const isGenerated = matchupById.has(assignment.gameId);
      const fieldId = this.parseBigIntId(assignment.fieldId, 'fieldId');
      const gameDate = this.parseDateTime(assignment.startTime, 'startTime');
      const endTime = this.parseDateTime(assignment.endTime, 'endTime');

      if (endTime <= gameDate) {
        skipped.push({ gameId: assignment.gameId, reason: 'Invalid endTime' });
        continue;
      }

      if (
        seasonExclusions.some((block) => this.overlaps(block, { start: gameDate, end: endTime }))
      ) {
        skipped.push({ gameId: assignment.gameId, reason: 'Season exclusion window conflict' });
        continue;
      }

      let fieldMeta = fieldMetaById.get(assignment.fieldId);
      if (!fieldMeta) {
        const field = await this.fieldRepository.findAccountField(accountId, fieldId);
        if (!field) {
          skipped.push({ gameId: assignment.gameId, reason: 'Unknown fieldId' });
          continue;
        }

        fieldMeta = {
          hasLights: field.haslights === true,
          maxParallelGames: Math.max(1, Math.floor(field.maxparallelgames ?? 1)),
        };
        fieldMetaById.set(assignment.fieldId, fieldMeta);
      }

      if (assignment.umpireIds.length > MAX_UMPIRES_PER_GAME) {
        skipped.push({
          gameId: assignment.gameId,
          reason: `Too many umpireIds (max ${MAX_UMPIRES_PER_GAME})`,
        });
        continue;
      }

      const umpireIds = assignment.umpireIds.map((id) => this.parseBigIntId(id, 'umpireId'));

      let homeTeamId: bigint;
      let visitorTeamId: bigint;
      let leagueSeasonId: bigint;
      let excludeGameId: bigint | undefined;
      let dbGameId: bigint | undefined;
      let dbGamedate: Date | undefined;
      let dbFieldid: bigint | null | undefined;
      let dbUmpire1: bigint | null | undefined;
      let dbUmpire2: bigint | null | undefined;
      let dbUmpire3: bigint | null | undefined;
      let dbUmpire4: bigint | null | undefined;

      if (isGenerated) {
        const matchup = matchupById.get(assignment.gameId)!;
        homeTeamId = this.parseBigIntId(matchup.homeTeamSeasonId, 'homeTeamSeasonId');
        visitorTeamId = this.parseBigIntId(matchup.visitorTeamSeasonId, 'visitorTeamSeasonId');
        leagueSeasonId = this.parseBigIntId(matchup.leagueSeasonId, 'leagueSeasonId');

        const homeLeague = seasonLeagueByTeamSeasonId?.get(matchup.homeTeamSeasonId);
        const visitorLeague = seasonLeagueByTeamSeasonId?.get(matchup.visitorTeamSeasonId);
        if (
          !seasonLeagueByTeamSeasonId ||
          homeLeague === undefined ||
          visitorLeague === undefined ||
          homeLeague !== matchup.leagueSeasonId ||
          visitorLeague !== matchup.leagueSeasonId
        ) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Generated matchup references teams or league outside the requested season',
          });
          continue;
        }

        if (homeTeamId === visitorTeamId) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Home team and visitor team cannot be the same',
          });
          continue;
        }

        excludeGameId = undefined;
      } else {
        const parsedGameId = this.parseBigIntId(assignment.gameId, 'gameId');
        const existingGame = await this.scheduleRepository.findGameWithAccountContext(
          parsedGameId,
          accountId,
        );
        if (!existingGame) {
          skipped.push({ gameId: assignment.gameId, reason: 'Game not found' });
          continue;
        }

        if (context?.seasonId && existingGame.leagueseason.seasonid !== context.seasonId) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Game is not in the requested season',
          });
          continue;
        }

        homeTeamId = existingGame.hteamid;
        visitorTeamId = existingGame.vteamid;
        leagueSeasonId = existingGame.leagueid;
        excludeGameId = parsedGameId;
        dbGameId = parsedGameId;
        dbGamedate = existingGame.gamedate;
        dbFieldid = existingGame.fieldid;
        dbUmpire1 = existingGame.umpire1;
        dbUmpire2 = existingGame.umpire2;
        dbUmpire3 = existingGame.umpire3;
        dbUmpire4 = existingGame.umpire4;
      }

      const homeTeamKey = homeTeamId.toString();
      const visitorTeamKey = visitorTeamId.toString();
      const excludedTeams = [homeTeamKey, visitorTeamKey].some((key) =>
        (teamExclusionsByTeamSeasonId.get(key) ?? []).some((block) =>
          this.overlaps(block, { start: gameDate, end: endTime }),
        ),
      );
      if (excludedTeams) {
        skipped.push({ gameId: assignment.gameId, reason: 'Team exclusion window conflict' });
        continue;
      }

      const excludedUmpire =
        assignment.umpireIds.length > 0 &&
        assignment.umpireIds.some((umpireId) =>
          (umpireExclusionsByUmpireId.get(umpireId) ?? []).some((block) =>
            this.overlaps(block, { start: gameDate, end: endTime }),
          ),
        );
      if (excludedUmpire) {
        skipped.push({ gameId: assignment.gameId, reason: 'Umpire exclusion window conflict' });
        continue;
      }

      const teams = [homeTeamId, visitorTeamId];
      const teamConflicts = await Promise.all(
        teams.map(async (teamSeasonId) => {
          const existingBookings = await this.scheduleRepository.countTeamBookingsAtTime(
            teamSeasonId,
            gameDate,
            leagueSeasonId,
            excludeGameId,
          );
          return { existingBookings };
        }),
      );

      const hasTeamConflict = teamConflicts.some((entry) => entry.existingBookings > 0);
      if (hasTeamConflict) {
        skipped.push({
          gameId: assignment.gameId,
          reason: 'Team is already booked for this date and time',
        });
        continue;
      }

      if (umpireIds.length > 0) {
        const umpireConflicts = await Promise.all(
          umpireIds.map(async (umpireId) => {
            const existingBookings = await this.scheduleRepository.countUmpireBookingsAtTime(
              umpireId,
              gameDate,
              leagueSeasonId,
              excludeGameId,
            );
            return { existingBookings };
          }),
        );

        const hasUmpireConflict = umpireConflicts.some((entry) => entry.existingBookings > 0);
        if (hasUmpireConflict) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Umpire is already booked for this date and time',
          });
          continue;
        }
      }

      if (hard?.maxGamesPerTeamPerDay !== undefined) {
        const { start, end } = this.buildUtcDayRange(gameDate);
        const counts = await Promise.all(
          teams.map(async (teamSeasonId) => {
            const existingCount = await this.scheduleRepository.countTeamGamesInRange(
              teamSeasonId,
              start,
              end,
              leagueSeasonId,
              excludeGameId,
            );
            return { existingCount };
          }),
        );

        const exceeds = counts.some((entry) => entry.existingCount >= hard.maxGamesPerTeamPerDay!);
        if (exceeds) {
          skipped.push({ gameId: assignment.gameId, reason: 'Team daily game limit exceeded' });
          continue;
        }
      }

      if (hard?.maxGamesPerUmpirePerDay !== undefined && umpireIds.length > 0) {
        const { start, end } = this.buildUtcDayRange(gameDate);
        const counts = await Promise.all(
          umpireIds.map(async (umpireId) => {
            const existingCount = await this.scheduleRepository.countUmpireGamesInRange(
              umpireId,
              start,
              end,
              leagueSeasonId,
              excludeGameId,
            );
            return { existingCount };
          }),
        );

        const exceeds = counts.some(
          (entry) => entry.existingCount >= hard.maxGamesPerUmpirePerDay!,
        );
        if (exceeds) {
          skipped.push({ gameId: assignment.gameId, reason: 'Umpire daily game limit exceeded' });
          continue;
        }
      }

      if (hard?.requireLightsAfter?.enabled) {
        const hour = DateUtils.getHourInTimeZone(gameDate, hard.requireLightsAfter.timeZone);
        if (hour === null) {
          throw new ValidationError('Invalid timeZone for requireLightsAfter constraint');
        }

        if (hour >= hard.requireLightsAfter.startHourLocal && !fieldMeta.hasLights) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Field does not have lights for this time slot',
          });
          continue;
        }
      }

      const capacity = fieldMeta.maxParallelGames;
      const existingBookings = await this.scheduleRepository.countFieldBookingsAtTime(
        fieldId,
        gameDate,
        leagueSeasonId,
        excludeGameId,
      );
      if (existingBookings >= capacity) {
        skipped.push({
          gameId: assignment.gameId,
          reason: 'Field is already booked for this date and time',
        });
        continue;
      }

      if (isGenerated) {
        const createData: dbScheduleCreateData = {
          gamedate: gameDate,
          hteamid: homeTeamId,
          vteamid: visitorTeamId,
          leagueid: leagueSeasonId,
          fieldid: fieldId,
          umpire1: umpireIds[0] ?? null,
          umpire2: umpireIds[1] ?? null,
          umpire3: umpireIds[2] ?? null,
          umpire4: umpireIds[3] ?? null,
          hscore: 0,
          vscore: 0,
          comment: '',
          gamestatus: GameStatus.Scheduled,
          gametype: GameType.RegularSeason,
        };
        await this.scheduleRepository.createGame(createData);
      } else {
        const updateData: dbScheduleUpdateData = {
          gamedate: gameDate,
          fieldid: fieldId,
          umpire1: umpireIds[0] ?? null,
          umpire2: umpireIds[1] ?? null,
          umpire3: umpireIds[2] ?? null,
          umpire4: umpireIds[3] ?? null,
        };

        const alreadyApplied =
          dbGamedate !== undefined &&
          dbGamedate.getTime() === gameDate.getTime() &&
          dbFieldid === fieldId &&
          dbUmpire1 === (umpireIds[0] ?? null) &&
          dbUmpire2 === (umpireIds[1] ?? null) &&
          dbUmpire3 === (umpireIds[2] ?? null) &&
          dbUmpire4 === (umpireIds[3] ?? null);

        if (!alreadyApplied) {
          await this.scheduleRepository.updateGame(dbGameId!, updateData);
        }
      }

      appliedGameIds.push(assignment.gameId);
    }

    if (request.mode === 'subset' && targetGameIds) {
      for (const requestedGameId of targetGameIds) {
        const hasAssignment = request.assignments.some(
          (assignment) => assignment.gameId === requestedGameId,
        );
        if (!hasAssignment) {
          skipped.push({
            gameId: requestedGameId,
            reason: 'No assignment provided for requested gameId',
          });
        }
      }
    }

    const status: SchedulerApplyResult['status'] =
      appliedGameIds.length === 0 ? 'failed' : skipped.length === 0 ? 'applied' : 'partial';

    return {
      runId: request.runId,
      status,
      appliedGameIds,
      skipped,
    };
  }

  private resolveTargetGameIds(request: SchedulerApplyRequest): Set<string> | null {
    if (request.mode !== 'subset') {
      return null;
    }

    const gameIds = request.gameIds ?? [];
    const unique = new Set<string>();
    for (const gameId of gameIds) {
      unique.add(gameId);
    }
    return unique;
  }

  private parseBigIntId(value: string, label: string): bigint {
    return ValidationUtils.parseBigInt(value, label);
  }

  private parseDateTime(value: string, label: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError(`Invalid ${label}`);
    }
    return parsed;
  }
}
