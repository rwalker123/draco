import { PrismaClient } from '@prisma/client';
import { IHandoutRepository } from '../interfaces/index.js';
import { dbAccountHandout, dbTeamHandout } from '../types/index.js';

export class PrismaHandoutRepository implements IHandoutRepository {
  constructor(private prisma: PrismaClient) {}

  private accountHandoutSelect = {
    id: true,
    description: true,
    filename: true,
    accountid: true,
  } as const;

  private teamHandoutSelect = {
    id: true,
    description: true,
    filename: true,
    teamid: true,
    teams: {
      select: {
        id: true,
        accountid: true,
      },
    },
  } as const;

  async listAccountHandouts(accountId: bigint): Promise<dbAccountHandout[]> {
    return this.prisma.accounthandouts.findMany({
      where: { accountid: accountId },
      select: this.accountHandoutSelect,
      orderBy: { id: 'desc' },
    });
  }

  async createAccountHandout(data: Partial<import('@prisma/client').accounthandouts>) {
    return this.prisma.accounthandouts.create({
      data: data as Parameters<typeof this.prisma.accounthandouts.create>[0]['data'],
    });
  }

  async findAccountHandoutById(handoutId: bigint, accountId: bigint): Promise<dbAccountHandout | null> {
    return this.prisma.accounthandouts.findFirst({
      where: { id: handoutId, accountid: accountId },
      select: this.accountHandoutSelect,
    });
  }

  async updateAccountHandout(
    handoutId: bigint,
    data: Partial<import('@prisma/client').accounthandouts>,
  ): Promise<import('@prisma/client').accounthandouts> {
    return this.prisma.accounthandouts.update({
      where: { id: Number(handoutId) },
      data: data as Parameters<typeof this.prisma.accounthandouts.update>[0]['data'],
    });
  }

  async deleteAccountHandout(handoutId: bigint): Promise<void> {
    await this.prisma.accounthandouts.delete({
      where: { id: Number(handoutId) },
    });
  }

  async listTeamHandouts(teamId: bigint): Promise<dbTeamHandout[]> {
    return this.prisma.teamhandouts.findMany({
      where: { teamid: teamId },
      select: this.teamHandoutSelect,
      orderBy: { id: 'desc' },
    });
  }

  async createTeamHandout(data: Partial<import('@prisma/client').teamhandouts>) {
    return this.prisma.teamhandouts.create({
      data: data as Parameters<typeof this.prisma.teamhandouts.create>[0]['data'],
    });
  }

  async findTeamHandoutById(handoutId: bigint, teamId: bigint): Promise<dbTeamHandout | null> {
    return this.prisma.teamhandouts.findFirst({
      where: { id: handoutId, teamid: teamId },
      select: this.teamHandoutSelect,
    });
  }

  async updateTeamHandout(
    handoutId: bigint,
    data: Partial<import('@prisma/client').teamhandouts>,
  ): Promise<import('@prisma/client').teamhandouts> {
    return this.prisma.teamhandouts.update({
      where: { id: Number(handoutId) },
      data: data as Parameters<typeof this.prisma.teamhandouts.update>[0]['data'],
    });
  }

  async deleteTeamHandout(handoutId: bigint): Promise<void> {
    await this.prisma.teamhandouts.delete({
      where: { id: Number(handoutId) },
    });
  }
}
