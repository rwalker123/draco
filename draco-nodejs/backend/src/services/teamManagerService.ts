import { PrismaClient } from '@prisma/client';
import {
  ManagerResponseFormatter,
  FormattedManager,
  ApiResponse,
} from '../utils/responseFormatters.js';
import { RawManager } from '../interfaces/contactInterfaces.js';

export class TeamManagerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // List all managers for a team season, including contact info
  async listManagers(teamSeasonId: bigint): Promise<FormattedManager[]> {
    const rawManagers = (await this.prisma.teamseasonmanager.findMany({
      where: { teamseasonid: teamSeasonId },
      include: { contacts: true },
    })) as RawManager[];

    return ManagerResponseFormatter.formatManagersListResponse(rawManagers);
  }

  // Add a manager to a team season
  async addManager(
    teamSeasonId: bigint,
    contactId: bigint,
  ): Promise<ApiResponse<FormattedManager>> {
    const rawManager = (await this.prisma.teamseasonmanager.create({
      data: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
      include: { contacts: true },
    })) as RawManager;

    return ManagerResponseFormatter.formatAddManagerResponse(rawManager);
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
