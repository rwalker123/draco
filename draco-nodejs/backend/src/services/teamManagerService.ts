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

  // List all managers for multiple team seasons in a single query (batch fetch)
  async listManagersForTeams(teamSeasonIds: bigint[]): Promise<Map<string, TeamManagerType[]>> {
    const rawManagers: dbTeamManagerWithContact[] =
      await this.managerRepository.findManagersForTeams(teamSeasonIds);

    const managersByTeam = new Map<string, TeamManagerType[]>();

    for (const manager of rawManagers) {
      const teamId = manager.teamseasonid.toString();
      const formatted = ManagerResponseFormatter.formatManagersListResponse([manager])[0];

      if (!managersByTeam.has(teamId)) {
        managersByTeam.set(teamId, []);
      }
      managersByTeam.get(teamId)!.push(formatted);
    }

    return managersByTeam;
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
