import { PrismaClient, golfroster, contacts } from '#prisma/client';
import {
  IGolfRosterRepository,
  GolfRosterWithContact,
  GolfSubstituteEntry,
  AvailableContact,
} from '../interfaces/IGolfRosterRepository.js';

export class PrismaGolfRosterRepository implements IGolfRosterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTeamSeasonId(teamSeasonId: bigint): Promise<GolfRosterWithContact[]> {
    return this.prisma.golfroster.findMany({
      where: { teamseasonid: teamSeasonId },
      include: {
        contacts: true,
      },
      orderBy: [{ isactive: 'desc' }, { contacts: { lastname: 'asc' } }],
    });
  }

  async findById(rosterId: bigint): Promise<GolfRosterWithContact | null> {
    return this.prisma.golfroster.findUnique({
      where: { id: rosterId },
      include: {
        contacts: true,
      },
    });
  }

  async findByContactAndTeam(contactId: bigint, teamSeasonId: bigint): Promise<golfroster | null> {
    return this.prisma.golfroster.findFirst({
      where: {
        contactid: contactId,
        teamseasonid: teamSeasonId,
      },
    });
  }

  async findSubstitutesForSeason(seasonId: bigint): Promise<GolfSubstituteEntry[]> {
    return this.prisma.golfroster.findMany({
      where: {
        issub: true,
        isactive: true,
        subseasonid: seasonId,
      },
      include: {
        contacts: true,
        teamsseason: {
          select: {
            id: true,
            name: true,
            divisionseasonid: true,
          },
        },
      },
      orderBy: { contacts: { lastname: 'asc' } },
    });
  }

  async findSubstitutesForFlight(flightId: bigint): Promise<GolfSubstituteEntry[]> {
    return this.prisma.golfroster.findMany({
      where: {
        issub: true,
        isactive: true,
        teamsseason: {
          divisionseasonid: flightId,
        },
      },
      include: {
        contacts: true,
        teamsseason: {
          select: {
            id: true,
            name: true,
            divisionseasonid: true,
          },
        },
      },
      orderBy: { contacts: { lastname: 'asc' } },
    });
  }

  async create(data: {
    contactid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
    issub: boolean;
    initialdifferential?: number | null;
    subseasonid?: bigint | null;
  }): Promise<golfroster> {
    return this.prisma.golfroster.create({
      data: {
        contactid: data.contactid,
        teamseasonid: data.teamseasonid,
        isactive: data.isactive,
        issub: data.issub,
        initialdifferential: data.initialdifferential ?? null,
        subseasonid: data.subseasonid ?? null,
      },
    });
  }

  async update(
    rosterId: bigint,
    data: Partial<{
      isactive: boolean;
      issub: boolean;
      initialdifferential: number | null;
      subseasonid: bigint | null;
    }>,
  ): Promise<golfroster> {
    return this.prisma.golfroster.update({
      where: { id: rosterId },
      data,
    });
  }

  async delete(rosterId: bigint): Promise<golfroster> {
    return this.prisma.golfroster.delete({
      where: { id: rosterId },
    });
  }

  async releasePlayer(
    rosterId: bigint,
    releaseAsSub: boolean,
    seasonId: bigint,
  ): Promise<golfroster> {
    if (releaseAsSub) {
      return this.prisma.golfroster.update({
        where: { id: rosterId },
        data: {
          isactive: false,
          issub: true,
          subseasonid: seasonId,
        },
      });
    }

    return this.prisma.golfroster.update({
      where: { id: rosterId },
      data: {
        isactive: false,
      },
    });
  }

  async findAvailableContacts(accountId: bigint, seasonId: bigint): Promise<AvailableContact[]> {
    return this.prisma.contacts.findMany({
      where: {
        creatoraccountid: accountId,
      },
      include: {
        golfroster: {
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

  async hasScores(rosterId: bigint): Promise<boolean> {
    const count = await this.prisma.golfmatchscores.count({
      where: {
        playerid: rosterId,
      },
    });
    return count > 0;
  }
}
