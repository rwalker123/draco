import { PrismaClient } from '#prisma/client';
import { IRosterRepository } from '../interfaces/index.js';
import {
  dbRosterMember,
  dbRosterPlayer,
  dbRosterSeason,
  dbRosterSeasonContactReference,
} from '../types/dbTypes.js';

export class PrismaRosterRepository implements IRosterRepository {
  constructor(private prisma: PrismaClient) {}

  async findRosterMembersByTeamSeason(teamSeasonId: bigint): Promise<dbRosterSeason[]> {
    return this.prisma.rosterseason.findMany({
      where: { teamseasonid: teamSeasonId },
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
}
