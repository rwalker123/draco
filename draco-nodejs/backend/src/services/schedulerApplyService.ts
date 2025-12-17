import type { SchedulerApplyRequest, SchedulerApplyResult } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import type { dbScheduleUpdateData } from '../repositories/index.js';
import { ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

const MAX_UMPIRES_PER_GAME = 4;

export class SchedulerApplyService {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(repository?: IScheduleRepository) {
    this.scheduleRepository = repository ?? RepositoryFactory.getScheduleRepository();
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
    request.fields.forEach((field) => {
      fieldMetaById.set(field.id, {
        hasLights: field.properties?.hasLights === true,
        maxParallelGames: Math.max(1, Math.floor(field.properties?.maxParallelGames ?? 1)),
      });
    });
    const batchFieldBookings = new Map<string, number>();
    const batchTeamBookings = new Map<string, number>();
    const batchUmpireBookings = new Map<string, number>();
    const batchTeamDayBookings = new Map<string, number>();
    const batchUmpireDayBookings = new Map<string, number>();

    for (const assignment of request.assignments) {
      if (targetGameIds && !targetGameIds.has(assignment.gameId)) {
        continue;
      }

      const gameId = this.parseBigIntId(assignment.gameId, 'gameId');
      const fieldId = this.parseBigIntId(assignment.fieldId, 'fieldId');
      const gameDate = this.parseDateTime(assignment.startTime, 'startTime');
      const hard = request.constraints?.hard;
      const fieldMeta = fieldMetaById.get(assignment.fieldId);
      if (!fieldMeta) {
        skipped.push({ gameId: assignment.gameId, reason: 'Unknown fieldId' });
        continue;
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
            const teamKey = `${teamSeasonId.toString()}:${gameDate.toISOString()}:${existingGame.leagueid.toString()}`;
            const existingBookings = await this.scheduleRepository.countTeamBookingsAtTime(
              teamSeasonId,
              gameDate,
              existingGame.leagueid,
              gameId,
            );
            const batchBookings = batchTeamBookings.get(teamKey) ?? 0;
            return { teamKey, existingBookings, batchBookings };
          }),
        );

        const hasTeamConflict = teamConflicts.some(
          (entry) => entry.existingBookings + entry.batchBookings > 0,
        );
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
            const umpireKey = `${umpireId.toString()}:${gameDate.toISOString()}:${existingGame.leagueid.toString()}`;
            const existingBookings = await this.scheduleRepository.countUmpireBookingsAtTime(
              umpireId,
              gameDate,
              existingGame.leagueid,
              gameId,
            );
            const batchBookings = batchUmpireBookings.get(umpireKey) ?? 0;
            return { umpireKey, existingBookings, batchBookings };
          }),
        );

        const hasUmpireConflict = umpireConflicts.some(
          (entry) => entry.existingBookings + entry.batchBookings > 0,
        );
        if (hasUmpireConflict) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Umpire is already booked for this date and time',
          });
          continue;
        }
      }

      if (hard?.maxGamesPerTeamPerDay !== undefined) {
        const { start, end, dayKey } = this.buildUtcDayRange(gameDate);
        const teams = [existingGame.hteamid, existingGame.vteamid];
        const counts = await Promise.all(
          teams.map(async (teamSeasonId) => {
            const key = `${teamSeasonId.toString()}:${dayKey}:${existingGame.leagueid.toString()}`;
            const existingCount = await this.scheduleRepository.countTeamGamesInRange(
              teamSeasonId,
              start,
              end,
              existingGame.leagueid,
              gameId,
            );
            const batchCount = batchTeamDayBookings.get(key) ?? 0;
            return { key, existingCount, batchCount };
          }),
        );

        const exceeds = counts.some(
          (entry) => entry.existingCount + entry.batchCount >= hard.maxGamesPerTeamPerDay!,
        );
        if (exceeds) {
          skipped.push({ gameId: assignment.gameId, reason: 'Team daily game limit exceeded' });
          continue;
        }
      }

      if (hard?.maxGamesPerUmpirePerDay !== undefined && umpireIds.length > 0) {
        const { start, end, dayKey } = this.buildUtcDayRange(gameDate);
        const counts = await Promise.all(
          umpireIds.map(async (umpireId) => {
            const key = `${umpireId.toString()}:${dayKey}:${existingGame.leagueid.toString()}`;
            const existingCount = await this.scheduleRepository.countUmpireGamesInRange(
              umpireId,
              start,
              end,
              existingGame.leagueid,
              gameId,
            );
            const batchCount = batchUmpireDayBookings.get(key) ?? 0;
            return { key, existingCount, batchCount };
          }),
        );

        const exceeds = counts.some(
          (entry) => entry.existingCount + entry.batchCount >= hard.maxGamesPerUmpirePerDay!,
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
        const fieldKey = `${assignment.fieldId}:${gameDate.toISOString()}:${existingGame.leagueid.toString()}`;
        const existingBookings = await this.scheduleRepository.countFieldBookingsAtTime(
          fieldId,
          gameDate,
          existingGame.leagueid,
          gameId,
        );
        const batchBookings = batchFieldBookings.get(fieldKey) ?? 0;
        if (existingBookings + batchBookings >= capacity) {
          skipped.push({
            gameId: assignment.gameId,
            reason: 'Field is already booked for this date and time',
          });
          continue;
        }

        batchFieldBookings.set(fieldKey, batchBookings + 1);
      }

      if (hard?.noTeamOverlap) {
        const teams = [existingGame.hteamid, existingGame.vteamid];
        teams.forEach((teamSeasonId) => {
          const key = `${teamSeasonId.toString()}:${gameDate.toISOString()}:${existingGame.leagueid.toString()}`;
          batchTeamBookings.set(key, (batchTeamBookings.get(key) ?? 0) + 1);
        });
      }

      if (hard?.noUmpireOverlap && umpireIds.length > 0) {
        umpireIds.forEach((umpireId) => {
          const key = `${umpireId.toString()}:${gameDate.toISOString()}:${existingGame.leagueid.toString()}`;
          batchUmpireBookings.set(key, (batchUmpireBookings.get(key) ?? 0) + 1);
        });
      }

      if (hard?.maxGamesPerTeamPerDay !== undefined) {
        const { dayKey } = this.buildUtcDayRange(gameDate);
        const teams = [existingGame.hteamid, existingGame.vteamid];
        teams.forEach((teamSeasonId) => {
          const key = `${teamSeasonId.toString()}:${dayKey}:${existingGame.leagueid.toString()}`;
          batchTeamDayBookings.set(key, (batchTeamDayBookings.get(key) ?? 0) + 1);
        });
      }

      if (hard?.maxGamesPerUmpirePerDay !== undefined && umpireIds.length > 0) {
        const { dayKey } = this.buildUtcDayRange(gameDate);
        umpireIds.forEach((umpireId) => {
          const key = `${umpireId.toString()}:${dayKey}:${existingGame.leagueid.toString()}`;
          batchUmpireDayBookings.set(key, (batchUmpireDayBookings.get(key) ?? 0) + 1);
        });
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
