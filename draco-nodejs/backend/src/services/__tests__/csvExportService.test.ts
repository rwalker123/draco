import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CsvExportService } from '../csvExportService.js';
import type {
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
  PlayerCareerBattingRowType,
  PlayerCareerPitchingRowType,
} from '@draco/shared-schemas';
import { IRosterRepository } from '../../repositories/interfaces/IRosterRepository.js';
import { IManagerRepository } from '../../repositories/interfaces/IManagerRepository.js';
import {
  IContactRepository,
  ContactExportOptions,
} from '../../repositories/interfaces/IContactRepository.js';
import { IRoleRepository } from '../../repositories/interfaces/IRoleRepository.js';
import {
  dbRosterExportData,
  dbManagerExportData,
  dbContactExportData,
  dbWaiverExportData,
  dbAspnetRole,
} from '../../repositories/types/dbTypes.js';
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
  findTeamWaiverRosterForExport = vi.fn<IRosterRepository['findTeamWaiverRosterForExport']>();
  findLeagueWaiverRosterForExport = vi.fn<IRosterRepository['findLeagueWaiverRosterForExport']>();
  findTeamMissingWaiverRosterForExport =
    vi.fn<IRosterRepository['findTeamMissingWaiverRosterForExport']>();
  findLeagueMissingWaiverRosterForExport =
    vi.fn<IRosterRepository['findLeagueMissingWaiverRosterForExport']>();
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

class ContactRepositoryStub implements IContactRepository {
  findById = vi.fn<IContactRepository['findById']>();
  findMany = vi.fn<IContactRepository['findMany']>();
  create = vi.fn<IContactRepository['create']>();
  update = vi.fn<IContactRepository['update']>();
  delete = vi.fn<IContactRepository['delete']>();
  count = vi.fn<IContactRepository['count']>();
  findRosterByContactId = vi.fn<IContactRepository['findRosterByContactId']>();
  findContactInAccount = vi.fn<IContactRepository['findContactInAccount']>();
  findAccountOwner = vi.fn<IContactRepository['findAccountOwner']>();
  isAccountOwner = vi.fn<IContactRepository['isAccountOwner']>();
  findByUserId = vi.fn<IContactRepository['findByUserId']>();
  findContactsByUserIds = vi.fn<IContactRepository['findContactsByUserIds']>();
  findContactsWithRolesByAccountId =
    vi.fn<IContactRepository['findContactsWithRolesByAccountId']>();
  findActiveSeasonRosterContacts = vi.fn<IContactRepository['findActiveSeasonRosterContacts']>();
  searchContactsWithRoles = vi.fn<IContactRepository['searchContactsWithRoles']>();
  searchContactsByName = vi.fn<IContactRepository['searchContactsByName']>();
  findAvailableContacts = vi.fn<IContactRepository['findAvailableContacts']>();
  findContactsForExport = vi.fn<IContactRepository['findContactsForExport']>();
  findCurrentSeasonTeamsForContact =
    vi.fn<IContactRepository['findCurrentSeasonTeamsForContact']>();
  findSeasonTeamWaiversForContacts =
    vi.fn<IContactRepository['findSeasonTeamWaiversForContacts']>();
  hasCareerStatistics = vi.fn<IContactRepository['hasCareerStatistics']>();
  findMyTeamSeasons = vi.fn<IContactRepository['findMyTeamSeasons']>();
}

class RoleRepositoryStub implements IRoleRepository {
  findById = vi.fn<IRoleRepository['findById']>();
  findMany = vi.fn<IRoleRepository['findMany']>();
  create = vi.fn<IRoleRepository['create']>();
  update = vi.fn<IRoleRepository['update']>();
  delete = vi.fn<IRoleRepository['delete']>();
  count = vi.fn<IRoleRepository['count']>();
  findAllRoles = vi.fn<IRoleRepository['findAllRoles']>();
  findGlobalRoles = vi.fn<IRoleRepository['findGlobalRoles']>();
  findRoleId = vi.fn<IRoleRepository['findRoleId']>();
  findRoleName = vi.fn<IRoleRepository['findRoleName']>();
  removeContactRole = vi.fn<IRoleRepository['removeContactRole']>();
  findRole = vi.fn<IRoleRepository['findRole']>();
  getUsersWithRole = vi.fn<IRoleRepository['getUsersWithRole']>();
  findAccountIdsForUserRoles = vi.fn<IRoleRepository['findAccountIdsForUserRoles']>();
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
    submittedwaiver: boolean;
    seasonid: bigint;
    leagueName: string;
    teamName: string;
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

