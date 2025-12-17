import type { SchedulerApplyRequest, SchedulerApplyResult } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import type { IFieldRepository } from '../repositories/interfaces/IFieldRepository.js';
import type { dbScheduleUpdateData } from '../repositories/index.js';
import { ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

const MAX_UMPIRES_PER_GAME = 4;

export class SchedulerApplyService {
  private readonly scheduleRepository: IScheduleRepository;
  private readonly fieldRepository: IFieldRepository;

  constructor(repositories?: {
    scheduleRepository?: IScheduleRepository;
    fieldRepository?: IFieldRepository;
  }) {
    this.scheduleRepository =
      repositories?.scheduleRepository ?? RepositoryFactory.getScheduleRepository();
    this.fieldRepository = repositories?.fieldRepository ?? RepositoryFactory.getFieldRepository();
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
  ): Promise<SchedulerApplyResult> {
    const targetGameIds = this.resolveTargetGameIds(request);
    const appliedGameIds: string[] = [];
    const skipped: Array<{ gameId: string; reason: string }> = [];
    const fieldMetaById = new Map<string, { hasLights: boolean; maxParallelGames: number }>();

    for (const assignment of request.assignments) {
      if (targetGameIds && !targetGameIds.has(assignment.gameId)) {
        continue;
      }

      const gameId = this.parseBigIntId(assignment.gameId, 'gameId');
      const fieldId = this.parseBigIntId(assignment.fieldId, 'fieldId');
      const gameDate = this.parseDateTime(assignment.startTime, 'startTime');
      const hard = request.constraints?.hard;

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

      const existingGame = await this.scheduleRepository.findGameWithAccountContext(
        gameId,
        accountId,
      );
      if (!existingGame) {
        skipped.push({ gameId: assignment.gameId, reason: 'Game not found' });
        continue;
      }

      if (hard?.noTeamOverlap) {
        const teams = [existingGame.hteamid, existingGame.vteamid];
        const teamConflicts = await Promise.all(
          teams.map(async (teamSeasonId) => {
            const existingBookings = await this.scheduleRepository.countTeamBookingsAtTime(
              teamSeasonId,
              gameDate,
              existingGame.leagueid,
              gameId,
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
      }

      if (hard?.noUmpireOverlap && umpireIds.length > 0) {
        const umpireConflicts = await Promise.all(
          umpireIds.map(async (umpireId) => {
            const existingBookings = await this.scheduleRepository.countUmpireBookingsAtTime(
              umpireId,
              gameDate,
              existingGame.leagueid,
              gameId,
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
        const teams = [existingGame.hteamid, existingGame.vteamid];
        const counts = await Promise.all(
          teams.map(async (teamSeasonId) => {
            const existingCount = await this.scheduleRepository.countTeamGamesInRange(
              teamSeasonId,
              start,
              end,
              existingGame.leagueid,
              gameId,
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
              existingGame.leagueid,
              gameId,
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

      if (hard?.noFieldOverlap) {
        const capacity = fieldMeta.maxParallelGames;
        const existingBookings = await this.scheduleRepository.countFieldBookingsAtTime(
          fieldId,
          gameDate,
          existingGame.leagueid,
          gameId,
        );
        if (existingBookings >= capacity) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Field is already booked for this date and time',
          });
          continue;
        }
      }

      const updateData: dbScheduleUpdateData = {
        gamedate: gameDate,
        fieldid: fieldId,
        umpire1: umpireIds[0] ?? null,
        umpire2: umpireIds[1] ?? null,
        umpire3: umpireIds[2] ?? null,
        umpire4: umpireIds[3] ?? null,
      };

      const alreadyApplied =
        existingGame.gamedate.getTime() === gameDate.getTime() &&
        existingGame.fieldid === fieldId &&
        existingGame.umpire1 === (umpireIds[0] ?? null) &&
        existingGame.umpire2 === (umpireIds[1] ?? null) &&
        existingGame.umpire3 === (umpireIds[2] ?? null) &&
        existingGame.umpire4 === (umpireIds[3] ?? null);

      if (!alreadyApplied) {
        await this.scheduleRepository.updateGame(gameId, updateData);
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
    try {
      return BigInt(value);
    } catch {
      throw new ValidationError(`Invalid ${label}`);
    }
  }

  private parseDateTime(value: string, label: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError(`Invalid ${label}`);
    }
    return parsed;
  }
}
