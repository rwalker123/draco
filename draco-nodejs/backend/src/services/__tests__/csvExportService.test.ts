import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CsvExportService } from '../csvExportService.js';
import { IRosterRepository } from '../../repositories/interfaces/IRosterRepository.js';
import { IManagerRepository } from '../../repositories/interfaces/IManagerRepository.js';
import { dbRosterExportData, dbManagerExportData } from '../../repositories/types/dbTypes.js';
import { PayloadTooLargeError } from '../../utils/customErrors.js';

class RosterRepositoryStub implements IRosterRepository {
  findRosterMembersByTeamSeason = vi.fn<IRosterRepository['findRosterMembersByTeamSeason']>();
  findActiveTeamSeasonIdsForUser = vi.fn<IRosterRepository['findActiveTeamSeasonIdsForUser']>();
  findActiveRosterContactsByLeagueSeason =
    vi.fn<IRosterRepository['findActiveRosterContactsByLeagueSeason']>();
  findRosterMemberForAccount = vi.fn<IRosterRepository['findRosterMemberForAccount']>();
  findRosterMemberInLeagueSeason = vi.fn<IRosterRepository['findRosterMemberInLeagueSeason']>();
  countGamesPlayedByTeamSeason = vi.fn<IRosterRepository['countGamesPlayedByTeamSeason']>();
  findRosterPlayerByContactId = vi.fn<IRosterRepository['findRosterPlayerByContactId']>();
  createRosterPlayer = vi.fn<IRosterRepository['createRosterPlayer']>();
  updateRosterPlayer = vi.fn<IRosterRepository['updateRosterPlayer']>();
  createRosterSeasonEntry = vi.fn<IRosterRepository['createRosterSeasonEntry']>();
  updateRosterSeasonEntry = vi.fn<IRosterRepository['updateRosterSeasonEntry']>();
  deleteRosterMember = vi.fn<IRosterRepository['deleteRosterMember']>();
  hasGameStats = vi.fn<IRosterRepository['hasGameStats']>();
  findRosterMembersForExport = vi.fn<IRosterRepository['findRosterMembersForExport']>();
  findLeagueRosterForExport = vi.fn<IRosterRepository['findLeagueRosterForExport']>();
  findSeasonRosterForExport = vi.fn<IRosterRepository['findSeasonRosterForExport']>();
}

class ManagerRepositoryStub implements IManagerRepository {
  findById = vi.fn<IManagerRepository['findById']>();
  findMany = vi.fn<IManagerRepository['findMany']>();
  create = vi.fn<IManagerRepository['create']>();
  update = vi.fn<IManagerRepository['update']>();
  delete = vi.fn<IManagerRepository['delete']>();
  count = vi.fn<IManagerRepository['count']>();
  findSeasonManagers = vi.fn<IManagerRepository['findSeasonManagers']>();
  findTeamManagers = vi.fn<IManagerRepository['findTeamManagers']>();
  findManagersForTeams = vi.fn<IManagerRepository['findManagersForTeams']>();
  createTeamManager = vi.fn<IManagerRepository['createTeamManager']>();
  findTeamManager = vi.fn<IManagerRepository['findTeamManager']>();
  findLeagueManagersForExport = vi.fn<IManagerRepository['findLeagueManagersForExport']>();
  findSeasonManagersForExport = vi.fn<IManagerRepository['findSeasonManagersForExport']>();
}

let mockPlayerIdCounter = 1n;

