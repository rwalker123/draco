import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulerProblemSpecService } from '../schedulerProblemSpecService.js';
import type { ISchedulerProblemSpecRepository } from '../../repositories/interfaces/ISchedulerProblemSpecRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { ISchedulerFieldAvailabilityRulesRepository } from '../../repositories/interfaces/ISchedulerFieldAvailabilityRulesRepository.js';
import type { ISchedulerFieldExclusionDatesRepository } from '../../repositories/interfaces/ISchedulerFieldExclusionDatesRepository.js';
import type { ISchedulerSeasonConfigRepository } from '../../repositories/interfaces/ISchedulerSeasonConfigRepository.js';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../../repositories/interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';
import type { ISchedulerSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import type { ISchedulerUmpireExclusionsRepository } from '../../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import type { dbSeason } from '../../repositories/types/dbTypes.js';
import type {
  availablefields,
  accounts,
  leagueschedule,
  schedulerseasonconfig,
  schedulerseasonexclusions,
  schedulerfieldexclusiondates,
  schedulerfieldavailabilityrules,
  schedulerteamseasonexclusions,
  schedulerumpireexclusions,
  teamsseason,
} from '#prisma/client';
import type { SchedulerSeasonSolveRequest } from '@draco/shared-schemas';
import type { dbLeagueUmpireWithContact } from '../../repositories/types/dbTypes.js';

class SchedulerProblemSpecRepositoryStub implements ISchedulerProblemSpecRepository {
  findAccount = vi.fn<ISchedulerProblemSpecRepository['findAccount']>();
  listSeasonTeams = vi.fn<ISchedulerProblemSpecRepository['listSeasonTeams']>();
  listAccountFields = vi.fn<ISchedulerProblemSpecRepository['listAccountFields']>();
  listAccountUmpires = vi.fn<ISchedulerProblemSpecRepository['listAccountUmpires']>();
  listSeasonGames = vi.fn<ISchedulerProblemSpecRepository['listSeasonGames']>();
}

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

class SchedulerFieldAvailabilityRulesRepositoryStub implements ISchedulerFieldAvailabilityRulesRepository {
  findById = vi.fn<ISchedulerFieldAvailabilityRulesRepository['findById']>();
  findForAccount = vi.fn<ISchedulerFieldAvailabilityRulesRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerFieldAvailabilityRulesRepository['listForSeason']>();
  create = vi.fn<ISchedulerFieldAvailabilityRulesRepository['create']>();
  update = vi.fn<ISchedulerFieldAvailabilityRulesRepository['update']>();
  delete = vi.fn<ISchedulerFieldAvailabilityRulesRepository['delete']>();
}

class SchedulerFieldExclusionDatesRepositoryStub implements ISchedulerFieldExclusionDatesRepository {
  findById = vi.fn<ISchedulerFieldExclusionDatesRepository['findById']>();
  findForAccount = vi.fn<ISchedulerFieldExclusionDatesRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerFieldExclusionDatesRepository['listForSeason']>();
  create = vi.fn<ISchedulerFieldExclusionDatesRepository['create']>();
  update = vi.fn<ISchedulerFieldExclusionDatesRepository['update']>();
  delete = vi.fn<ISchedulerFieldExclusionDatesRepository['delete']>();
}

class SchedulerSeasonConfigRepositoryStub implements ISchedulerSeasonConfigRepository {
  findForSeason = vi.fn<ISchedulerSeasonConfigRepository['findForSeason']>();
  upsertForSeason = vi.fn<ISchedulerSeasonConfigRepository['upsertForSeason']>();
}

class SchedulerSeasonLeagueSelectionsRepositoryStub implements ISchedulerSeasonLeagueSelectionsRepository {
  listForSeason = vi.fn<ISchedulerSeasonLeagueSelectionsRepository['listForSeason']>();
  replaceForSeason = vi.fn<ISchedulerSeasonLeagueSelectionsRepository['replaceForSeason']>();
}

class SchedulerSeasonExclusionsRepositoryStub implements ISchedulerSeasonExclusionsRepository {
  findForAccount = vi.fn<ISchedulerSeasonExclusionsRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerSeasonExclusionsRepository['listForSeason']>();
  create = vi.fn<ISchedulerSeasonExclusionsRepository['create']>();
  update = vi.fn<ISchedulerSeasonExclusionsRepository['update']>();
  delete = vi.fn<ISchedulerSeasonExclusionsRepository['delete']>();
}

class SchedulerTeamSeasonExclusionsRepositoryStub implements ISchedulerTeamSeasonExclusionsRepository {
  findForAccount = vi.fn<ISchedulerTeamSeasonExclusionsRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerTeamSeasonExclusionsRepository['listForSeason']>();
  create = vi.fn<ISchedulerTeamSeasonExclusionsRepository['create']>();
  update = vi.fn<ISchedulerTeamSeasonExclusionsRepository['update']>();
  delete = vi.fn<ISchedulerTeamSeasonExclusionsRepository['delete']>();
}

class SchedulerUmpireExclusionsRepositoryStub implements ISchedulerUmpireExclusionsRepository {
  findForAccount = vi.fn<ISchedulerUmpireExclusionsRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerUmpireExclusionsRepository['listForSeason']>();
  create = vi.fn<ISchedulerUmpireExclusionsRepository['create']>();
  update = vi.fn<ISchedulerUmpireExclusionsRepository['update']>();
  delete = vi.fn<ISchedulerUmpireExclusionsRepository['delete']>();
}

const accountId = 42n;
const seasonId = 7n;

const makeAccount = (overrides: Partial<accounts>): accounts =>
  ({
    id: accountId,
    name: 'Test Account',
    firstyear: 0,
    accounttypeid: 1n,
    affiliationid: 1n,
    timezoneid: overrides.timezoneid ?? 'UTC',
    youtubeuserid: null,
    facebookfanpage: null,
    defaultvideo: '',
    autoplayvideo: false,
    owneruserid: null,
  }) as accounts;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Test Season',
  accountid: accountId,
});

