import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeasonService } from '../seasonService.js';
import {
  ISeasonsRepository,
  dbSeasonCopySource,
  dbSeasonWithLeagues,
  dbSeason,
} from '../../repositories/index.js';
import { ConflictError, NotFoundError } from '../../utils/customErrors.js';

class SeasonsRepositoryStub implements ISeasonsRepository {
  findAccountSeasons = vi.fn<ISeasonsRepository['findAccountSeasons']>();

  findSeasonWithLeagues = vi.fn<ISeasonsRepository['findSeasonWithLeagues']>();

  findSeasonById = vi.fn<ISeasonsRepository['findSeasonById']>();

  findSeasonByName = vi.fn<ISeasonsRepository['findSeasonByName']>();

  createSeason = vi.fn<ISeasonsRepository['createSeason']>();

  updateSeasonName = vi.fn<ISeasonsRepository['updateSeasonName']>();

  deleteSeason = vi.fn<ISeasonsRepository['deleteSeason']>();

  findCurrentSeason = vi.fn<ISeasonsRepository['findCurrentSeason']>();

  upsertCurrentSeason = vi.fn<ISeasonsRepository['upsertCurrentSeason']>();

  createLeagueSeason = vi.fn<ISeasonsRepository['createLeagueSeason']>();

  countSeasonParticipants = vi.fn<ISeasonsRepository['countSeasonParticipants']>();

  findSeasonParticipants = vi.fn<ISeasonsRepository['findSeasonParticipants']>();

  findSeasonForCopy = vi.fn<ISeasonsRepository['findSeasonForCopy']>();

  copySeasonStructure = vi.fn<ISeasonsRepository['copySeasonStructure']>();
}

const accountId = 10n;
const seasonId = 25n;

const createSourceSeason = (): dbSeasonCopySource => ({
  id: seasonId,
  name: 'Spring 2024',
  accountid: accountId,
  leagueseason: [
    {
      id: 50n,
      leagueid: 75n,
      divisionseason: [
        {
          id: 150n,
          divisionid: 200n,
          priority: 1,
        },
      ],
      teamsseason: [
        {
          id: 300n,
          teamid: 400n,
          name: 'Panthers',
          divisionseasonid: 150n,
          rosterseason: [
            {
              playerid: 500n,
              playernumber: 12,
              dateadded: new Date('2024-02-01T00:00:00.000Z'),
            },
          ],
          teamseasonmanager: [
            {
              contactid: 600n,
            },
          ],
        },
      ],
    },
  ],
});

const createCopiedSeasonRecord = (): dbSeasonWithLeagues => ({
  id: 999n,
  name: 'Spring 2024 Copy',
  accountid: accountId,
  leagueseason: [
    {
      id: 123n,
      leagueid: 75n,
      league: {
        id: 75n,
        name: 'Majors',
      },
      divisionseason: [
        {
          id: 456n,
          priority: 1,
          divisiondefs: {
            id: 200n,
            name: 'East',
          },
        },
      ],
    },
  ],
});

describe('SeasonService.copySeason', () => {
  let repository: SeasonsRepositoryStub;
  let service: SeasonService;

  beforeEach(() => {
    repository = new SeasonsRepositoryStub();
    service = new SeasonService(repository);
  });

  it('creates a deep copy of the season and returns formatted data', async () => {
    const sourceSeason = createSourceSeason();
    const copiedSeasonRecord = createCopiedSeasonRecord();

    repository.findSeasonForCopy.mockResolvedValue(sourceSeason);
    repository.findSeasonByName.mockResolvedValue(null);
    repository.copySeasonStructure.mockResolvedValue(copiedSeasonRecord);

    const result = await service.copySeason(accountId, seasonId);

    expect(repository.findSeasonForCopy).toHaveBeenCalledWith(accountId, seasonId);
    expect(repository.findSeasonByName).toHaveBeenCalledWith(accountId, 'Spring 2024 Copy');
    expect(repository.copySeasonStructure).toHaveBeenCalledWith(
      accountId,
      sourceSeason,
      'Spring 2024 Copy',
    );

    expect(result).toEqual({
      id: copiedSeasonRecord.id.toString(),
      name: 'Spring 2024 Copy',
      accountId: accountId.toString(),
      isCurrent: false,
      leagues: [
        {
          id: copiedSeasonRecord.leagueseason[0].id.toString(),
          league: {
            id: copiedSeasonRecord.leagueseason[0].league.id.toString(),
            name: 'Majors',
          },
          divisions: [
            {
              id: copiedSeasonRecord.leagueseason[0].divisionseason?.[0].id.toString() ?? '0',
              division: {
                id: copiedSeasonRecord.leagueseason[0].divisionseason?.[0].divisiondefs?.id.toString() ?? '0',
                name:
                  copiedSeasonRecord.leagueseason[0].divisionseason?.[0].divisiondefs?.name ??
                  'Unknown Division',
              },
              priority:
                copiedSeasonRecord.leagueseason[0].divisionseason?.[0].priority ?? 0,
            },
          ],
        },
      ],
    });
  });

  it('throws a conflict error when the copy name already exists', async () => {
    repository.findSeasonForCopy.mockResolvedValue(createSourceSeason());
    repository.findSeasonByName.mockResolvedValue({
      id: 777n,
      name: 'Spring 2024 Copy',
      accountid: accountId,
    } satisfies dbSeason);

    await expect(service.copySeason(accountId, seasonId)).rejects.toBeInstanceOf(ConflictError);
    expect(repository.copySeasonStructure).not.toHaveBeenCalled();
  });

  it('throws when the source season does not belong to the account', async () => {
    repository.findSeasonForCopy.mockResolvedValue(null);

    await expect(service.copySeason(accountId, seasonId)).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findSeasonByName).not.toHaveBeenCalled();
  });
});