const createMockRosterExportData = (
  overrides: Partial<{
    playerid: bigint;
    firstname: string | null;
    lastname: string | null;
    middlename: string | null;
    email: string | null;
    streetaddress: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    affiliationduespaid: string;
    seasonid: bigint;
  }> = {},
): dbRosterExportData => {
  const contacts = {
    firstname: overrides.firstname ?? 'John',
    lastname: overrides.lastname ?? 'Doe',
    middlename: overrides.middlename ?? null,
    email: overrides.email ?? 'john@example.com',
    streetaddress: overrides.streetaddress ?? '123 Main St',
    city: overrides.city ?? 'Springfield',
    state: overrides.state ?? 'IL',
    zip: overrides.zip ?? '62701',
  };

  return {
    playerid: overrides.playerid ?? mockPlayerIdCounter++,
    roster: {
      contacts: contacts as dbRosterExportData['roster']['contacts'],
      playerseasonaffiliationdues:
        overrides.affiliationduespaid !== undefined
          ? [
              {
                affiliationduespaid: overrides.affiliationduespaid,
                seasonid: overrides.seasonid ?? 1n,
              },
            ]
          : [],
    },
  };
};

const createMockManagerExportData = (
  overrides: Partial<{
    firstname: string | null;
    lastname: string | null;
    middlename: string | null;
    email: string | null;
    phone1: string | null;
    phone2: string | null;
    phone3: string | null;
    streetaddress: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    leagueName: string;
    teamName: string;
  }> = {},
): dbManagerExportData => {
  const contacts = {
    firstname: overrides.firstname ?? 'Jane',
    lastname: overrides.lastname ?? 'Smith',
    middlename: overrides.middlename ?? null,
    email: overrides.email ?? 'jane@example.com',
    phone1: overrides.phone1 ?? '555-0101',
    phone2: overrides.phone2 ?? '555-0102',
    phone3: overrides.phone3 ?? '555-0103',
    streetaddress: overrides.streetaddress ?? '456 Oak Ave',
    city: overrides.city ?? 'Chicago',
    state: overrides.state ?? 'IL',
    zip: overrides.zip ?? '60601',
  };

  return {
    contacts: contacts as dbManagerExportData['contacts'],
    teamsseason: {
      name: overrides.teamName ?? 'Tigers',
      leagueseason: {
        league: {
          name: overrides.leagueName ?? 'Spring League',
        },
      },
    },
  };
};

