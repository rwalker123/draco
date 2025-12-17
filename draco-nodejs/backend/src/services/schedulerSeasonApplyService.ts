import type {
  SchedulerApplyResult,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
} from '@draco/shared-schemas';
import { SchedulerApplyService } from './schedulerApplyService.js';
import { SchedulerProblemSpecService } from './schedulerProblemSpecService.js';

export class SchedulerSeasonApplyService {
  constructor(
    private readonly schedulerProblemSpecService: SchedulerProblemSpecService = new SchedulerProblemSpecService(),
    private readonly schedulerApplyService: SchedulerApplyService = new SchedulerApplyService(),
  ) {}

  async applySeasonProposal(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonApplyRequest,
  ): Promise<SchedulerApplyResult> {
    const solveLikeRequest: SchedulerSeasonSolveRequest = {
      constraints: request.constraints,
      objectives: undefined,
      gameIds: request.gameIds,
    };
    const spec = await this.schedulerProblemSpecService.buildProblemSpec(
      accountId,
      seasonId,
      solveLikeRequest,
    );
    const constraints = spec.constraints;

    return this.schedulerApplyService.applyProposal(
      accountId,
      {
        runId: request.runId,
        mode: request.mode,
        assignments: request.assignments,
        constraints,
        gameIds: request.gameIds,
      },
      { seasonId },
    );
  }
}
