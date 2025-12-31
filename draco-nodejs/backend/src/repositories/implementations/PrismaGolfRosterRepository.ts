import { PrismaClient, golfroster, golfer, golfleaguesub, contacts } from '#prisma/client';
import {
  IGolfRosterRepository,
  GolfRosterWithGolfer,
  GolfLeagueSubWithGolfer,
  AvailableContact,
} from '../interfaces/IGolfRosterRepository.js';

export class PrismaGolfRosterRepository implements IGolfRosterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTeamSeasonId(teamSeasonId: bigint): Promise<GolfRosterWithGolfer[]> {
    return this.prisma.golfroster.findMany({
      where: { teamseasonid: teamSeasonId },
      include: {
        golfer: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: [{ isactive: 'desc' }, { golfer: { contact: { lastname: 'asc' } } }],
    });
  }

  async findById(rosterId: bigint): Promise<GolfRosterWithGolfer | null> {
    return this.prisma.golfroster.findUnique({
      where: { id: rosterId },
      include: {
        golfer: {
          include: {
            contact: true,
          },
        },
      },
    });
  }

  async findByIds(rosterIds: bigint[]): Promise<GolfRosterWithGolfer[]> {
    if (rosterIds.length === 0) return [];
    return this.prisma.golfroster.findMany({
      where: { id: { in: rosterIds } },
      include: {
        golfer: {
          include: {
            contact: true,
          },
        },
      },
    });
  }

  async findByGolferAndTeam(golferId: bigint, teamSeasonId: bigint): Promise<golfroster | null> {
    return this.prisma.golfroster.findFirst({
      where: {
        golferid: golferId,
        teamseasonid: teamSeasonId,
      },
    });
  }

