import type { SchedulerApplyRequest, SchedulerApplyResult } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import type { dbScheduleUpdateData } from '../repositories/index.js';
import { ValidationError } from '../utils/customErrors.js';

const MAX_UMPIRES_PER_GAME = 4;

export class SchedulerApplyService {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(repository?: IScheduleRepository) {
    this.scheduleRepository = repository ?? RepositoryFactory.getScheduleRepository();
  }

  async applyProposal(
    accountId: bigint,
    request: SchedulerApplyRequest,
  ): Promise<SchedulerApplyResult> {
    const targetGameIds = this.resolveTargetGameIds(request);
    const appliedGameIds: string[] = [];
    const skipped: Array<{ gameId: string; reason: string }> = [];

    for (const assignment of request.assignments) {
      if (targetGameIds && !targetGameIds.has(assignment.gameId)) {
        continue;
      }

      const gameId = this.parseBigIntId(assignment.gameId, 'gameId');
      const fieldId = this.parseBigIntId(assignment.fieldId, 'fieldId');
      const gameDate = this.parseDateTime(assignment.startTime, 'startTime');

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

      const conflict = await this.scheduleRepository.findFieldConflict(
        fieldId,
        gameDate,
        existingGame.leagueid,
        gameId,
      );
      if (conflict) {
        skipped.push({
          gameId: assignment.gameId,
          reason: 'Field is already booked for this date and time',
        });
        continue;
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