const makeSeasonWindowConfig = (
  overrides?: Partial<schedulerseasonconfig>,
): schedulerseasonconfig =>
  ({
    seasonid: seasonId,
    accountid: accountId,
    startdate: new Date('2026-04-06T00:00:00.000Z'),
    enddate: new Date('2026-04-06T00:00:00.000Z'),
    umpirespergame: 2,
    maxgamesperumpireperday: null,
    createdat: new Date('2026-01-01T00:00:00.000Z'),
    updatedat: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as schedulerseasonconfig;

const makeTeamSeason = (id: bigint, teamId: bigint, leagueSeasonId: bigint): teamsseason =>
  ({
    id,
    teamid: teamId,
    leagueseasonid: leagueSeasonId,
    divisionseasonid: null,
  }) as teamsseason;

const makeField = (id: bigint): availablefields =>
  ({
    id,
    accountid: accountId,
    name: `Field ${id}`,
    shortname: `F${id}`,
    comment: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    directions: '',
    rainoutnumber: '',
    latitude: '',
    longitude: '',
    haslights: true,
    maxparallelgames: 1,
    schedulerstartincrementminutes: 60,
  }) as availablefields;

const makeUmpire = (id: bigint): dbLeagueUmpireWithContact =>
  ({
    id,
    accountid: accountId,
    contactid: 99n,
    contacts: {
      id: 99n,
      firstname: `Umpire${id}`,
      lastname: 'Test',
      email: `umpire${id}@example.com`,
    },
  }) as dbLeagueUmpireWithContact;

const makeGame = (
  id: bigint,
  leagueSeasonId: bigint,
  homeTeamSeasonId: bigint,
  visitorTeamSeasonId: bigint,
): leagueschedule =>
  ({
    id,
    leagueid: leagueSeasonId,
    hteamid: homeTeamSeasonId,
    vteamid: visitorTeamSeasonId,
    fieldid: 100n,
    gamedate: new Date('2026-04-06T00:00:00.000Z'),
    hscore: 0,
    vscore: 0,
    comment: '',
    gamestatus: 0,
    gametype: 0,
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
  }) as leagueschedule;

const makeRule = (id: bigint, fieldId: bigint): schedulerfieldavailabilityrules =>
  ({
    id,
    accountid: accountId,
    seasonid: seasonId,
    fieldid: fieldId,
    startdate: new Date('2026-04-06T00:00:00.000Z'),
    enddate: new Date('2026-04-06T00:00:00.000Z'),
    daysofweekmask: 1, // Monday
    starttimelocal: '09:00',
    endtimelocal: '11:00',
    startincrementminutes: 60,
    enabled: true,
  }) as schedulerfieldavailabilityrules;

const makeOpenRule = (
  id: bigint,
  fieldId: bigint,
  overrides?: Partial<schedulerfieldavailabilityrules>,
): schedulerfieldavailabilityrules =>
  ({
    id,
    accountid: accountId,
    seasonid: seasonId,
    fieldid: fieldId,
    startdate: null,
    enddate: null,
    daysofweekmask: 1, // Monday
    starttimelocal: '13:00',
    endtimelocal: '15:00',
    startincrementminutes: 60,
    enabled: true,
    ...overrides,
  }) as schedulerfieldavailabilityrules;

describe('SchedulerProblemSpecService.buildProblemSpec', () => {
  let schedulerRepo: SchedulerProblemSpecRepositoryStub;
  let seasonsRepo: SeasonsRepositoryStub;
  let rulesRepo: SchedulerFieldAvailabilityRulesRepositoryStub;
  let exclusionsRepo: SchedulerFieldExclusionDatesRepositoryStub;
  let seasonConfigRepo: SchedulerSeasonConfigRepositoryStub;
  let seasonLeagueSelectionsRepo: SchedulerSeasonLeagueSelectionsRepositoryStub;
  let seasonExclusionsRepo: SchedulerSeasonExclusionsRepositoryStub;
  let teamExclusionsRepo: SchedulerTeamSeasonExclusionsRepositoryStub;
  let umpireExclusionsRepo: SchedulerUmpireExclusionsRepositoryStub;
  let service: SchedulerProblemSpecService;

  beforeEach(() => {
    schedulerRepo = new SchedulerProblemSpecRepositoryStub();
    seasonsRepo = new SeasonsRepositoryStub();
    rulesRepo = new SchedulerFieldAvailabilityRulesRepositoryStub();
    exclusionsRepo = new SchedulerFieldExclusionDatesRepositoryStub();
    seasonConfigRepo = new SchedulerSeasonConfigRepositoryStub();
    seasonLeagueSelectionsRepo = new SchedulerSeasonLeagueSelectionsRepositoryStub();
    seasonExclusionsRepo = new SchedulerSeasonExclusionsRepositoryStub();
    teamExclusionsRepo = new SchedulerTeamSeasonExclusionsRepositoryStub();
    umpireExclusionsRepo = new SchedulerUmpireExclusionsRepositoryStub();
    service = new SchedulerProblemSpecService(
      schedulerRepo,
      seasonsRepo,
      rulesRepo,
      exclusionsRepo,
      seasonConfigRepo,
      seasonLeagueSelectionsRepo,
      seasonExclusionsRepo,
      teamExclusionsRepo,
      umpireExclusionsRepo,
    );

    schedulerRepo.findAccount.mockResolvedValue(makeAccount({ timezoneid: 'UTC' }));
    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    exclusionsRepo.listForSeason.mockResolvedValue([] as schedulerfieldexclusiondates[]);
    seasonConfigRepo.findForSeason.mockResolvedValue(makeSeasonWindowConfig());
    seasonLeagueSelectionsRepo.listForSeason.mockResolvedValue([]);
    seasonExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerseasonexclusions[]);
    teamExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerteamseasonexclusions[]);
    umpireExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerumpireexclusions[]);
  });

  it('assembles a problem spec from DB data and injects account timezone into requireLightsAfter', async () => {
    schedulerRepo.listSeasonTeams.mockResolvedValue([
      makeTeamSeason(11n, 1001n, 55n),
      makeTeamSeason(12n, 1002n, 55n),
    ]);
    schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
    schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n)]);
    schedulerRepo.listSeasonGames.mockResolvedValue([makeGame(999n, 55n, 11n, 12n)]);
    rulesRepo.listForSeason.mockResolvedValue([makeRule(1n, 100n)]);
    exclusionsRepo.listForSeason.mockResolvedValue([] as schedulerfieldexclusiondates[]);

    const request: SchedulerSeasonSolveRequest = {
      constraints: {
        hard: {
          requireLightsAfter: { enabled: true, startHourLocal: 18 },
        },
      },
      objectives: { primary: 'maximize_scheduled_games' },
    };

    const spec = await service.buildProblemSpec(accountId, seasonId, request);
    expect(spec.season.startDate).toBe('2026-04-06');
    expect(spec.season.endDate).toBe('2026-04-06');
    expect(spec.fieldSlots).toHaveLength(2);
    expect(spec.fieldSlots[0]?.startTime).toBe('2026-04-06T09:00:00.000Z');
    expect(spec.fieldSlots[1]?.startTime).toBe('2026-04-06T10:00:00.000Z');
    expect(spec.fieldSlots[0]?.endTime).toBe('2026-04-06T11:00:00.000Z');

    expect(spec.constraints?.hard?.requireLightsAfter?.timeZone).toBe('UTC');
  });

  it('filters games when gameIds is provided', async () => {
    schedulerRepo.listSeasonTeams.mockResolvedValue([
      makeTeamSeason(11n, 1001n, 55n),
      makeTeamSeason(12n, 1002n, 55n),
    ]);
    schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
    schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n)]);
    schedulerRepo.listSeasonGames.mockResolvedValue([
      makeGame(999n, 55n, 11n, 12n),
      makeGame(1000n, 55n, 11n, 12n),
    ]);
    rulesRepo.listForSeason.mockResolvedValue([makeRule(1n, 100n)]);
    exclusionsRepo.listForSeason.mockResolvedValue([] as schedulerfieldexclusiondates[]);

    const request: SchedulerSeasonSolveRequest = {
      gameIds: ['999'],
      objectives: { primary: 'maximize_scheduled_games' },
    };

    const spec = await service.buildProblemSpec(accountId, seasonId, request);
    expect(spec.games).toHaveLength(1);
    expect(spec.games[0]?.id).toBe('999');
  });

  it('applies umpiresPerGame override to requiredUmpires', async () => {
    schedulerRepo.listSeasonTeams.mockResolvedValue([
      makeTeamSeason(11n, 1001n, 55n),
      makeTeamSeason(12n, 1002n, 55n),
    ]);
    schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
    schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n), makeUmpire(6n)]);
    schedulerRepo.listSeasonGames.mockResolvedValue([makeGame(999n, 55n, 11n, 12n)]);
    rulesRepo.listForSeason.mockResolvedValue([makeRule(1n, 100n)]);
    exclusionsRepo.listForSeason.mockResolvedValue([] as schedulerfieldexclusiondates[]);

    const request: SchedulerSeasonSolveRequest = {
      objectives: { primary: 'maximize_scheduled_games' },
      umpiresPerGame: 2,
    };

    const spec = await service.buildProblemSpec(accountId, seasonId, request);
    expect(spec.games).toHaveLength(1);
    expect(spec.games[0]?.requiredUmpires).toBe(2);
  });

  it('treats rules with omitted date bounds as covering the derived season window', async () => {
    schedulerRepo.listSeasonTeams.mockResolvedValue([
      makeTeamSeason(11n, 1001n, 55n),
      makeTeamSeason(12n, 1002n, 55n),
    ]);
    schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
    schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n)]);
    schedulerRepo.listSeasonGames.mockResolvedValue([makeGame(999n, 55n, 11n, 12n)]);
    rulesRepo.listForSeason.mockResolvedValue([makeRule(1n, 100n), makeOpenRule(2n, 100n)]);
    exclusionsRepo.listForSeason.mockResolvedValue([] as schedulerfieldexclusiondates[]);

    const request: SchedulerSeasonSolveRequest = {
      objectives: { primary: 'maximize_scheduled_games' },
    };

    const spec = await service.buildProblemSpec(accountId, seasonId, request);
    expect(spec.season.startDate).toBe('2026-04-06');
    expect(spec.season.endDate).toBe('2026-04-06');

    const starts = spec.fieldSlots.map((slot) => slot.startTime).sort();
    expect(starts).toContain('2026-04-06T09:00:00.000Z');
    expect(starts).toContain('2026-04-06T10:00:00.000Z');
    expect(starts).toContain('2026-04-06T13:00:00.000Z');
    expect(starts).toContain('2026-04-06T14:00:00.000Z');
  });
});