describe('CsvExportService', () => {
  let service: CsvExportService;
  let rosterRepository: RosterRepositoryStub;
  let managerRepository: ManagerRepositoryStub;

  beforeEach(() => {
    rosterRepository = new RosterRepositoryStub();
    managerRepository = new ManagerRepositoryStub();
    service = new CsvExportService(rosterRepository, managerRepository);
  });

  describe('exportTeamRoster', () => {
    it('should export team roster with correct filename', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({ seasonid: 1n, affiliationduespaid: 'Yes' }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');

      expect(result.fileName).toBe('panthers-roster.csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(rosterRepository.findRosterMembersForExport).toHaveBeenCalledWith(100n, 1n);
    });

    it('should sanitize special characters in filename', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([]);

      const result = await service.exportTeamRoster(100n, 1n, "Team O'Malley's");

      expect(result.fileName).toBe('team-o-malley-s-roster.csv');
    });

    it('should include roster data in CSV', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          streetaddress: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          affiliationduespaid: 'Yes',
          seasonid: 1n,
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('john@example.com');
      expect(csvContent).toContain('123 Main St');
      expect(csvContent).toContain('Springfield');
      expect(csvContent).toContain('IL');
      expect(csvContent).toContain('62701');
      expect(csvContent).toContain('Yes');
    });

    it('should handle null values gracefully', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          lastname: 'Doe',
          email: null,
          streetaddress: null,
          city: null,
          state: null,
          zip: null,
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Doe');
    });

    it('should format full name with middle name', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          middlename: 'Michael',
          lastname: 'Doe',
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Michael Doe');
    });

    it('should include affiliation dues status when present', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({ affiliationduespaid: 'Paid', seasonid: 1n }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Paid');
    });

    it('should handle missing dues information', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData(), // No dues info
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });

  describe('exportLeagueRoster', () => {
    it('should export league roster with correct filename', async () => {
      rosterRepository.findLeagueRosterForExport.mockResolvedValue([
        createMockRosterExportData({ seasonid: 1n, affiliationduespaid: 'Yes' }),
      ]);

      const result = await service.exportLeagueRoster(50n, 1n, 'Spring League');

      expect(result.fileName).toBe('spring-league-roster.csv');
      expect(rosterRepository.findLeagueRosterForExport).toHaveBeenCalledWith(50n, 1n);
    });

    it('should handle empty roster', async () => {
      rosterRepository.findLeagueRosterForExport.mockResolvedValue([]);

      const result = await service.exportLeagueRoster(50n, 1n, 'Empty League');

      expect(result.fileName).toBe('empty-league-roster.csv');
      expect(result.buffer.toString()).toBe('');
    });
  });

  describe('exportSeasonRoster', () => {
    it('should export season roster with correct filename', async () => {
      rosterRepository.findSeasonRosterForExport.mockResolvedValue([
        createMockRosterExportData({ seasonid: 1n, affiliationduespaid: 'Yes' }),
      ]);

      const result = await service.exportSeasonRoster(1n, 10n, 'Spring 2024');

      expect(result.fileName).toBe('spring-2024-roster.csv');
      expect(rosterRepository.findSeasonRosterForExport).toHaveBeenCalledWith(1n, 10n);
    });
  });

  describe('exportLeagueManagers', () => {
    it('should export league managers with correct filename', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue([
        createMockManagerExportData(),
      ]);

      const result = await service.exportLeagueManagers(50n, 'Spring League');

      expect(result.fileName).toBe('spring-league-managers.csv');
      expect(managerRepository.findLeagueManagersForExport).toHaveBeenCalledWith(50n);
    });

    it('should include manager data in CSV', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue([
        createMockManagerExportData({
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
          phone1: '555-0101',
          phone2: '555-0102',
          phone3: '555-0103',
          streetaddress: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          leagueName: 'Spring League',
          teamName: 'Tigers',
        }),
      ]);

      const result = await service.exportLeagueManagers(50n, 'Spring League');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Jane Smith');
      expect(csvContent).toContain('jane@example.com');
      expect(csvContent).toContain('555-0101');
      expect(csvContent).toContain('555-0102');
      expect(csvContent).toContain('555-0103');
      expect(csvContent).toContain('456 Oak Ave');
      expect(csvContent).toContain('Chicago');
      expect(csvContent).toContain('IL');
      expect(csvContent).toContain('60601');
      expect(csvContent).toContain('Spring League - Tigers');
    });

    it('should format league/team name correctly', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue([
        createMockManagerExportData({
          leagueName: 'Major Division',
          teamName: 'Panthers',
        }),
      ]);

      const result = await service.exportLeagueManagers(50n, 'Major Division');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Major Division - Panthers');
    });

    it('should handle null phone numbers', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue([
        createMockManagerExportData({
          phone1: null,
          phone2: null,
          phone3: null,
        }),
      ]);

      const result = await service.exportLeagueManagers(50n, 'Spring League');

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });

  describe('exportSeasonManagers', () => {
    it('should export season managers with correct filename', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue([
        createMockManagerExportData(),
      ]);

      const result = await service.exportSeasonManagers(1n, 10n, 'Spring 2024');

      expect(result.fileName).toBe('spring-2024-managers.csv');
      expect(managerRepository.findSeasonManagersForExport).toHaveBeenCalledWith(1n, 10n);
    });

    it('should handle empty manager list', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue([]);

      const result = await service.exportSeasonManagers(1n, 10n, 'Empty Season');

      expect(result.fileName).toBe('empty-season-managers.csv');
      expect(result.buffer.toString()).toBe('');
    });
  });

  describe('filename sanitization', () => {
    it('should convert to lowercase', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([]);
      const result = await service.exportTeamRoster(100n, 1n, 'TEAM NAME');
      expect(result.fileName).toBe('team-name-roster.csv');
    });

    it('should replace spaces with hyphens', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([]);
      const result = await service.exportTeamRoster(100n, 1n, 'Team Name');
      expect(result.fileName).toBe('team-name-roster.csv');
    });

    it('should replace special characters', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([]);
      const result = await service.exportTeamRoster(100n, 1n, 'Team #1 (Best!)');
      expect(result.fileName).toBe('team--1--best---roster.csv');
    });

    it('should preserve hyphens and underscores', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([]);
      const result = await service.exportTeamRoster(100n, 1n, 'Team-Name_2024');
      expect(result.fileName).toBe('team-name_2024-roster.csv');
    });
  });

  describe('full name formatting', () => {
    it('should handle first and last name only', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          middlename: null,
          lastname: 'Doe',
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Team');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Doe');
    });

    it('should handle first name only', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          middlename: null,
          lastname: null,
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Team');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John');
    });

    it('should handle last name only', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: null,
          middlename: null,
          lastname: 'Doe',
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Team');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Doe');
    });

    it('should handle all name parts', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          firstname: 'John',
          middlename: 'Michael',
          lastname: 'Doe',
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Team');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Michael Doe');
    });
  });

  describe('export limits', () => {
    const createLargeDataset = (count: number): dbRosterExportData[] => {
      return Array.from({ length: count }, (_, i) =>
        createMockRosterExportData({
          firstname: `User${i}`,
          lastname: 'Test',
          seasonid: 1n,
          affiliationduespaid: 'Yes',
        }),
      );
    };

    const createLargeManagerDataset = (count: number): dbManagerExportData[] => {
      return Array.from({ length: count }, (_, i) =>
        createMockManagerExportData({
          firstname: `Manager${i}`,
          lastname: 'Test',
        }),
      );
    };

    it('should throw PayloadTooLargeError when team roster exceeds 10,000 rows', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue(createLargeDataset(10001));

      await expect(service.exportTeamRoster(100n, 1n, 'Large Team')).rejects.toThrow(
        PayloadTooLargeError,
      );
      await expect(service.exportTeamRoster(100n, 1n, 'Large Team')).rejects.toThrow(
        /Export limit exceeded: 10001 rows requested, maximum is 10000/,
      );
    });

    it('should throw PayloadTooLargeError when league roster exceeds 10,000 rows', async () => {
      rosterRepository.findLeagueRosterForExport.mockResolvedValue(createLargeDataset(10001));

      await expect(service.exportLeagueRoster(50n, 1n, 'Large League')).rejects.toThrow(
        PayloadTooLargeError,
      );
    });

    it('should throw PayloadTooLargeError when season roster exceeds 10,000 rows', async () => {
      rosterRepository.findSeasonRosterForExport.mockResolvedValue(createLargeDataset(10001));

      await expect(service.exportSeasonRoster(1n, 10n, 'Large Season')).rejects.toThrow(
        PayloadTooLargeError,
      );
    });

    it('should throw PayloadTooLargeError when league managers exceeds 10,000 rows', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue(
        createLargeManagerDataset(10001),
      );

      await expect(service.exportLeagueManagers(50n, 'Large League')).rejects.toThrow(
        PayloadTooLargeError,
      );
    });

    it('should throw PayloadTooLargeError when season managers exceeds 10,000 rows', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue(
        createLargeManagerDataset(10001),
      );

      await expect(service.exportSeasonManagers(1n, 10n, 'Large Season')).rejects.toThrow(
        PayloadTooLargeError,
      );
    });

    it('should allow export at exactly 10,000 rows', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue(createLargeDataset(10000));

      const result = await service.exportTeamRoster(100n, 1n, 'Max Team');

      expect(result.fileName).toBe('max-team-roster.csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should include row count and limit in error message', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue(createLargeDataset(15000));

      try {
        await service.exportTeamRoster(100n, 1n, 'Huge Team');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PayloadTooLargeError);
        expect((error as Error).message).toBe(
          'Export limit exceeded: 15000 rows requested, maximum is 10000',
        );
      }
    });
  });
});
