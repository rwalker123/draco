import { PrismaClient, leaguenews, teamnews } from '@prisma/client';
import { IAnnouncementRepository } from '../interfaces/IAnnouncementRepository.js';
import { dbAccountAnnouncement, dbTeamAnnouncement } from '../types/index.js';

export class PrismaAnnouncementRepository implements IAnnouncementRepository {
  private readonly accountSelect = {
    id: true,
    accountid: true,
    date: true,
    title: true,
    text: true,
    specialannounce: true,
  } as const;

  private readonly teamSelect = {
    id: true,
    teamid: true,
    date: true,
    title: true,
    text: true,
    specialannounce: true,
    teams: {
      select: {
        id: true,
        accountid: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaClient) {}

  async listAccountAnnouncements(accountId: bigint): Promise<dbAccountAnnouncement[]> {
    return this.prisma.leaguenews.findMany({
      where: { accountid: accountId },
      select: this.accountSelect,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async findAccountAnnouncementById(
    announcementId: bigint,
    accountId: bigint,
  ): Promise<dbAccountAnnouncement | null> {
    return this.prisma.leaguenews.findFirst({
      where: { id: announcementId, accountid: accountId },
      select: this.accountSelect,
    });
  }

  async createAccountAnnouncement(data: Partial<leaguenews>): Promise<leaguenews> {
    return this.prisma.leaguenews.create({
      data: data as Parameters<typeof this.prisma.leaguenews.create>[0]['data'],
    });
  }

  async updateAccountAnnouncement(
    announcementId: bigint,
    data: Partial<leaguenews>,
  ): Promise<leaguenews> {
    return this.prisma.leaguenews.update({
      where: { id: announcementId },
      data,
    });
  }

  async deleteAccountAnnouncement(announcementId: bigint): Promise<void> {
    await this.prisma.leaguenews.delete({ where: { id: announcementId } });
  }

  async listTeamAnnouncements(teamId: bigint): Promise<dbTeamAnnouncement[]> {
    return this.prisma.teamnews.findMany({
      where: { teamid: teamId },
      select: this.teamSelect,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async findTeamAnnouncementById(
    announcementId: bigint,
    teamId: bigint,
  ): Promise<dbTeamAnnouncement | null> {
    return this.prisma.teamnews.findFirst({
      where: { id: announcementId, teamid: teamId },
      select: this.teamSelect,
    });
  }

  async createTeamAnnouncement(data: Partial<teamnews>): Promise<teamnews> {
    return this.prisma.teamnews.create({
      data: data as Parameters<typeof this.prisma.teamnews.create>[0]['data'],
    });
  }

  async updateTeamAnnouncement(announcementId: bigint, data: Partial<teamnews>): Promise<teamnews> {
    return this.prisma.teamnews.update({
      where: { id: announcementId },
      data,
    });
  }

  async deleteTeamAnnouncement(announcementId: bigint): Promise<void> {
    await this.prisma.teamnews.delete({ where: { id: announcementId } });
  }
}
