import { PrismaClient } from '#prisma/client';
import { IRosterRepository } from '../interfaces/index.js';
import {
  dbRosterExportData,
  dbRosterMember,
  dbRosterPlayer,
  dbRosterSeason,
  dbRosterSeasonContactReference,
} from '../types/dbTypes.js';
import { NotFoundError } from '../../utils/customErrors.js';

export class PrismaRosterRepository implements IRosterRepository {
  constructor(private prisma: PrismaClient) {}

  async findRosterMembersByTeamSeason(
    teamSeasonId: bigint,
    includeInactive = false,
  ): Promise<dbRosterSeason[]> {
    return this.prisma.rosterseason.findMany({
      where: {
        teamseasonid: teamSeasonId,
        ...(includeInactive ? {} : { inactive: false }),
      },
      include: { roster: { include: { contacts: true } } },
      orderBy: [{ inactive: 'asc' }, { playernumber: 'asc' }],
    });
  }

  async findActiveRosterContactsByLeagueSeason(
    leagueSeasonId: bigint,
  ): Promise<dbRosterSeasonContactReference[]> {
    return this.prisma.rosterseason.findMany({
      where: {
        teamsseason: { leagueseasonid: leagueSeasonId },
        inactive: false,
      },
      select: { roster: { select: { contactid: true } } },
    });
  }

