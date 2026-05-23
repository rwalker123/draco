import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { partialPrismaMock } from '../../test-utils/partialMock.js';

interface RosterSeasonMock {
  findMany: Mock;
  findFirst: Mock;
}

interface PrismaMock {
  rosterseason: RosterSeasonMock;
}

function makePrisma(): PrismaMock {
  return {
    rosterseason: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };
}

async function makeRepo(prisma: PrismaMock) {
  const { PrismaContactRepository } =
    await import('../../repositories/implementations/PrismaContactRepository.js');
  return new PrismaContactRepository(partialPrismaMock(prisma));
}

const ACCOUNT_A = 100n;
const ACCOUNT_B = 200n;
const SEASON_1 = 10n;
const SEASON_2 = 20n;
const USER_A = 'user-uuid-aaa';
const USER_B = 'user-uuid-bbb';

function makeRosterSeasonRow(overrides: Record<string, unknown> = {}) {
  return {
    playernumber: '7',
    teamsseason: {
      id: 1001n,
      name: 'Red Sox',
      divisionseasonid: 501n,
      divisionseason: {
        divisiondefs: { name: 'Division A' },
      },
      leagueseason: {
        id: 2001n,
        league: { name: 'Summer League' },
      },
    },
    ...overrides,
  };
}

describe('PrismaContactRepository.findMyTeamSeasons', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = makePrisma();
    vi.resetAllMocks();
  });

  it('returns the team membership for a contact with one matching rosterseason', async () => {
    prisma.rosterseason.findMany = vi.fn().mockResolvedValue([makeRosterSeasonRow()]);

    const repo = await makeRepo(prisma);
    const result = await repo.findMyTeamSeasons({
      userId: USER_A,
      accountId: ACCOUNT_A,
      seasonId: SEASON_1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      teamSeasonId: 1001n,
      teamName: 'Red Sox',
      leagueSeasonId: 2001n,
      leagueName: 'Summer League',
      divisionSeasonId: 501n,
      divisionName: 'Division A',
      jerseyNumber: '7',
    });
  });

  it('returns multiple memberships when contact has multiple teams in the season', async () => {
    prisma.rosterseason.findMany = vi.fn().mockResolvedValue([
      makeRosterSeasonRow(),
      makeRosterSeasonRow({
        playernumber: '22',
        teamsseason: {
          id: 1002n,
          name: 'Yankees',
          divisionseasonid: null,
          divisionseason: null,
          leagueseason: {
            id: 2002n,
            league: { name: 'Winter League' },
          },
        },
      }),
    ]);

    const repo = await makeRepo(prisma);
    const result = await repo.findMyTeamSeasons({
      userId: USER_A,
      accountId: ACCOUNT_A,
      seasonId: SEASON_1,
    });

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      teamSeasonId: 1002n,
      teamName: 'Yankees',
      divisionSeasonId: null,
      divisionName: null,
      jerseyNumber: '22',
    });
  });

  it('returns empty array when contact has no roster row matching the query', async () => {
    prisma.rosterseason.findMany = vi.fn().mockResolvedValue([]);

    const repo = await makeRepo(prisma);
    const result = await repo.findMyTeamSeasons({
      userId: USER_A,
      accountId: ACCOUNT_A,
      seasonId: SEASON_1,
    });

    expect(result).toEqual([]);
  });

  it('passes correct where clause to Prisma including userId, accountId, and seasonId', async () => {
    prisma.rosterseason.findMany = vi.fn().mockResolvedValue([]);

    const repo = await makeRepo(prisma);
    await repo.findMyTeamSeasons({
      userId: USER_B,
      accountId: ACCOUNT_B,
      seasonId: SEASON_2,
    });

    expect(prisma.rosterseason.findMany).toHaveBeenCalledOnce();
    const callArg = vi.mocked(prisma.rosterseason.findMany).mock.calls[0][0] as {
      where: {
        roster: { contacts: { userid: string; creatoraccountid: bigint } };
        teamsseason: { leagueseason: { seasonid: bigint; league: { accountid: bigint } } };
      };
    };
    expect(callArg.where.roster.contacts.userid).toBe(USER_B);
    expect(callArg.where.roster.contacts.creatoraccountid).toBe(ACCOUNT_B);
    expect(callArg.where.teamsseason.leagueseason.seasonid).toBe(SEASON_2);
    expect(callArg.where.teamsseason.leagueseason.league.accountid).toBe(ACCOUNT_B);
  });

  it('handles null jerseyNumber correctly', async () => {
    prisma.rosterseason.findMany = vi
      .fn()
      .mockResolvedValue([makeRosterSeasonRow({ playernumber: null })]);

    const repo = await makeRepo(prisma);
    const result = await repo.findMyTeamSeasons({
      userId: USER_A,
      accountId: ACCOUNT_A,
      seasonId: SEASON_1,
    });

    expect(result[0].jerseyNumber).toBeNull();
  });

  it('handles team with no division (null divisionseasonid)', async () => {
    prisma.rosterseason.findMany = vi.fn().mockResolvedValue([
      makeRosterSeasonRow({
        teamsseason: {
          id: 1001n,
          name: 'Red Sox',
          divisionseasonid: null,
          divisionseason: null,
          leagueseason: {
            id: 2001n,
            league: { name: 'Summer League' },
          },
        },
      }),
    ]);

    const repo = await makeRepo(prisma);
    const result = await repo.findMyTeamSeasons({
      userId: USER_A,
      accountId: ACCOUNT_A,
      seasonId: SEASON_1,
    });

    expect(result[0].divisionSeasonId).toBeNull();
    expect(result[0].divisionName).toBeNull();
  });
});
