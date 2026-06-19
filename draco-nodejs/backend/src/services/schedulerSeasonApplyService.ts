import type {
  SchedulerApplyResult,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
} from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';

export class SchedulerSeasonApplyService {
  async applySeasonProposal(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonApplyRequest,
    actingUser: { id: string; username: string },
  ): Promise<SchedulerApplyResult> {
    const schedulerProblemSpecService = ServiceFactory.getSchedulerProblemSpecService();
    const schedulerApplyService = ServiceFactory.getSchedulerApplyService();

    const solveLikeRequest: SchedulerSeasonSolveRequest = {
      constraints: request.constraints,
      objectives: undefined,
      gameIds: request.gameIds,
      matchups: request.matchups,
    };
    const spec = await schedulerProblemSpecService.buildProblemSpec(
      accountId,
      seasonId,
      solveLikeRequest,
    );
    const constraints = spec.constraints;

    const result = await schedulerApplyService.applyProposal(
      accountId,
      {
        runId: request.runId,
        mode: request.mode,
        assignments: request.assignments,
        constraints,
        gameIds: request.gameIds,
      },
      { seasonId, matchups: request.matchups, seasonTeams: spec.teams },
    );

    try {
      const auditRepo = RepositoryFactory.getSchedulerApplyAuditLogRepository();
      await auditRepo.create({
        accountid: accountId,
        seasonid: seasonId,
        runid: request.runId,
        mode: request.mode,
        appliedbyuserid: actingUser.id,
        appliedbyusername: actingUser.username,
        appliedcount: result.appliedGameIds.length,
        skippedcount: result.skipped.length,
      });
    } catch (error) {
      console.error('[SchedulerSeasonApplyService] Failed to write audit log:', error);
    }

    return result;
  }
}
