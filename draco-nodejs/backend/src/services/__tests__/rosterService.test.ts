import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RosterMemberSchema,
  SignRosterMemberSchema,
  UpdateRosterMemberSchema,
} from '@draco/shared-schemas';
import { RosterService } from '../rosterService.js';
import {
  IContactRepository,
  IRosterRepository,
  ISeasonsRepository,
  ITeamRepository,
  dbRosterMember,
  dbRosterPlayer,
} from '../../repositories/index.js';
import { ServiceFactory } from '../serviceFactory.js';
import { partialMock } from '../../test-utils/partialMock.js';

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

describe('RosterMemberSchema playerNumber validation', () => {
  const baseInput = {
    id: 1n,
    inactive: false,
    dateAdded: new Date().toISOString(),
    player: {
      id: 2n,
      submittedDriversLicense: false,
      firstYear: 2020,
      contact: {
        id: '3',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    },
  };

  it.each(['', '0', '00', '7', '07', '99'])('accepts playerNumber "%s"', (playerNumber) => {
    const result = RosterMemberSchema.safeParse({ ...baseInput, playerNumber });
    expect(result.success).toBe(true);
  });

  it.each(['100', '1a', '-1', ' 7'])('rejects playerNumber "%s"', (playerNumber) => {
    const result = RosterMemberSchema.safeParse({ ...baseInput, playerNumber });
    expect(result.success).toBe(false);
  });
});

describe('UpdateRosterMemberSchema playerNumber validation', () => {
  it.each(['', '0', '00', '7', '07', '99'])('accepts playerNumber "%s"', (playerNumber) => {
    const result = UpdateRosterMemberSchema.safeParse({ playerNumber });
    expect(result.success).toBe(true);
  });

  it.each(['100', '1a', '-1', ' 7'])('rejects playerNumber "%s"', (playerNumber) => {
    const result = UpdateRosterMemberSchema.safeParse({ playerNumber });
    expect(result.success).toBe(false);
  });
});

describe('SignRosterMemberSchema playerNumber validation', () => {
  const baseInput = {
    player: {
      submittedDriversLicense: false,
      firstYear: 2020,
      contact: { id: '3' },
    },
  };

  it.each(['', '0', '00', '7', '07', '99'])('accepts playerNumber "%s"', (playerNumber) => {
    const result = SignRosterMemberSchema.safeParse({ ...baseInput, playerNumber });
    expect(result.success).toBe(true);
  });

  it.each(['100', '1a', '-1', ' 7'])('rejects playerNumber "%s"', (playerNumber) => {
    const result = SignRosterMemberSchema.safeParse({ ...baseInput, playerNumber });
    expect(result.success).toBe(false);
  });
});

describe('RosterService.addPlayerToRoster', () => {
  let rosterRepo: RosterRepositoryStub;
  let teamRepo: ITeamRepository;
  let contactRepo: IContactRepository;
  let seasonsRepo: ISeasonsRepository;
  let service: RosterService;

  const teamSeasonId = 10n;
  const seasonId = 20n;
  const accountId = 30n;

  const mockTeamSeason = {
    id: teamSeasonId,
    leagueseasonid: 40n,
    teamid: 50n,
    name: 'Test Team',
    divisionseasonid: null,
  };

  const mockRosterPlayer: dbRosterPlayer = partialMock<dbRosterPlayer>({
    id: 1n,
    contactid: 2n,
    submitteddriverslicense: false,
    firstyear: 2020,
    contacts: partialMock<dbRosterPlayer['contacts']>({
      id: 2n,
      userid: 'user-abc',
      firstname: 'Jane',
      lastname: 'Doe',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      creatoraccountid: accountId,
    }),
  });

  const mockRosterMember: dbRosterMember = partialMock<dbRosterMember>({
    id: 100n,
    playerid: 1n,
    teamseasonid: teamSeasonId,
    playernumber: '',
    inactive: false,
    submittedwaiver: false,
    dateadded: new Date(),
    roster: mockRosterPlayer,
  });

  beforeEach(() => {
    rosterRepo = new RosterRepositoryStub();

    teamRepo = partialMock<ITeamRepository>({
      findTeamSeason: vi.fn().mockResolvedValue(mockTeamSeason),
    });

    contactRepo = partialMock<IContactRepository>({
      findContactInAccount: vi.fn().mockResolvedValue({ id: mockRosterPlayer.contactid }),
    });
    seasonsRepo = partialMock<ISeasonsRepository>({});

    vi.spyOn(ServiceFactory, 'getAccountsService').mockReturnValue(
      {} as ReturnType<typeof ServiceFactory.getAccountsService>,
    );
    vi.spyOn(ServiceFactory, 'getDiscordIntegrationService').mockReturnValue(
      partialMock<ReturnType<typeof ServiceFactory.getDiscordIntegrationService>>({
        updateTeamForumMemberForContact: vi.fn().mockResolvedValue(undefined),
      }),
    );

    rosterRepo.findRosterPlayerByContactId.mockResolvedValue(mockRosterPlayer);
    rosterRepo.findRosterMemberInLeagueSeason.mockResolvedValue(null);
    rosterRepo.createRosterSeasonEntry.mockResolvedValue(mockRosterMember);

    service = new RosterService(rosterRepo, teamRepo, contactRepo, seasonsRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes empty string to createRosterSeasonEntry when playerNumber is omitted', async () => {
    await service.addPlayerToRoster(teamSeasonId, seasonId, accountId, {
      player: {
        submittedDriversLicense: false,
        firstYear: 2020,
        contact: { id: mockRosterPlayer.contactid.toString() },
      },
    });

    expect(rosterRepo.createRosterSeasonEntry).toHaveBeenCalledWith(
      mockRosterPlayer.id,
      teamSeasonId,
      '',
      false,
    );
  });
});
