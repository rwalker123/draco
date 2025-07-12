import { PrismaClient } from '@prisma/client';

export class TeamManagerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // List all managers for a team season, including contact info
  async listManagers(teamSeasonId: bigint) {
    return this.prisma.teamseasonmanager.findMany({
      where: { teamseasonid: teamSeasonId },
      include: { contacts: true },
    });
  }

  // Add a manager to a team season
  async addManager(teamSeasonId: bigint, contactId: bigint) {
    return this.prisma.teamseasonmanager.create({
      data: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
      include: { contacts: true },
    });
  }

  // Remove a manager by manager id
  async removeManager(managerId: bigint) {
    return this.prisma.teamseasonmanager.delete({
      where: { id: managerId },
    });
  }

  // Find a manager by teamSeasonId and contactId (to prevent duplicates)
  async findManager(teamSeasonId: bigint, contactId: bigint) {
    return this.prisma.teamseasonmanager.findFirst({
      where: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
    });
  }
}
