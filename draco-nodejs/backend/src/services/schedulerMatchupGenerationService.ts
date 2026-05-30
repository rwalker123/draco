import type {
  SchedulerGenerateMatchupsRequest,
  SchedulerGenerateMatchupsResult,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ServiceFactory } from './serviceFactory.js';
import type { ISchedulerMatchupRepository } from '../repositories/interfaces/ISchedulerMatchupRepository.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import type {
  GeneratorLeagueInput,
  SchedulerMatchupGeneratorService,
} from './schedulerMatchupGeneratorService.js';

export class SchedulerMatchupGenerationService {
  private readonly matchupRepository: ISchedulerMatchupRepository;
  private readonly injectedGeneratorService: SchedulerMatchupGeneratorService | undefined;

  constructor(
    matchupRepository?: ISchedulerMatchupRepository,
    generatorService?: SchedulerMatchupGeneratorService,
  ) {
    this.matchupRepository = matchupRepository ?? RepositoryFactory.getSchedulerMatchupRepository();
    this.injectedGeneratorService = generatorService;
  }

  private get generatorService(): SchedulerMatchupGeneratorService {
    return this.injectedGeneratorService ?? ServiceFactory.getSchedulerMatchupGeneratorService();
  }

  async generateForSeason(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerGenerateMatchupsRequest,
  ): Promise<SchedulerGenerateMatchupsResult> {
    const validLeagueSeasonIds = await this.matchupRepository.listLeagueSeasonIdsBySeasonAndAccount(
      seasonId,
      accountId,
    );
    const validIdSet = new Set(validLeagueSeasonIds.map((id) => id.toString()));

    const requestedIds = request.leagueCounts.map((lc) => lc.leagueSeasonId);
    const unknownIds = requestedIds.filter((id) => !validIdSet.has(id));
    if (unknownIds.length > 0) {
      throw new NotFoundError(
        `League season(s) not found for this account/season: ${unknownIds.join(', ')}`,
      );
    }

    const requestedBigIntIds = requestedIds.map((id) => BigInt(id));
    const teamRows = await this.matchupRepository.listLeagueTeamsWithDivision(requestedBigIntIds);

    const teamsByLeague = new Map<
      string,
      Array<{ teamSeasonId: string; divisionSeasonId: string | null }>
    >();
    for (const row of teamRows) {
      const key = row.leagueseasonid.toString();
      const list = teamsByLeague.get(key) ?? [];
      list.push({
        teamSeasonId: row.teamseasonid.toString(),
        divisionSeasonId: row.divisionseasonid?.toString() ?? null,
      });
      teamsByLeague.set(key, list);
    }

    const generatorInputs: GeneratorLeagueInput[] = request.leagueCounts.map((lc) => {
      const teams = teamsByLeague.get(lc.leagueSeasonId) ?? [];
      if (teams.length === 0) {
        throw new ValidationError(
          `League season ${lc.leagueSeasonId} has no teams enrolled for this season`,
        );
      }
      return {
        leagueSeasonId: lc.leagueSeasonId,
        teams,
        inDivisionGameCount: lc.inDivisionGameCount,
        crossDivisionGameCount: lc.crossDivisionGameCount,
      };
    });

    return this.generatorService.generate(generatorInputs);
  }
}