  const seasonId = overrides.seasonid ?? 1n;
  const rosterseasonEntry = {
    inactive: false,
    submittedwaiver: overrides.submittedwaiver ?? true,
    teamsseason: {
      name: overrides.teamName ?? 'Panthers',
      leagueseason: {
        seasonid: seasonId,
        league: {
          name: overrides.leagueName ?? 'Spring League',
        },
      },
    },
  };

  return {
    playerid: overrides.playerid ?? mockPlayerIdCounter++,
    roster: {
      contacts: contacts as dbRosterExportData['roster']['contacts'],
      rosterseason: [rosterseasonEntry] as dbRosterExportData['roster']['rosterseason'],
    },
  };
};

const createMockWaiverExportData = (
  overrides: Partial<{
    firstname: string | null;
    lastname: string | null;
    middlename: string | null;
    email: string | null;
    streetaddress: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    teamName: string;
  }> = {},
): dbWaiverExportData => {
  return {
    submittedwaiver: true,
    teamsseason: {
      name: overrides.teamName ?? 'Panthers',
    },
    roster: {
      contacts: {
        firstname: 'firstname' in overrides ? overrides.firstname : 'John',
        lastname: 'lastname' in overrides ? overrides.lastname : 'Doe',
        middlename: 'middlename' in overrides ? overrides.middlename : null,
        email: 'email' in overrides ? overrides.email : 'john@example.com',
        streetaddress: 'streetaddress' in overrides ? overrides.streetaddress : '123 Main St',
        city: 'city' in overrides ? overrides.city : 'Springfield',
        state: 'state' in overrides ? overrides.state : 'IL',
        zip: 'zip' in overrides ? overrides.zip : '62701',
      } as dbWaiverExportData['roster']['contacts'],
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

const createMockContactExportData = (
  overrides: Partial<{
    firstname: string;
    lastname: string;
    middlename: string;
    email: string | null;
    phone1: string | null;
    phone2: string | null;
    phone3: string | null;
    streetaddress: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    dateofbirth: Date;
    roleIds: string[];
  }> = {},
): dbContactExportData => {
  return {
    firstname: overrides.firstname ?? 'Alice',
    lastname: overrides.lastname ?? 'Johnson',
    middlename: overrides.middlename ?? '',
    email: overrides.email ?? 'alice@example.com',
    phone1: overrides.phone1 ?? '555-1111',
    phone2: overrides.phone2 ?? null,
    phone3: overrides.phone3 ?? null,
    streetaddress: overrides.streetaddress ?? '789 Elm St',
    city: overrides.city ?? 'Denver',
    state: overrides.state ?? 'CO',
    zip: overrides.zip ?? '80202',
    dateofbirth: overrides.dateofbirth ?? new Date('1990-05-15'),
    contactroles: (overrides.roleIds ?? []).map((roleid) => ({ roleid })),
  } as dbContactExportData;
};

const createMockRoles = (): dbAspnetRole[] => [
  { id: 'role-1', name: 'Account Admin' },
  { id: 'role-2', name: 'Team Admin' },
  { id: 'role-3', name: 'League Admin' },
];

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
        createMockRosterExportData({ seasonid: 1n, submittedwaiver: true }),
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
          submittedwaiver: true,
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
          submittedwaiver: true,
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Michael Doe');
    });

    it('should show Yes for submitted waiver', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({ submittedwaiver: true, seasonid: 1n }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Yes');
    });

    it('should show No for unsubmitted waiver', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({ submittedwaiver: false, seasonid: 1n }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('No');
    });

    it('should include registered teams in CSV', async () => {
      rosterRepository.findRosterMembersForExport.mockResolvedValue([
        createMockRosterExportData({
          seasonid: 1n,
          leagueName: 'Spring League',
          teamName: 'Panthers',
        }),
      ]);

      const result = await service.exportTeamRoster(100n, 1n, 'Panthers');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Spring League / Panthers');
    });
  });

  describe('exportLeagueRoster', () => {
    it('should export league roster with correct filename', async () => {
      rosterRepository.findLeagueRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [createMockRosterExportData({ seasonid: 1n, submittedwaiver: true })],
      });

      const result = await service.exportLeagueRoster(1n, 1n, 50n);

      expect(result.fileName).toBe('spring-league-roster.csv');
      expect(rosterRepository.findLeagueRosterForExport).toHaveBeenCalledWith(1n, 1n, 50n);
    });

    it('should handle empty roster', async () => {
      rosterRepository.findLeagueRosterForExport.mockResolvedValue({
        leagueName: 'Empty League',
        members: [],
      });

      const result = await service.exportLeagueRoster(1n, 1n, 50n);

      expect(result.fileName).toBe('empty-league-roster.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should report Yes when a deduplicated player has a waiver on any season team', async () => {
      const multiTeamPlayer: dbRosterExportData = {
        playerid: 999n,
        roster: {
          contacts: {
            firstname: 'Multi',
            lastname: 'Team',
            middlename: '',
            email: 'multi@example.com',
            streetaddress: '1 Main St',
            city: 'Town',
            state: 'IL',
            zip: '00000',
          } as dbRosterExportData['roster']['contacts'],
          rosterseason: [
            {
              inactive: false,
              submittedwaiver: false,
              teamsseason: {
                name: 'Team A',
                leagueseason: { seasonid: 1n, league: { name: 'League A' } },
              },
            },
            {
              inactive: false,
              submittedwaiver: true,
              teamsseason: {
                name: 'Team B',
                leagueseason: { seasonid: 1n, league: { name: 'League B' } },
              },
            },
          ] as dbRosterExportData['roster']['rosterseason'],
        },
      };
      rosterRepository.findLeagueRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [multiTeamPlayer],
      });

      const result = await service.exportLeagueRoster(1n, 1n, 50n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Yes');
      expect(csvContent).toContain('League A / Team A');
      expect(csvContent).toContain('League B / Team B');
    });
  });

  describe('exportSeasonRoster', () => {
    it('should export season roster with correct filename', async () => {
      rosterRepository.findSeasonRosterForExport.mockResolvedValue({
        seasonName: 'Spring 2024',
        members: [createMockRosterExportData({ seasonid: 1n, submittedwaiver: true })],
      });

      const result = await service.exportSeasonRoster(10n, 1n);

      expect(result.fileName).toBe('spring-2024-roster.csv');
      expect(rosterRepository.findSeasonRosterForExport).toHaveBeenCalledWith(10n, 1n);
    });
  });

  describe('exportTeamWaivers', () => {
    it('should export team waivers with correct filename', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [createMockWaiverExportData()],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);

      expect(result.fileName).toBe('panthers-waivers.csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(rosterRepository.findTeamWaiverRosterForExport).toHaveBeenCalledWith(1n, 1n, 100n);
    });

    it('should include waiver data in CSV', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [
          createMockWaiverExportData({
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            streetaddress: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            teamName: 'Panthers',
          }),
        ],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('john@example.com');
      expect(csvContent).toContain('123 Main St');
      expect(csvContent).toContain('Springfield');
      expect(csvContent).toContain('IL');
      expect(csvContent).toContain('62701');
      expect(csvContent).toContain('Panthers');
    });

    it('should include Team column header', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [createMockWaiverExportData()],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Team');
    });

    it('should filter out records with null email', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [
          createMockWaiverExportData({ email: null }),
          createMockWaiverExportData({
            firstname: 'Jane',
            lastname: 'Smith',
            email: 'jane@example.com',
          }),
        ],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).not.toContain('John Doe');
      expect(csvContent).toContain('Jane Smith');
    });

    it('should filter out records with empty email', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [
          createMockWaiverExportData({ email: '' }),
          createMockWaiverExportData({
            firstname: 'Jane',
            lastname: 'Smith',
            email: 'jane@example.com',
          }),
        ],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).not.toContain('John Doe');
      expect(csvContent).toContain('Jane Smith');
    });

    it('should apply the export limit after filtering out records without email', async () => {
      const members = [
        ...Array.from({ length: 10000 }, (_, i) =>
          createMockWaiverExportData({ firstname: `User${i}`, email: `user${i}@example.com` }),
        ),
        ...Array.from({ length: 5 }, () => createMockWaiverExportData({ email: null })),
      ];
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Edge Team',
        members,
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.fileName).toBe('edge-team-waivers.csv');
    });

    it('should handle empty waiver list', async () => {
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Empty Team',
        members: [],
      });

      const result = await service.exportTeamWaivers(1n, 1n, 100n);

      expect(result.fileName).toBe('empty-team-waivers.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should throw PayloadTooLargeError when waivers exceed 10,000 rows', async () => {
      const largeDataset = Array.from({ length: 10001 }, (_, i) =>
        createMockWaiverExportData({ firstname: `User${i}`, email: `user${i}@example.com` }),
      );
      rosterRepository.findTeamWaiverRosterForExport.mockResolvedValue({
        teamName: 'Large Team',
        members: largeDataset,
      });

      await expect(service.exportTeamWaivers(1n, 1n, 100n)).rejects.toThrow(PayloadTooLargeError);
    });
  });

  describe('exportLeagueWaivers', () => {
    it('should export league waivers with correct filename', async () => {
      rosterRepository.findLeagueWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [createMockWaiverExportData()],
      });

      const result = await service.exportLeagueWaivers(1n, 1n, 50n);

      expect(result.fileName).toBe('spring-league-waivers.csv');
      expect(rosterRepository.findLeagueWaiverRosterForExport).toHaveBeenCalledWith(1n, 1n, 50n);
    });

    it('should include team name in exported data', async () => {
      rosterRepository.findLeagueWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [
          createMockWaiverExportData({
            teamName: 'Tigers',
            firstname: 'Alice',
            lastname: 'Jones',
            email: 'alice@example.com',
          }),
          createMockWaiverExportData({
            teamName: 'Panthers',
            firstname: 'Bob',
            lastname: 'Smith',
            email: 'bob@example.com',
          }),
        ],
      });

      const result = await service.exportLeagueWaivers(1n, 1n, 50n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Tigers');
      expect(csvContent).toContain('Panthers');
    });

    it('should handle empty league waiver list', async () => {
      rosterRepository.findLeagueWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Empty League',
        members: [],
      });

      const result = await service.exportLeagueWaivers(1n, 1n, 50n);

      expect(result.fileName).toBe('empty-league-waivers.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should throw PayloadTooLargeError when league waivers exceed 10,000 rows', async () => {
      const largeDataset = Array.from({ length: 10001 }, (_, i) =>
        createMockWaiverExportData({ firstname: `User${i}`, email: `user${i}@example.com` }),
      );
      rosterRepository.findLeagueWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Large League',
        members: largeDataset,
      });

      await expect(service.exportLeagueWaivers(1n, 1n, 50n)).rejects.toThrow(PayloadTooLargeError);
    });
  });

  describe('exportLeagueManagers', () => {
    it('should export league managers with correct filename', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue({
        leagueName: 'Spring League',
        managers: [createMockManagerExportData()],
      });

      const result = await service.exportLeagueManagers(1n, 1n, 50n);

      expect(result.fileName).toBe('spring-league-managers.csv');
      expect(managerRepository.findLeagueManagersForExport).toHaveBeenCalledWith(1n, 1n, 50n);
    });

    it('should include manager data in CSV', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue({
        leagueName: 'Spring League',
        managers: [
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
        ],
      });

      const result = await service.exportLeagueManagers(1n, 1n, 50n);
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
      managerRepository.findLeagueManagersForExport.mockResolvedValue({
        leagueName: 'Major Division',
        managers: [
          createMockManagerExportData({
            leagueName: 'Major Division',
            teamName: 'Panthers',
          }),
        ],
      });

      const result = await service.exportLeagueManagers(1n, 1n, 50n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Major Division - Panthers');
    });

    it('should handle null phone numbers', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue({
        leagueName: 'Spring League',
        managers: [
          createMockManagerExportData({
            phone1: null,
            phone2: null,
            phone3: null,
          }),
        ],
      });

      const result = await service.exportLeagueManagers(1n, 1n, 50n);

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });

  describe('exportSeasonManagers', () => {
    it('should export season managers with correct filename', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue({
        seasonName: 'Spring 2024',
        managers: [createMockManagerExportData()],
      });

      const result = await service.exportSeasonManagers(10n, 1n);

      expect(result.fileName).toBe('spring-2024-managers.csv');
      expect(managerRepository.findSeasonManagersForExport).toHaveBeenCalledWith(10n, 1n);
    });

    it('should handle empty manager list', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue({
        seasonName: 'Empty Season',
        managers: [],
      });

      const result = await service.exportSeasonManagers(10n, 1n);

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
          submittedwaiver: true,
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
          submittedwaiver: true,
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
          submittedwaiver: true,
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
          submittedwaiver: true,
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
          submittedwaiver: true,
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
      rosterRepository.findLeagueRosterForExport.mockResolvedValue({
        leagueName: 'Large League',
        members: createLargeDataset(10001),
      });

      await expect(service.exportLeagueRoster(1n, 1n, 50n)).rejects.toThrow(PayloadTooLargeError);
    });

    it('should throw PayloadTooLargeError when season roster exceeds 10,000 rows', async () => {
      rosterRepository.findSeasonRosterForExport.mockResolvedValue({
        seasonName: 'Large Season',
        members: createLargeDataset(10001),
      });

      await expect(service.exportSeasonRoster(10n, 1n)).rejects.toThrow(PayloadTooLargeError);
    });

    it('should throw PayloadTooLargeError when league managers exceeds 10,000 rows', async () => {
      managerRepository.findLeagueManagersForExport.mockResolvedValue({
        leagueName: 'Large League',
        managers: createLargeManagerDataset(10001),
      });

      await expect(service.exportLeagueManagers(1n, 1n, 50n)).rejects.toThrow(PayloadTooLargeError);
    });

    it('should throw PayloadTooLargeError when season managers exceeds 10,000 rows', async () => {
      managerRepository.findSeasonManagersForExport.mockResolvedValue({
        seasonName: 'Large Season',
        managers: createLargeManagerDataset(10001),
      });

      await expect(service.exportSeasonManagers(10n, 1n)).rejects.toThrow(PayloadTooLargeError);
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

  describe('exportTeamMissingWaivers', () => {
    it('should export team missing waivers with correct filename', async () => {
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [createMockWaiverExportData()],
      });

      const result = await service.exportTeamMissingWaivers(1n, 1n, 100n);

      expect(result.fileName).toBe('panthers-missing-waivers.csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(rosterRepository.findTeamMissingWaiverRosterForExport).toHaveBeenCalledWith(
        1n,
        1n,
        100n,
      );
    });

    it('should include player data in CSV', async () => {
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [
          createMockWaiverExportData({
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            streetaddress: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            teamName: 'Panthers',
          }),
        ],
      });

      const result = await service.exportTeamMissingWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('john@example.com');
      expect(csvContent).toContain('123 Main St');
      expect(csvContent).toContain('Springfield');
      expect(csvContent).toContain('IL');
      expect(csvContent).toContain('62701');
      expect(csvContent).toContain('Panthers');
    });

    it('should include players with null email (unlike regular waiver export)', async () => {
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [
          createMockWaiverExportData({ firstname: 'No', lastname: 'Email', email: null }),
          createMockWaiverExportData({
            firstname: 'Has',
            lastname: 'Email',
            email: 'has@example.com',
          }),
        ],
      });

      const result = await service.exportTeamMissingWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('No Email');
      expect(csvContent).toContain('Has Email');
    });

    it('should include players with empty email', async () => {
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Panthers',
        members: [createMockWaiverExportData({ firstname: 'Empty', lastname: 'Email', email: '' })],
      });

      const result = await service.exportTeamMissingWaivers(1n, 1n, 100n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Empty Email');
    });

    it('should handle empty list', async () => {
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Empty Team',
        members: [],
      });

      const result = await service.exportTeamMissingWaivers(1n, 1n, 100n);

      expect(result.fileName).toBe('empty-team-missing-waivers.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should throw PayloadTooLargeError when missing waivers exceed 10,000 rows', async () => {
      const largeDataset = Array.from({ length: 10001 }, (_, i) =>
        createMockWaiverExportData({ firstname: `User${i}` }),
      );
      rosterRepository.findTeamMissingWaiverRosterForExport.mockResolvedValue({
        teamName: 'Large Team',
        members: largeDataset,
      });

      await expect(service.exportTeamMissingWaivers(1n, 1n, 100n)).rejects.toThrow(
        PayloadTooLargeError,
      );
    });
  });

  describe('exportLeagueMissingWaivers', () => {
    it('should export league missing waivers with correct filename', async () => {
      rosterRepository.findLeagueMissingWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [createMockWaiverExportData()],
      });

      const result = await service.exportLeagueMissingWaivers(1n, 1n, 50n);

      expect(result.fileName).toBe('spring-league-missing-waivers.csv');
      expect(rosterRepository.findLeagueMissingWaiverRosterForExport).toHaveBeenCalledWith(
        1n,
        1n,
        50n,
      );
    });

    it('should include team name in exported data', async () => {
      rosterRepository.findLeagueMissingWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [
          createMockWaiverExportData({
            teamName: 'Tigers',
            firstname: 'Alice',
            lastname: 'Jones',
          }),
          createMockWaiverExportData({
            teamName: 'Panthers',
            firstname: 'Bob',
            lastname: 'Smith',
          }),
        ],
      });

      const result = await service.exportLeagueMissingWaivers(1n, 1n, 50n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Tigers');
      expect(csvContent).toContain('Panthers');
    });

    it('should include players with null email (unlike regular waiver export)', async () => {
      rosterRepository.findLeagueMissingWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Spring League',
        members: [
          createMockWaiverExportData({ firstname: 'No', lastname: 'Email', email: null }),
          createMockWaiverExportData({
            firstname: 'Has',
            lastname: 'Email',
            email: 'has@example.com',
          }),
        ],
      });

      const result = await service.exportLeagueMissingWaivers(1n, 1n, 50n);
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('No Email');
      expect(csvContent).toContain('Has Email');
    });

    it('should handle empty league missing waiver list', async () => {
      rosterRepository.findLeagueMissingWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Empty League',
        members: [],
      });

      const result = await service.exportLeagueMissingWaivers(1n, 1n, 50n);

      expect(result.fileName).toBe('empty-league-missing-waivers.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should throw PayloadTooLargeError when league missing waivers exceed 10,000 rows', async () => {
      const largeDataset = Array.from({ length: 10001 }, (_, i) =>
        createMockWaiverExportData({ firstname: `User${i}` }),
      );
      rosterRepository.findLeagueMissingWaiverRosterForExport.mockResolvedValue({
        leagueName: 'Large League',
        members: largeDataset,
      });

      await expect(service.exportLeagueMissingWaivers(1n, 1n, 50n)).rejects.toThrow(
        PayloadTooLargeError,
      );
    });
  });

  describe('exportContacts', () => {
    let contactRepository: ContactRepositoryStub;
    let roleRepository: RoleRepositoryStub;
    let contactService: CsvExportService;

    beforeEach(() => {
      contactRepository = new ContactRepositoryStub();
      roleRepository = new RoleRepositoryStub();
      contactService = new CsvExportService(
        rosterRepository,
        managerRepository,
        contactRepository,
        roleRepository,
      );
    });

    it('should export contacts with correct filename', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([createMockContactExportData()]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');

      expect(result.fileName).toBe('test-account-users.csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(contactRepository.findContactsForExport).toHaveBeenCalledWith(1n, {});
    });

    it('should export contacts with search term filter', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([createMockContactExportData()]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const options: ContactExportOptions = { searchTerm: 'alice' };
      await contactService.exportContacts(1n, 'Test Account', options);

      expect(contactRepository.findContactsForExport).toHaveBeenCalledWith(1n, {
        searchTerm: 'alice',
      });
    });

    it('should export contacts with onlyWithRoles filter', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([createMockContactExportData()]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const options: ContactExportOptions = { onlyWithRoles: true };
      await contactService.exportContacts(1n, 'Test Account', options);

      expect(contactRepository.findContactsForExport).toHaveBeenCalledWith(1n, {
        onlyWithRoles: true,
      });
    });

    it('should export contacts with seasonId filter', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([createMockContactExportData()]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const options: ContactExportOptions = { onlyWithRoles: true, seasonId: 5n };
      await contactService.exportContacts(1n, 'Test Account', options);

      expect(contactRepository.findContactsForExport).toHaveBeenCalledWith(1n, {
        onlyWithRoles: true,
        seasonId: 5n,
      });
    });

    it('should include contact data in CSV with separate name columns', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({
          firstname: 'Alice',
          middlename: 'Marie',
          lastname: 'Johnson',
          email: 'alice@example.com',
          phone1: '555-1111',
          phone2: '555-2222',
          phone3: '555-3333',
          streetaddress: '789 Elm St',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
          dateofbirth: new Date('1990-05-15'),
          roleIds: ['role-1'],
        }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Johnson');
      expect(csvContent).toContain('Alice');
      expect(csvContent).toContain('Marie');
      expect(csvContent).toContain('alice@example.com');
      expect(csvContent).toContain('555-1111');
      expect(csvContent).toContain('555-2222');
      expect(csvContent).toContain('555-3333');
      expect(csvContent).toContain('789 Elm St');
      expect(csvContent).toContain('Denver');
      expect(csvContent).toContain('CO');
      expect(csvContent).toContain('80202');
      expect(csvContent).toContain('Account Admin');
    });

    it('should map role IDs to role names', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({ roleIds: ['role-1', 'role-2'] }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Account Admin');
      expect(csvContent).toContain('Team Admin');
    });

    it('should handle contacts with no roles', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({ roleIds: [] }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should handle contacts with unknown role IDs', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({ roleIds: ['unknown-role'] }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('unknown-role');
    });

    it('should format date of birth correctly using UTC', async () => {
      // Use a UTC date to ensure consistent testing across timezones
      const testDate = new Date(Date.UTC(1995, 11, 25));
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({ dateofbirth: testDate }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');
      const csvContent = result.buffer.toString();

      // Expect UTC-based formatting: YYYY-MM-DD
      expect(csvContent).toContain('1995-12-25');
    });

    it('should handle null values gracefully', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([
        createMockContactExportData({
          email: null,
          phone1: null,
          phone2: null,
          phone3: null,
          streetaddress: null,
          city: null,
          state: null,
          zip: null,
        }),
      ]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');

      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should handle empty contact list', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Empty Account');

      expect(result.fileName).toBe('empty-account-users.csv');
      expect(result.buffer.toString()).toBe('');
    });

    it('should sanitize special characters in filename', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, "Test's Account & Co.");

      expect(result.fileName).toBe('test-s-account---co--users.csv');
    });

    it('should throw error when contact repository is not configured', async () => {
      const serviceWithoutContactRepo = new CsvExportService(rosterRepository, managerRepository);

      await expect(serviceWithoutContactRepo.exportContacts(1n, 'Test Account')).rejects.toThrow(
        'Contact repository is required for contact exports',
      );
    });

    it('should throw error when role repository is not configured', async () => {
      const serviceWithoutRoleRepo = new CsvExportService(
        rosterRepository,
        managerRepository,
        contactRepository,
      );

      await expect(serviceWithoutRoleRepo.exportContacts(1n, 'Test Account')).rejects.toThrow(
        'Role repository is required for contact exports',
      );
    });

    it('should throw PayloadTooLargeError when contacts exceed 10,000 rows', async () => {
      const largeContactDataset = Array.from({ length: 10001 }, (_, i) =>
        createMockContactExportData({ firstname: `User${i}` }),
      );
      contactRepository.findContactsForExport.mockResolvedValue(largeContactDataset);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      await expect(contactService.exportContacts(1n, 'Large Account')).rejects.toThrow(
        PayloadTooLargeError,
      );
    });

    it('should include CSV headers for all contact fields', async () => {
      contactRepository.findContactsForExport.mockResolvedValue([createMockContactExportData()]);
      roleRepository.findAllRoles.mockResolvedValue(createMockRoles());

      const result = await contactService.exportContacts(1n, 'Test Account');
      const csvContent = result.buffer.toString();

      expect(csvContent).toContain('Last Name');
      expect(csvContent).toContain('First Name');
      expect(csvContent).toContain('Middle Name');
      expect(csvContent).toContain('Email');
      expect(csvContent).toContain('Street Address');
      expect(csvContent).toContain('City');
      expect(csvContent).toContain('State');
      expect(csvContent).toContain('Zip');
      expect(csvContent).toContain('Date of Birth');
      expect(csvContent).toContain('Phone 1');
      expect(csvContent).toContain('Phone 2');
      expect(csvContent).toContain('Phone 3');
      expect(csvContent).toContain('Roles');
    });
  });
});

