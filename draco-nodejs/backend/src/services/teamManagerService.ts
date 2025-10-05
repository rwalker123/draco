import { ManagerResponseFormatter } from '../responseFormatters/index.js';
import { dbTeamManagerWithContact, IManagerRepository } from '../repositories/index.js';
import { ConflictError } from '../utils/customErrors.js';
import { TeamManagerType } from '@draco/shared-schemas';

export class TeamManagerService {
  constructor(private readonly managerRepository: IManagerRepository) {}

  // List all managers for a team season, including contact info
  async listManagers(teamSeasonId: bigint): Promise<TeamManagerType[]> {
    const rawManagers: dbTeamManagerWithContact[] =
      await this.managerRepository.findTeamManagers(teamSeasonId);

    return ManagerResponseFormatter.formatManagersListResponse(rawManagers);
  }

  // Add a manager to a team season
  async addManager(teamSeasonId: bigint, contactId: bigint): Promise<TeamManagerType> {
    const existing = await this.findManager(teamSeasonId, contactId);
    if (existing) {
      throw new ConflictError('Manager already exists for this team');
    }

    const rawManager: dbTeamManagerWithContact = await this.managerRepository.createTeamManager(
      teamSeasonId,
      contactId,
    );

    return ManagerResponseFormatter.formatAddManagerResponse(rawManager);
  }

  // Remove a manager by manager id
  async removeManager(managerId: bigint) {
    return this.managerRepository.delete(managerId);
  }

  // Find a manager by teamSeasonId and contactId (to prevent duplicates)
  async findManager(teamSeasonId: bigint, contactId: bigint) {
    return this.managerRepository.findTeamManager(teamSeasonId, contactId);
  }
}
