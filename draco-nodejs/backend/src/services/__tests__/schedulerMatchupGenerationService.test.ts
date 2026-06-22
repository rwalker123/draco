import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerMatchupGenerationService } from '../schedulerMatchupGenerationService.js';
import type { ISchedulerMatchupRepository } from '../../repositories/interfaces/ISchedulerMatchupRepository.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type {
  SchedulerGenerateMatchupsRequest,
  SchedulerGenerateMatchupsResult,
} from '@draco/shared-schemas';
import type { SchedulerMatchupGeneratorService } from '../schedulerMatchupGeneratorService.js';
import { partialMock } from '../../test-utils/partialMock.js';

class MatchupRepositoryStub implements ISchedulerMatchupRepository {
  listLeagueTeamsWithDivision = vi.fn<ISchedulerMatchupRepository['listLeagueTeamsWithDivision']>();
  listLeagueSeasonIdsBySeasonAndAccount =
    vi.fn<ISchedulerMatchupRepository['listLeagueSeasonIdsBySeasonAndAccount']>();
}

const makeGeneratorStub = (
  result: SchedulerGenerateMatchupsResult,
): Mocked<SchedulerMatchupGeneratorService> =>
  partialMock<SchedulerMatchupGeneratorService>({ generate: vi.fn().mockReturnValue(result) });

const ACCOUNT_ID = BigInt(1);
const SEASON_ID = BigInt(100);
const LEAGUE_SEASON_ID = '500';

const makeRequest = (leagueSeasonId = LEAGUE_SEASON_ID): SchedulerGenerateMatchupsRequest => ({
  leagueCounts: [
    { leagueSeasonId: leagueSeasonId, inDivisionGameCount: 2, crossDivisionGameCount: 1 },
  ],
});

const makeEmptyResult = (): SchedulerGenerateMatchupsResult => ({
  matchups: [],
  summary: [],
});

describe('SchedulerMatchupGenerationService', () => {
  let repo: MatchupRepositoryStub;
  let service: SchedulerMatchupGenerationService;

  beforeEach(() => {
    repo = new MatchupRepositoryStub();

    repo.listLeagueSeasonIdsBySeasonAndAccount.mockResolvedValue([BigInt(LEAGUE_SEASON_ID)]);
    repo.listLeagueTeamsWithDivision.mockResolvedValue([
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(1),
        divisionseasonid: BigInt(50),
      },
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(2),
        divisionseasonid: BigInt(50),
      },
    ]);

    service = new SchedulerMatchupGenerationService(repo, makeGeneratorStub(makeEmptyResult()));
  });

  it('returns the generator result on a valid request', async () => {
    const result = await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());
    expect(result).toEqual(makeEmptyResult());
  });

  it('calls listLeagueSeasonIdsBySeasonAndAccount with the correct seasonId and accountId', async () => {
    await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());
    expect(repo.listLeagueSeasonIdsBySeasonAndAccount).toHaveBeenCalledWith(SEASON_ID, ACCOUNT_ID);
  });

  it('calls listLeagueTeamsWithDivision with bigint ids from the request', async () => {
    await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());
    expect(repo.listLeagueTeamsWithDivision).toHaveBeenCalledWith([BigInt(LEAGUE_SEASON_ID)]);
  });

  it('passes correct GeneratorLeagueInput to the generator', async () => {
    const generatorStub = makeGeneratorStub(makeEmptyResult());
    service = new SchedulerMatchupGenerationService(repo, generatorStub);

    await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());

    expect(generatorStub.generate).toHaveBeenCalledWith([
      {
        leagueSeasonId: LEAGUE_SEASON_ID,
        teams: [
          { teamSeasonId: '1', divisionSeasonId: '50' },
          { teamSeasonId: '2', divisionSeasonId: '50' },
        ],
        inDivisionGameCount: 2,
        crossDivisionGameCount: 1,
      },
    ]);
  });

  it('excludes teams not assigned to a division (inactive teams)', async () => {
    repo.listLeagueTeamsWithDivision.mockResolvedValue([
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(1),
        divisionseasonid: BigInt(50),
      },
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(2),
        divisionseasonid: BigInt(50),
      },
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(3),
        divisionseasonid: null,
      },
    ]);
    const generatorStub = makeGeneratorStub(makeEmptyResult());
    service = new SchedulerMatchupGenerationService(repo, generatorStub);

    await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());

    expect(generatorStub.generate).toHaveBeenCalledWith([
      expect.objectContaining({
        teams: [
          { teamSeasonId: '1', divisionSeasonId: '50' },
          { teamSeasonId: '2', divisionSeasonId: '50' },
        ],
      }),
    ]);
  });

  it('throws ValidationError when a league has only teams without a division', async () => {
    repo.listLeagueTeamsWithDivision.mockResolvedValue([
      { leagueseasonid: BigInt(LEAGUE_SEASON_ID), teamseasonid: BigInt(1), divisionseasonid: null },
    ]);

    await expect(service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest())).rejects.toThrow(
      ValidationError,
    );
  });

  it('throws NotFoundError when a requested leagueSeasonId does not belong to the account/season', async () => {
    repo.listLeagueSeasonIdsBySeasonAndAccount.mockResolvedValue([BigInt(999)]);

    await expect(
      service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest(LEAGUE_SEASON_ID)),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError with the offending id in the message', async () => {
    repo.listLeagueSeasonIdsBySeasonAndAccount.mockResolvedValue([]);

    await expect(
      service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest(LEAGUE_SEASON_ID)),
    ).rejects.toThrow(LEAGUE_SEASON_ID);
  });

  it('throws ValidationError when a valid league has no teams', async () => {
    repo.listLeagueTeamsWithDivision.mockResolvedValue([]);

    await expect(service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest())).rejects.toThrow(
      ValidationError,
    );
  });

  it('converts divisionseasonid bigint to string in generator input', async () => {
    repo.listLeagueTeamsWithDivision.mockResolvedValue([
      {
        leagueseasonid: BigInt(LEAGUE_SEASON_ID),
        teamseasonid: BigInt(10),
        divisionseasonid: BigInt(77),
      },
    ]);
    const generatorStub = makeGeneratorStub(makeEmptyResult());
    service = new SchedulerMatchupGenerationService(repo, generatorStub);

    await service.generateForSeason(ACCOUNT_ID, SEASON_ID, makeRequest());

    expect(generatorStub.generate).toHaveBeenCalledWith([
      expect.objectContaining({
        teams: [{ teamSeasonId: '10', divisionSeasonId: '77' }],
      }),
    ]);
  });
});
