import { describe, it, expect, beforeEach } from 'vitest';
import { GolfLeagueService } from '../golfLeagueService.js';
import {
  type IGolfLeagueRepository,
  type GolfLeagueSetupWithOfficers,
  type GolfAccountInfo,
} from '../../repositories/index.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { golfleaguesetup, contacts } from '#prisma/client';

function createMockContact(overrides: Partial<contacts> = {}): contacts {
  return {
    id: 1n,
    accountid: 100n,
    firstname: 'John',
    lastname: 'Doe',
    middlename: null,
    email: 'john@example.com',
    gender: 'M',
    dob: null,
    address: null,
    address2: null,
    city: null,
    state: null,
    zip: null,
    country: null,
    phone: null,
    phone2: null,
    workphone: null,
    fax: null,
    created: new Date(),
    modified: new Date(),
    modifiedby: null,
    notes: null,
    shirt: null,
    inseam: null,
    bats: null,
    throws: null,
    yearsexp: null,
    lastupdated: null,
    positionsplayed: null,
    preferredpositions: null,
    deletedby: null,
    deletedat: null,
    ...overrides,
  } as contacts;
}

function createMockLeagueSetup(
  overrides: Partial<golfleaguesetup> = {},
): GolfLeagueSetupWithOfficers {
  return {
    id: 1n,
    accountid: 100n,
    leagueday: 2,
    firstteetime: new Date(Date.UTC(1970, 0, 1, 8, 0, 0)),
    timebetweenteetimes: 10,
    holespermatch: 9,
    teeoffformat: 0,
    presidentid: null,
    vicepresidentid: null,
    secretaryid: null,
    treasurerid: null,
    scoringtype: 'team',
    usebestball: false,
    usehandicapscoring: true,
    perholepoints: 1,
    perninepoints: 2,
    permatchpoints: 3,
    totalholespoints: 0,
    againstfieldpoints: 0,
    againstfielddescpoints: 0,
    contacts_golfleaguesetup_presidentidTocontacts: null,
    contacts_golfleaguesetup_vicepresidentidTocontacts: null,
    contacts_golfleaguesetup_secretaryidTocontacts: null,
    contacts_golfleaguesetup_treasureridTocontacts: null,
    ...overrides,
  } as GolfLeagueSetupWithOfficers;
}