  async findRosterMemberForAccount(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbRosterMember | null> {
    return this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: { roster: { include: { contacts: true } } },
    });
  }

  async findRosterMemberInLeagueSeason(
    playerId: bigint,
    leagueSeasonId: bigint,
  ): Promise<dbRosterMember | null> {
    return this.prisma.rosterseason.findFirst({
      where: {
        playerid: playerId,
        teamsseason: { leagueseasonid: leagueSeasonId },
        inactive: false,
      },
      include: { roster: { include: { contacts: true } } },
    });
  }

  async findRosterPlayerByContactId(contactId: bigint): Promise<dbRosterPlayer | null> {
    return this.prisma.roster.findFirst({
      where: { contactid: contactId },
      include: { contacts: true },
    });
  }

  async findActiveTeamSeasonIdsForUser(
    accountId: bigint,
    seasonId: bigint,
    userId: string,
  ): Promise<bigint[]> {
    const results = await this.prisma.rosterseason.findMany({
      where: {
        inactive: false,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        roster: {
          contacts: {
            userid: userId,
          },
        },
      },
      select: { teamseasonid: true },
    });
    return results.map((row) => row.teamseasonid);
  }

  async createRosterPlayer(
    contactId: bigint,
    submittedDriversLicense: boolean,
    firstYear: number,
  ): Promise<dbRosterPlayer> {
    return this.prisma.roster.create({
      data: {
        contactid: contactId,
        submitteddriverslicense: submittedDriversLicense,
        firstyear: firstYear,
      },
      include: { contacts: true },
    });
  }

  async updateRosterPlayer(
    playerId: bigint,
    submittedDriversLicense?: boolean,
    firstYear?: number,
  ): Promise<dbRosterPlayer> {
    const data: Record<string, unknown> = {};

    if (submittedDriversLicense !== undefined) {
      data.submitteddriverslicense = submittedDriversLicense;
    }

    if (firstYear !== undefined) {
      data.firstyear = firstYear;
    }

    return this.prisma.roster.update({
      where: { id: playerId },
      data: data as Parameters<typeof this.prisma.roster.update>[0]['data'],
      include: { contacts: true },
    });
  }

  async createRosterSeasonEntry(
    playerId: bigint,
    teamSeasonId: bigint,
    playerNumber: number,
    submittedWaiver: boolean,
  ): Promise<dbRosterMember> {
    return this.prisma.rosterseason.create({
      data: {
        playerid: playerId,
        teamseasonid: teamSeasonId,
        playernumber: playerNumber,
        inactive: false,
        submittedwaiver: submittedWaiver,
        dateadded: new Date(),
      },
      include: { roster: { include: { contacts: true } } },
    });
  }

  async updateRosterSeasonEntry(
    rosterSeasonId: bigint,
    playerNumber?: number,
    submittedWaiver?: boolean,
    inactive?: boolean,
  ): Promise<dbRosterMember> {
    const data: Record<string, unknown> = {};

    if (playerNumber !== undefined) {
      data.playernumber = playerNumber;
    }

    if (submittedWaiver !== undefined) {
      data.submittedwaiver = submittedWaiver;
    }

    if (inactive !== undefined) {
      data.inactive = inactive;
    }

    return this.prisma.rosterseason.update({
      where: { id: rosterSeasonId },
      data: data as Parameters<typeof this.prisma.rosterseason.update>[0]['data'],
      include: { roster: { include: { contacts: true } } },
    });
  }

  async deleteRosterMember(rosterMemberId: bigint): Promise<void> {
    await this.prisma.rosterseason.delete({
      where: { id: rosterMemberId },
    });
  }

  async hasGameStats(rosterMemberId: bigint): Promise<boolean> {
    const stats = await this.prisma.rosterseason.findUnique({
      where: { id: rosterMemberId },
      select: {
        _count: {
          select: {
            batstatsum: true,
            pitchstatsum: true,
            fieldstatsum: true,
          },
        },
      },
    });
    if (!stats) return false;
    return (
      stats._count.batstatsum > 0 || stats._count.pitchstatsum > 0 || stats._count.fieldstatsum > 0
    );
  }

  async countGamesPlayedByTeamSeason(
    teamSeasonId: bigint,
  ): Promise<Array<{ rosterSeasonId: bigint; gamesPlayed: number }>> {
    const grouped = await this.prisma.playerrecap.groupBy({
      by: ['playerid'],
      where: {
        teamid: teamSeasonId,
      },
      _count: {
        playerid: true,
      },
    });

    return grouped.map((row) => ({
      rosterSeasonId: row.playerid,
      gamesPlayed: row._count.playerid ?? 0,
    }));
  }

  private readonly exportSelect = {
    playerid: true,
    roster: {
      select: {
        contacts: {
          select: {
            firstname: true,
            lastname: true,
            middlename: true,
            email: true,
            streetaddress: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        playerseasonaffiliationdues: {
          select: {
            affiliationduespaid: true,
            seasonid: true,
          },
        },
      },
    },
  } as const;

  async findRosterMembersForExport(
    teamSeasonId: bigint,
    seasonId: bigint,
  ): Promise<dbRosterExportData[]> {
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: { seasonid: seasonId },
      },
      select: { id: true },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found or does not belong to the specified season');
    }

    return this.prisma.rosterseason.findMany({
      where: {
        teamseasonid: teamSeasonId,
        inactive: false,
      },
      select: this.exportSelect,
      orderBy: [
        { roster: { contacts: { lastname: 'asc' } } },
        { roster: { contacts: { firstname: 'asc' } } },
      ],
    });
  }

  async findLeagueRosterForExport(
    leagueSeasonId: bigint,
    seasonId: bigint,
  ): Promise<dbRosterExportData[]> {
    const leagueSeason = await this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
      select: { id: true },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found or does not belong to the specified season');
    }

    return this.prisma.rosterseason.findMany({
      where: {
        teamsseason: {
          leagueseasonid: leagueSeasonId,
        },
        inactive: false,
      },
      select: this.exportSelect,
      orderBy: [
        { roster: { contacts: { lastname: 'asc' } } },
        { roster: { contacts: { firstname: 'asc' } } },
      ],
      distinct: ['playerid'],
    });
  }

  async findSeasonRosterForExport(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbRosterExportData[]> {
    return this.prisma.rosterseason.findMany({
      where: {
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: { accountid: accountId },
          },
        },
        inactive: false,
      },
      select: this.exportSelect,
      orderBy: [
        { roster: { contacts: { lastname: 'asc' } } },
        { roster: { contacts: { firstname: 'asc' } } },
      ],
      distinct: ['playerid'],
    });
  }
}
