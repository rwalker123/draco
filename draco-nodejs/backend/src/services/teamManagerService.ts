import { PrismaClient } from '@prisma/client';
import { ManagerResponseFormatter } from '../responseFormatters/index.js';
import { dbTeamManagerWithContact } from '../repositories/index.js';
import { ConflictError } from '../utils/customErrors.js';
import { TeamManagerType } from '@draco/shared-schemas';

export class TeamManagerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // List all managers for a team season, including contact info
  async listManagers(teamSeasonId: bigint): Promise<TeamManagerType[]> {
    const rawManagers: dbTeamManagerWithContact[] = await this.prisma.teamseasonmanager.findMany({
      where: { teamseasonid: teamSeasonId },
      include: { contacts: true },
    });

    return ManagerResponseFormatter.formatManagersListResponse(rawManagers);
  }

  // Add a manager to a team season
  async addManager(teamSeasonId: bigint, contactId: bigint): Promise<TeamManagerType> {
    const existing = await this.findManager(teamSeasonId, contactId);
    if (existing) {
      throw new ConflictError('Manager already exists for this team');
    }

    const rawManager: dbTeamManagerWithContact = await this.prisma.teamseasonmanager.create({
      data: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
      include: { contacts: true },
    });

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
