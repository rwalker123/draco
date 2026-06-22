import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulerProblemSpecService } from '../schedulerProblemSpecService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { ISchedulerProblemSpecRepository } from '../../repositories/interfaces/ISchedulerProblemSpecRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IFieldScheduleConfigRepository } from '../../repositories/interfaces/IFieldScheduleConfigRepository.js';
import type { ISchedulerSeasonConfigRepository } from '../../repositories/interfaces/ISchedulerSeasonConfigRepository.js';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../../repositories/interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';
import type { ISchedulerSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import type { ISchedulerLeagueSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerLeagueSeasonExclusionsRepository.js';
import type { ISchedulerUmpireExclusionsRepository } from '../../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import type { dbSeason } from '../../repositories/types/dbTypes.js';
import type {
  availablefields,
  accounts,
  leagueschedule,
  schedulerseasonconfig,
  schedulerseasonexclusions,
  schedulerteamseasonexclusions,
  schedulerleagueseasonexclusions,
  schedulerumpireexclusions,
  teamsseason,
  fieldopenhours,
  fieldcloseddates,
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
  updateScheduleVisibility = vi.fn<ISeasonsRepository['updateScheduleVisibility']>();
}

class FieldScheduleConfigRepositoryStub implements IFieldScheduleConfigRepository {
  findFieldInAccount = vi.fn<IFieldScheduleConfigRepository['findFieldInAccount']>();
  getConfigForField = vi.fn<IFieldScheduleConfigRepository['getConfigForField']>();
  getConfigsForAccount = vi.fn<IFieldScheduleConfigRepository['getConfigsForAccount']>();
  replaceConfigForField = vi.fn<IFieldScheduleConfigRepository['replaceConfigForField']>();
  listOpenHoursForAccount = vi.fn<IFieldScheduleConfigRepository['listOpenHoursForAccount']>();
  listClosedDatesForAccount = vi.fn<IFieldScheduleConfigRepository['listClosedDatesForAccount']>();
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

class SchedulerLeagueSeasonExclusionsRepositoryStub implements ISchedulerLeagueSeasonExclusionsRepository {
  findForAccount = vi.fn<ISchedulerLeagueSeasonExclusionsRepository['findForAccount']>();
  listForSeason = vi.fn<ISchedulerLeagueSeasonExclusionsRepository['listForSeason']>();
  create = vi.fn<ISchedulerLeagueSeasonExclusionsRepository['create']>();
  update = vi.fn<ISchedulerLeagueSeasonExclusionsRepository['update']>();
  delete = vi.fn<ISchedulerLeagueSeasonExclusionsRepository['delete']>();
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
  schedulevisible: true,
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

const makeField = (id: bigint, overrides?: Partial<availablefields>): availablefields =>
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
    scheduleenabled: true,
    gamelengthminutes: null,
    bufferminutes: 0,
    ...overrides,
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

const makeOpenHours = (
  id: bigint,
  fieldId: bigint,
  dayOfWeek: number,
  startTimeLocal: string,
  endTimeLocal: string,
): fieldopenhours =>
  ({
    id,
    fieldid: fieldId,
    dayofweek: dayOfWeek,
    starttimelocal: startTimeLocal,
    endtimelocal: endTimeLocal,
    createdat: new Date('2026-01-01T00:00:00.000Z'),
    updatedat: new Date('2026-01-01T00:00:00.000Z'),
  }) as fieldopenhours;

const makeClosedDate = (
  id: bigint,
  fieldId: bigint,
  date: Date,
  endDate: Date | null = null,
): fieldcloseddates =>
  ({
    id,
    fieldid: fieldId,
    closeddate: date,
    enddate: endDate,
    note: null,
    createdat: new Date('2026-01-01T00:00:00.000Z'),
    updatedat: new Date('2026-01-01T00:00:00.000Z'),
  }) as fieldcloseddates;

vi.mock('../../repositories/repositoryFactory.js', () => ({
  RepositoryFactory: {
    getSchedulerProblemSpecRepository: vi.fn(),
    getSeasonsRepository: vi.fn(),
    getFieldScheduleConfigRepository: vi.fn(),
    getSchedulerSeasonConfigRepository: vi.fn(),
    getSchedulerSeasonLeagueSelectionsRepository: vi.fn(),
    getSchedulerSeasonExclusionsRepository: vi.fn(),
    getSchedulerTeamSeasonExclusionsRepository: vi.fn(),
    getSchedulerLeagueSeasonExclusionsRepository: vi.fn(),
    getSchedulerUmpireExclusionsRepository: vi.fn(),
  },
}));

describe('SchedulerProblemSpecService', () => {
  let schedulerRepo: SchedulerProblemSpecRepositoryStub;
  let seasonsRepo: SeasonsRepositoryStub;
  let fieldScheduleConfigRepo: FieldScheduleConfigRepositoryStub;
  let seasonConfigRepo: SchedulerSeasonConfigRepositoryStub;
  let seasonLeagueSelectionsRepo: SchedulerSeasonLeagueSelectionsRepositoryStub;
  let seasonExclusionsRepo: SchedulerSeasonExclusionsRepositoryStub;
  let teamExclusionsRepo: SchedulerTeamSeasonExclusionsRepositoryStub;
  let leagueExclusionsRepo: SchedulerLeagueSeasonExclusionsRepositoryStub;
  let umpireExclusionsRepo: SchedulerUmpireExclusionsRepositoryStub;
  let service: SchedulerProblemSpecService;

  beforeEach(() => {
    schedulerRepo = new SchedulerProblemSpecRepositoryStub();
    seasonsRepo = new SeasonsRepositoryStub();
    fieldScheduleConfigRepo = new FieldScheduleConfigRepositoryStub();
    seasonConfigRepo = new SchedulerSeasonConfigRepositoryStub();
    seasonLeagueSelectionsRepo = new SchedulerSeasonLeagueSelectionsRepositoryStub();
    seasonExclusionsRepo = new SchedulerSeasonExclusionsRepositoryStub();
    teamExclusionsRepo = new SchedulerTeamSeasonExclusionsRepositoryStub();
    leagueExclusionsRepo = new SchedulerLeagueSeasonExclusionsRepositoryStub();
    umpireExclusionsRepo = new SchedulerUmpireExclusionsRepositoryStub();

    vi.mocked(RepositoryFactory.getSchedulerProblemSpecRepository).mockReturnValue(schedulerRepo);
    vi.mocked(RepositoryFactory.getSeasonsRepository).mockReturnValue(seasonsRepo);
    vi.mocked(RepositoryFactory.getFieldScheduleConfigRepository).mockReturnValue(
      fieldScheduleConfigRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerSeasonConfigRepository).mockReturnValue(
      seasonConfigRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerSeasonLeagueSelectionsRepository).mockReturnValue(
      seasonLeagueSelectionsRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerSeasonExclusionsRepository).mockReturnValue(
      seasonExclusionsRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerTeamSeasonExclusionsRepository).mockReturnValue(
      teamExclusionsRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerLeagueSeasonExclusionsRepository).mockReturnValue(
      leagueExclusionsRepo,
    );
    vi.mocked(RepositoryFactory.getSchedulerUmpireExclusionsRepository).mockReturnValue(
      umpireExclusionsRepo,
    );

    service = new SchedulerProblemSpecService();

    schedulerRepo.findAccount.mockResolvedValue(makeAccount({ timezoneid: 'UTC' }));
    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([] as fieldopenhours[]);
    fieldScheduleConfigRepo.listClosedDatesForAccount.mockResolvedValue([] as fieldcloseddates[]);
    seasonConfigRepo.findForSeason.mockResolvedValue(makeSeasonWindowConfig());
    seasonLeagueSelectionsRepo.listForSeason.mockResolvedValue([]);
    seasonExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerseasonexclusions[]);
    teamExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerteamseasonexclusions[]);
    leagueExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerleagueseasonexclusions[]);
    umpireExclusionsRepo.listForSeason.mockResolvedValue([] as schedulerumpireexclusions[]);

    schedulerRepo.listSeasonTeams.mockResolvedValue([
      makeTeamSeason(11n, 1001n, 55n),
      makeTeamSeason(12n, 1002n, 55n),
    ]);
    schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n)]);
    schedulerRepo.listSeasonGames.mockResolvedValue([makeGame(999n, 55n, 11n, 12n)]);
  });

  describe('slot generation from field open hours', () => {
    it('produces slots within the open window spaced by gameLength + bufferMinutes', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 15,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '12:00'),
      ]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-06T00:00:00.000Z'),
        }),
      );

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts).toEqual(['2026-04-06T09:00:00.000Z', '2026-04-06T10:15:00.000Z']);
      expect(spec.fieldSlots[0]?.endTime).toBe('2026-04-06T12:00:00.000Z');
      expect(spec.fieldSlots[1]?.fieldId).toBe('100');
    });

    it('spacing uses field gameLength alone when no season default — 90-minute spacing over 4-hour window', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 90,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '13:00'),
      ]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-06T00:00:00.000Z'),
        }),
      );

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts).toEqual(['2026-04-06T09:00:00.000Z', '2026-04-06T10:30:00.000Z']);
      expect(starts).not.toContain('2026-04-06T13:00:00.000Z');
    });

    it('spacing uses smaller of field gameLength vs fallback — field 45 min produces tighter slots than fallback 165 min', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 45,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '11:00'),
      ]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-06T00:00:00.000Z'),
        }),
      );

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts).toEqual(['2026-04-06T09:00:00.000Z', '2026-04-06T09:45:00.000Z']);
    });

    it('uses only field game length when season default is absent', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '10:00', '12:00'),
      ]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-06T00:00:00.000Z'),
        }),
      );

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fieldSlots).toHaveLength(2);
      expect(spec.fieldSlots[0]?.startTime).toBe('2026-04-06T10:00:00.000Z');
      expect(spec.fieldSlots[1]?.startTime).toBe('2026-04-06T11:00:00.000Z');
    });

    it('uses DEFAULT_SCHEDULER_GAME_LENGTH_MINUTES (165) when neither season nor field duration is set', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: null,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '21:00'),
      ]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-06T00:00:00.000Z'),
        }),
      );

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts[0]).toBe('2026-04-06T09:00:00.000Z');
      expect(starts[1]).toBe('2026-04-06T11:45:00.000Z');
      expect(starts[2]).toBe('2026-04-06T14:30:00.000Z');
    });

    it('skips all slots on a closed date', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-07T00:00:00.000Z'),
        }),
      );

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '11:00'),
        makeOpenHours(2n, 100n, 1, '09:00', '11:00'),
      ]);

      fieldScheduleConfigRepo.listClosedDatesForAccount.mockResolvedValue([
        makeClosedDate(1n, 100n, new Date('2026-04-06T00:00:00.000Z')),
      ]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts.every((t) => !t.startsWith('2026-04-06'))).toBe(true);
      expect(starts.some((t) => t.startsWith('2026-04-07'))).toBe(true);
    });

    it('skips every day within a closed-date range (start through end inclusive)', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-09T00:00:00.000Z'),
        }),
      );

      // Open Mon–Thu (bits 0–3) within the window.
      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '11:00'),
        makeOpenHours(2n, 100n, 1, '09:00', '11:00'),
        makeOpenHours(3n, 100n, 2, '09:00', '11:00'),
        makeOpenHours(4n, 100n, 3, '09:00', '11:00'),
      ]);

      // Closed 2026-04-06 through 2026-04-08 (inclusive range).
      fieldScheduleConfigRepo.listClosedDatesForAccount.mockResolvedValue([
        makeClosedDate(
          1n,
          100n,
          new Date('2026-04-06T00:00:00.000Z'),
          new Date('2026-04-08T00:00:00.000Z'),
        ),
      ]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);
      const starts = spec.fieldSlots.map((s) => s.startTime);

      expect(starts.some((t) => t.startsWith('2026-04-06'))).toBe(false);
      expect(starts.some((t) => t.startsWith('2026-04-07'))).toBe(false);
      expect(starts.some((t) => t.startsWith('2026-04-08'))).toBe(false);
      expect(starts.some((t) => t.startsWith('2026-04-09'))).toBe(true);
    });

    it('yields no slots when scheduleenabled is false', async () => {
      const field = makeField(100n, {
        scheduleenabled: false,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '11:00'),
      ]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fieldSlots).toHaveLength(0);
    });

    it('yields no slots when field has no open-hours rows at all', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([] as fieldopenhours[]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fieldSlots).toHaveLength(0);
    });

    it('skips a day that has no open-hours row for that weekday', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      seasonConfigRepo.findForSeason.mockResolvedValue(
        makeSeasonWindowConfig({
          startdate: new Date('2026-04-06T00:00:00.000Z'),
          enddate: new Date('2026-04-07T00:00:00.000Z'),
        }),
      );

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 1, '09:00', '11:00'),
      ]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const starts = spec.fieldSlots.map((s) => s.startTime);
      expect(starts.every((t) => !t.startsWith('2026-04-06'))).toBe(true);
      expect(starts.some((t) => t.startsWith('2026-04-07'))).toBe(true);
    });
  });

  describe('buildProblemSpec — fixedGames population', () => {
    it('populates fixedGames using the assigned field game length when matchups are provided', async () => {
      schedulerRepo.listAccountFields.mockResolvedValue([
        makeField(100n, { gamelengthminutes: 90 }),
      ]);
      schedulerRepo.listSeasonGames.mockResolvedValue([
        {
          ...makeGame(999n, 55n, 11n, 12n),
          gamedate: new Date('2026-04-06T13:00:00.000Z'),
          fieldid: 100n,
          umpire1: 5n,
          umpire2: null,
          umpire3: null,
          umpire4: null,
        } as ReturnType<typeof makeGame>,
      ]);

      const matchup = {
        id: 'rr-1',
        leagueSeasonId: '55',
        homeTeamSeasonId: '11',
        visitorTeamSeasonId: '12',
        requiredUmpires: 2,
      };

      const request: SchedulerSeasonSolveRequest = {
        matchups: [matchup],
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fixedGames).toBeDefined();
      expect(spec.fixedGames).toHaveLength(1);

      const fg = spec.fixedGames![0]!;
      expect(fg.startTime).toBe('2026-04-06T13:00:00.000Z');
      expect(fg.endTime).toBe('2026-04-06T14:30:00.000Z');
      expect(fg.fieldId).toBe('100');
      expect(fg.teamSeasonIds).toEqual(['11', '12']);
      expect(fg.umpireIds).toEqual(['5']);
    });

    it('falls back to the default scheduler game length when the field has no configured length', async () => {
      schedulerRepo.listAccountFields.mockResolvedValue([
        makeField(100n, { gamelengthminutes: null }),
      ]);
      schedulerRepo.listSeasonGames.mockResolvedValue([
        {
          ...makeGame(999n, 55n, 11n, 12n),
          gamedate: new Date('2026-04-06T13:00:00.000Z'),
          fieldid: 100n,
          umpire1: null,
          umpire2: null,
          umpire3: null,
          umpire4: null,
        } as ReturnType<typeof makeGame>,
      ]);

      const request: SchedulerSeasonSolveRequest = {
        matchups: [
          {
            id: 'rr-1',
            leagueSeasonId: '55',
            homeTeamSeasonId: '11',
            visitorTeamSeasonId: '12',
            requiredUmpires: 0,
          },
        ],
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      const fg = spec.fixedGames![0]!;
      expect(fg.startTime).toBe('2026-04-06T13:00:00.000Z');
      expect(fg.endTime).toBe('2026-04-06T15:45:00.000Z');
    });

    it('omits fixedGames when no matchups are provided', async () => {
      schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
      schedulerRepo.listSeasonGames.mockResolvedValue([makeGame(999n, 55n, 11n, 12n)]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fixedGames).toBeUndefined();
    });

    it('omits fieldId from fixedGame when game has no field assigned', async () => {
      schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
      schedulerRepo.listSeasonGames.mockResolvedValue([
        {
          ...makeGame(999n, 55n, 11n, 12n),
          gamedate: new Date('2026-04-06T13:00:00.000Z'),
          fieldid: null,
          umpire1: null,
          umpire2: null,
          umpire3: null,
          umpire4: null,
        } as ReturnType<typeof makeGame>,
      ]);

      const matchup = {
        id: 'rr-1',
        leagueSeasonId: '55',
        homeTeamSeasonId: '11',
        visitorTeamSeasonId: '12',
        requiredUmpires: 2,
      };

      const request: SchedulerSeasonSolveRequest = {
        matchups: [matchup],
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.fixedGames).toBeDefined();
      expect(spec.fixedGames![0]!.fieldId).toBeUndefined();
      expect(spec.fixedGames![0]!.umpireIds).toBeUndefined();
    });
  });

  describe('buildProblemSpec — core spec assembly', () => {
    it('assembles a problem spec from DB data and injects account timezone into requireLightsAfter', async () => {
      const field = makeField(100n, {
        scheduleenabled: true,
        gamelengthminutes: 60,
        bufferminutes: 0,
      });
      schedulerRepo.listAccountFields.mockResolvedValue([field]);

      fieldScheduleConfigRepo.listOpenHoursForAccount.mockResolvedValue([
        makeOpenHours(1n, 100n, 0, '09:00', '11:00'),
      ]);

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
      schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
      schedulerRepo.listSeasonGames.mockResolvedValue([
        makeGame(999n, 55n, 11n, 12n),
        makeGame(1000n, 55n, 11n, 12n),
      ]);

      const request: SchedulerSeasonSolveRequest = {
        gameIds: ['999'],
        objectives: { primary: 'maximize_scheduled_games' },
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.games).toHaveLength(1);
      expect(spec.games[0]?.id).toBe('999');
    });

    it('applies umpiresPerGame override to requiredUmpires', async () => {
      schedulerRepo.listAccountFields.mockResolvedValue([makeField(100n)]);
      schedulerRepo.listAccountUmpires.mockResolvedValue([makeUmpire(5n), makeUmpire(6n)]);

      const request: SchedulerSeasonSolveRequest = {
        objectives: { primary: 'maximize_scheduled_games' },
        umpiresPerGame: 2,
      };

      const spec = await service.buildProblemSpec(accountId, seasonId, request);

      expect(spec.games).toHaveLength(1);
      expect(spec.games[0]?.requiredUmpires).toBe(2);
    });
  });
});