describe('GolfLeagueService', () => {
  let setups: GolfLeagueSetupWithOfficers[];
  let accounts: GolfAccountInfo[];
  let repository: IGolfLeagueRepository;
  let service: GolfLeagueService;

  beforeEach(() => {
    setups = [createMockLeagueSetup({ id: 1n, accountid: 100n })];

    accounts = [
      { id: 100n, name: 'Test Golf League', accountTypeName: 'Golf', hasGolfSetup: true },
      { id: 101n, name: 'Another League', accountTypeName: 'Golf', hasGolfSetup: false },
    ];

    repository = {
      async findByAccountId(accountId: bigint): Promise<GolfLeagueSetupWithOfficers | null> {
        return setups.find((s) => s.accountid === accountId) ?? null;
      },
      async create(data): Promise<golfleaguesetup> {
        const created = createMockLeagueSetup({ ...data });
        setups.push(created);
        return created;
      },
      async update(accountId: bigint, data): Promise<golfleaguesetup> {
        const index = setups.findIndex((s) => s.accountid === accountId);
        if (index === -1) {
          throw new NotFoundError('Setup not found');
        }
        const updated = { ...setups[index], ...data };
        setups[index] = updated;
        return updated;
      },
      async getGolfAccounts(): Promise<GolfAccountInfo[]> {
        return [...accounts];
      },
    };

    service = new GolfLeagueService(repository);
  });

  describe('getLeagueSetup', () => {
    it('returns formatted league setup when found', async () => {
      const result = await service.getLeagueSetup(100n);

      expect(result.id).toBe('1');
      expect(result.accountId).toBe('100');
      expect(result.leagueDay).toBe(2);
      expect(result.holesPerMatch).toBe(9);
      expect(result.timeBetweenTeeTimes).toBe(10);
    });

    it('returns scoring config values', async () => {
      const result = await service.getLeagueSetup(100n);

      expect(result.scoringType).toBe('team');
      expect(result.useBestBall).toBe(false);
      expect(result.useHandicapScoring).toBe(true);
      expect(result.perHolePoints).toBe(1);
      expect(result.perNinePoints).toBe(2);
      expect(result.perMatchPoints).toBe(3);
    });

    it('returns null officers when not set', async () => {
      const result = await service.getLeagueSetup(100n);

      expect(result.president).toBeUndefined();
      expect(result.vicePresident).toBeUndefined();
      expect(result.secretary).toBeUndefined();
      expect(result.treasurer).toBeUndefined();
    });

    it('returns officer details when set', async () => {
      const president = createMockContact({ id: 10n, firstname: 'President', lastname: 'One' });
      setups[0].presidentid = 10n;
      setups[0].contacts_golfleaguesetup_presidentidTocontacts = president;

      const result = await service.getLeagueSetup(100n);

      expect(result.president).toBeDefined();
      expect(result.president?.firstName).toBe('President');
      expect(result.president?.lastName).toBe('One');
    });

    it('throws NotFoundError when setup not found', async () => {
      await expect(service.getLeagueSetup(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateLeagueSetup', () => {
    it('updates league day', async () => {
      const result = await service.updateLeagueSetup(100n, { leagueDay: 4 });

      expect(result.leagueDay).toBe(4);
    });

    it('updates first tee time', async () => {
      const result = await service.updateLeagueSetup(100n, { firstTeeTime: '09:30' });

      expect(result.firstTeeTime).toBe('09:30');
    });

    it('updates time between tee times', async () => {
      const result = await service.updateLeagueSetup(100n, { timeBetweenTeeTimes: 15 });

      expect(result.timeBetweenTeeTimes).toBe(15);
    });

    it('updates holes per match', async () => {
      const result = await service.updateLeagueSetup(100n, { holesPerMatch: 18 });

      expect(result.holesPerMatch).toBe(18);
    });

    it('updates tee off format', async () => {
      const result = await service.updateLeagueSetup(100n, { teeOffFormat: 1 });

      expect(result.teeOffFormat).toBe(1);
    });

    it('updates scoring config values', async () => {
      const result = await service.updateLeagueSetup(100n, {
        scoringType: 'individual',
        useBestBall: true,
        useHandicapScoring: false,
        perHolePoints: 5,
        perMatchPoints: 10,
      });

      expect(result.scoringType).toBe('individual');
      expect(result.useBestBall).toBe(true);
      expect(result.useHandicapScoring).toBe(false);
      expect(result.perHolePoints).toBe(5);
      expect(result.perMatchPoints).toBe(10);
    });

    it('updates officer IDs', async () => {
      await service.updateLeagueSetup(100n, {
        presidentId: '10',
        vicePresidentId: '20',
      });

      expect(setups[0].presidentid).toBe(10n);
      expect(setups[0].vicepresidentid).toBe(20n);
    });

    it('clears officer when set to empty string', async () => {
      setups[0].presidentid = 10n;

      await service.updateLeagueSetup(100n, { presidentId: '' });

      expect(setups[0].presidentid).toBeNull();
    });

    it('creates new setup when not found', async () => {
      const result = await service.updateLeagueSetup(999n, { leagueDay: 1 });

      expect(result.accountId).toBe('999');
      expect(result.leagueDay).toBe(1);
      expect(result.scoringType).toBe('team');
      expect(result.useHandicapScoring).toBe(true);
    });

    it('handles partial updates', async () => {
      const original = await service.getLeagueSetup(100n);
      const result = await service.updateLeagueSetup(100n, { leagueDay: 5 });

      expect(result.leagueDay).toBe(5);
      expect(result.holesPerMatch).toBe(original.holesPerMatch);
      expect(result.timeBetweenTeeTimes).toBe(original.timeBetweenTeeTimes);
    });
  });

  describe('getGolfAccounts', () => {
    it('returns formatted list of golf accounts', async () => {
      const result = await service.getGolfAccounts();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('100');
      expect(result[0].name).toBe('Test Golf League');
      expect(result[0].accountTypeName).toBe('Golf');
      expect(result[0].hasGolfSetup).toBe(true);
    });

    it('includes accounts without golf setup', async () => {
      const result = await service.getGolfAccounts();

      const withoutSetup = result.find((a) => a.id === '101');
      expect(withoutSetup).toBeDefined();
      expect(withoutSetup?.hasGolfSetup).toBe(false);
    });

    it('returns empty array when no accounts exist', async () => {
      accounts = [];

      const result = await service.getGolfAccounts();

      expect(result).toHaveLength(0);
    });
  });
});