  async findSubstitutesForSeason(seasonId: bigint): Promise<GolfLeagueSubWithGolfer[]> {
    return this.prisma.golfleaguesub.findMany({
      where: {
        seasonid: seasonId,
        isactive: true,
      },
      include: {
        golfer: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { golfer: { contact: { lastname: 'asc' } } },
    });
  }

  async findGolferByContactId(contactId: bigint): Promise<golfer | null> {
    return this.prisma.golfer.findUnique({
      where: { contactid: contactId },
    });
  }

  async findOrCreateGolfer(
    contactId: bigint,
    initialDifferential?: number | null,
  ): Promise<golfer> {
    const existing = await this.prisma.golfer.findUnique({
      where: { contactid: contactId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.golfer.create({
      data: {
        contactid: contactId,
        initialdifferential: initialDifferential ?? null,
      },
    });
  }

  async createRosterEntry(data: {
    golferid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
  }): Promise<golfroster> {
    return this.prisma.golfroster.create({
      data: {
        golferid: data.golferid,
        teamseasonid: data.teamseasonid,
        isactive: data.isactive,
      },
    });
  }

  async createLeagueSub(data: {
    golferid: bigint;
    seasonid: bigint;
    isactive: boolean;
  }): Promise<golfleaguesub> {
    return this.prisma.golfleaguesub.create({
      data: {
        golferid: data.golferid,
        seasonid: data.seasonid,
        isactive: data.isactive,
      },
    });
  }

  async updateRosterEntry(
    rosterId: bigint,
    data: Partial<{
      isactive: boolean;
    }>,
  ): Promise<golfroster> {
    return this.prisma.golfroster.update({
      where: { id: rosterId },
      data,
    });
  }

  async updateGolfer(
    golferId: bigint,
    data: Partial<{
      initialdifferential: number | null;
    }>,
  ): Promise<golfer> {
    return this.prisma.golfer.update({
      where: { id: golferId },
      data,
    });
  }

  async updateLeagueSub(
    subId: bigint,
    data: Partial<{
      isactive: boolean;
    }>,
  ): Promise<golfleaguesub> {
    return this.prisma.golfleaguesub.update({
      where: { id: subId },
      data,
    });
  }

  async deleteRosterEntry(rosterId: bigint): Promise<golfroster> {
    return this.prisma.golfroster.delete({
      where: { id: rosterId },
    });
  }

  async deleteLeagueSub(subId: bigint): Promise<golfleaguesub> {
    return this.prisma.golfleaguesub.delete({
      where: { id: subId },
    });
  }

  async releasePlayerToSubPool(rosterId: bigint, seasonId: bigint): Promise<golfleaguesub> {
    const roster = await this.prisma.golfroster.findUnique({
      where: { id: rosterId },
    });

    if (!roster) {
      throw new Error('Roster entry not found');
    }

    const existingSub = await this.prisma.golfleaguesub.findFirst({
      where: {
        golferid: roster.golferid,
        seasonid: seasonId,
      },
    });

    if (existingSub) {
      await this.prisma.golfleaguesub.update({
        where: { id: existingSub.id },
        data: { isactive: true },
      });
      await this.prisma.golfroster.delete({
        where: { id: rosterId },
      });
      return existingSub;
    }

    const sub = await this.prisma.golfleaguesub.create({
      data: {
        golferid: roster.golferid,
        seasonid: seasonId,
        isactive: true,
      },
    });

    await this.prisma.golfroster.delete({
      where: { id: rosterId },
    });

    return sub;
  }

  async signSubToTeam(subId: bigint, teamSeasonId: bigint): Promise<golfroster> {
    const sub = await this.prisma.golfleaguesub.findUnique({
      where: { id: subId },
    });

    if (!sub) {
      throw new Error('Substitute not found');
    }

    const existingRoster = await this.prisma.golfroster.findFirst({
      where: {
        golferid: sub.golferid,
        teamseasonid: teamSeasonId,
      },
    });

    if (existingRoster) {
      throw new Error('Golfer is already on this team');
    }

    const roster = await this.prisma.golfroster.create({
      data: {
        golferid: sub.golferid,
        teamseasonid: teamSeasonId,
        isactive: true,
      },
    });

    await this.prisma.golfleaguesub.delete({
      where: { id: subId },
    });

    return roster;
  }

  async findAvailableContacts(accountId: bigint, seasonId: bigint): Promise<AvailableContact[]> {
    return this.prisma.contacts.findMany({
      where: {
        creatoraccountid: accountId,
      },
      include: {
        golfer: {
          include: {
            rosters: {
              where: {
                isactive: true,
                teamsseason: {
                  leagueseason: {
                    seasonid: seasonId,
                  },
                },
              },
              select: {
                id: true,
                teamseasonid: true,
              },
            },
            leaguesubs: {
              where: {
                isactive: true,
                leagueseason: {
                  seasonid: seasonId,
                },
              },
              select: {
                id: true,
                seasonid: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
    });
  }

  async contactExistsInAccount(contactId: bigint, accountId: bigint): Promise<boolean> {
    const count = await this.prisma.contacts.count({
      where: {
        id: contactId,
        creatoraccountid: accountId,
      },
    });
    return count > 0;
  }

  async createContact(
    accountId: bigint,
    data: {
      firstname: string;
      lastname: string;
      middlename?: string | null;
      email?: string | null;
    },
  ): Promise<contacts> {
    return this.prisma.contacts.create({
      data: {
        creatoraccountid: accountId,
        firstname: data.firstname,
        lastname: data.lastname,
        middlename: data.middlename ?? '',
        email: data.email ?? null,
        dateofbirth: new Date('1900-01-01'),
      },
    });
  }

  async hasMatchScores(golferId: bigint): Promise<boolean> {
    const count = await this.prisma.golfmatchscores.count({
      where: {
        golferid: golferId,
      },
    });
    return count > 0;
  }

  async findLeagueSubById(subId: bigint): Promise<GolfLeagueSubWithGolfer | null> {
    return this.prisma.golfleaguesub.findUnique({
      where: { id: subId },
      include: {
        golfer: {
          include: {
            contact: true,
          },
        },
      },
    });
  }

  async findLeagueSubByGolferAndSeason(
    golferId: bigint,
    seasonId: bigint,
  ): Promise<golfleaguesub | null> {
    return this.prisma.golfleaguesub.findFirst({
      where: {
        golferid: golferId,
        seasonid: seasonId,
      },
    });
  }
}
