import type {
  SchedulerApplyResult,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
} from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';

export class SchedulerSeasonApplyService {
  async applySeasonProposal(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonApplyRequest,
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

    return schedulerApplyService.applyProposal(
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
  }
}