const createBattingStat = (
  overrides: Partial<PlayerBattingStatsType> = {},
): PlayerBattingStatsType => ({
  contactId: '1',
  playerName: 'Jane Doe',
  teams: ['Hawks'],
  teamName: 'Hawks',
  ab: 10,
  h: 3,
  r: 2,
  d: 1,
  t: 0,
  hr: 1,
  rbi: 4,
  bb: 2,
  so: 1,
  hbp: 0,
  sb: 1,
  cs: 0,
  sf: 0,
  sh: 0,
  re: 0,
  intr: 0,
  lob: 1,
  avg: 0.3,
  obp: 0.4,
  slg: 0.6,
  ops: 1.0,
  tb: 6,
  pa: 12,
  ...overrides,
});

const createPitchingStat = (
  overrides: Partial<PlayerPitchingStatsType> = {},
): PlayerPitchingStatsType => ({
  contactId: '1',
  playerName: 'Jane Doe',
  teams: ['Hawks'],
  teamName: 'Hawks',
  ip: 5,
  ip2: 1,
  w: 1,
  l: 0,
  s: 0,
  h: 4,
  r: 2,
  er: 2,
  bb: 1,
  so: 6,
  hr: 1,
  d: 0,
  t: 0,
  bf: 20,
  wp: 0,
  hbp: 0,
  bk: 0,
  sc: 0,
  era: 3.375,
  whip: 1.0,
  k9: 10.125,
  bb9: 1.6875,
  oba: 0.222,
  slg: 0.333,
  ipDecimal: 5.1,
  ...overrides,
});

describe('CsvExportService statistics exports', () => {
  let service: CsvExportService;

  beforeEach(() => {
    service = new CsvExportService(new RosterRepositoryStub(), new ManagerRepositoryStub());
  });

  const parseCsv = (buffer: Buffer): string[][] =>
    buffer
      .toString('utf-8')
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(','));

  it('exports batting statistics with canonical headers and formatted values', async () => {
    const result = await service.exportBattingStatistics(
      [createBattingStat()],
      'batting-statistics',
    );

    const rows = parseCsv(result.buffer);
    expect(result.fileName).toBe('batting-statistics.csv');
    expect(rows[0]).toEqual([
      'Player',
      'Team',
      'AB',
      'H',
      'R',
      '2B',
      '3B',
      'HR',
      'RBI',
      'SO',
      'BB',
      'HBP',
      'SB',
      'CS',
      'SF',
      'SH',
      'RE',
      'INTR',
      'LOB',
      'TB',
      'PA',
      'AVG',
      'OBP',
      'SLG',
      'OPS',
    ]);
    expect(rows[1][0]).toBe('Jane Doe');
    expect(rows[1][1]).toBe('Hawks');
    // avg/obp/slg/ops formatted to 3 decimals
    expect(rows[1][rows[0].indexOf('AVG')]).toBe('0.300');
    expect(rows[1][rows[0].indexOf('OPS')]).toBe('1.000');
  });

  it('joins multiple teams with a semicolon', async () => {
    const result = await service.exportBattingStatistics(
      [createBattingStat({ teams: ['Hawks', 'Eagles'] })],
      'batting-statistics',
    );
    const rows = parseCsv(result.buffer);
    expect(rows[1][1]).toBe('Hawks; Eagles');
  });

  it('formats pitching rates and innings as displayed', async () => {
    const result = await service.exportPitchingStatistics(
      [createPitchingStat()],
      'pitching-statistics',
    );
    const rows = parseCsv(result.buffer);
    expect(rows[0]).toContain('ERA');
    expect(rows[0]).toContain('IP');
    expect(rows[1][rows[0].indexOf('ERA')]).toBe('3.38');
    expect(rows[1][rows[0].indexOf('IP')]).toBe('5.1');
  });

  it('exports career batting with Season/Team columns and drops career totals rows', async () => {
    const careerRows: PlayerCareerBattingRowType[] = [
      {
        ...createBattingStat({ playerName: 'Jane Doe' }),
        level: 'season',
        seasonName: '2024',
        leagueName: 'Premier',
        teamName: 'Hawks',
      },
      {
        ...createBattingStat({ playerName: 'Jane Doe' }),
        level: 'career',
        isTotals: true,
        seasonName: null,
      },
    ];

    const result = await service.exportCareerBattingStatistics(careerRows, 'player-batting');
    const rows = parseCsv(result.buffer);

    expect(rows[0].slice(0, 2)).toEqual(['Season', 'Team']);
    // Only the season-level row remains (career totals dropped)
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe('2024');
    expect(rows[1][1]).toBe('Premier Hawks');
  });

  it('exports career pitching with Season/Team columns, dropped totals, and rate formatting', async () => {
    const careerRows: PlayerCareerPitchingRowType[] = [
      {
        ...createPitchingStat({ playerName: 'Jane Doe' }),
        level: 'season',
        seasonName: '2024',
        leagueName: 'Premier',
        teamName: 'Hawks',
      },
      {
        ...createPitchingStat({ playerName: 'Jane Doe' }),
        level: 'career',
        isTotals: true,
        seasonName: null,
      },
    ];

    const result = await service.exportCareerPitchingStatistics(careerRows, 'player-pitching');
    const rows = parseCsv(result.buffer);

    expect(rows[0].slice(0, 2)).toEqual(['Season', 'Team']);
    // Only the season-level row remains (career totals dropped)
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe('2024');
    expect(rows[1][1]).toBe('Premier Hawks');
    // ERA formatted to 2 decimals, IP to 1
    expect(rows[1][rows[0].indexOf('ERA')]).toBe('3.38');
    expect(rows[1][rows[0].indexOf('IP')]).toBe('5.1');
  });
});
