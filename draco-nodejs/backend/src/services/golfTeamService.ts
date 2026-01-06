import {
  GolfTeamType,
  GolfTeamWithPlayerCountType,
  GolfTeamWithRosterType,
  CreateGolfTeamType,
  UpdateGolfTeamType,
} from '@draco/shared-schemas';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GolfTeamResponseFormatter } from '../responseFormatters/golfTeamResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export class GolfTeamService {
  private readonly teamRepository: IGolfTeamRepository;
  private readonly flightRepository: IGolfFlightRepository;

  constructor(teamRepository?: IGolfTeamRepository, flightRepository?: IGolfFlightRepository) {
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
  }

  async getTeamsForSeason(seasonId: bigint): Promise<GolfTeamType[]> {
    const teams = await this.teamRepository.findBySeasonId(seasonId);
    return GolfTeamResponseFormatter.formatMany(teams);
  }

  async getTeamsForFlight(flightId: bigint): Promise<GolfTeamWithPlayerCountType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }
    const teams = await this.teamRepository.findByFlightId(flightId);
    return GolfTeamResponseFormatter.formatManyWithPlayerCount(teams);
  }

  async getTeamById(teamSeasonId: bigint): Promise<GolfTeamType> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }
    return GolfTeamResponseFormatter.format(team);
  }

  async getTeamWithRoster(teamSeasonId: bigint): Promise<GolfTeamWithRosterType> {
    const team = await this.teamRepository.findByIdWithRoster(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }
    return GolfTeamResponseFormatter.formatWithRoster(team);
  }

  async createTeam(flightId: bigint, data: CreateGolfTeamType): Promise<GolfTeamType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }

    const name = data.name.trim();
    const existingTeams = await this.teamRepository.findByFlightId(flightId);
    const duplicateName = existingTeams.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (duplicateName) {
      throw new ValidationError('A team with this name already exists in this flight');
    }

    const teamsseason = await this.teamRepository.create(flightId, name);
    const createdTeam = await this.teamRepository.findById(teamsseason.id);
    if (!createdTeam) {
      throw new NotFoundError('Created team not found');
    }
    return GolfTeamResponseFormatter.format(createdTeam);
  }

  async updateTeam(
    teamSeasonId: bigint,
    data: UpdateGolfTeamType,
  ): Promise<GolfTeamWithPlayerCountType> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      const existingTeams = await this.teamRepository.findByFlightId(team.leagueseasonid);
      const duplicateName = existingTeams.some(
        (t) => t.id !== teamSeasonId && t.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicateName) {
        throw new ValidationError('A team with this name already exists in this flight');
      }

      await this.teamRepository.update(teamSeasonId, { name });
    }

    const updatedTeam = await this.teamRepository.findById(teamSeasonId);
    if (!updatedTeam) {
      throw new NotFoundError('Updated team not found');
    }
    return GolfTeamResponseFormatter.formatWithPlayerCount(updatedTeam);
  }

  async deleteTeam(teamSeasonId: bigint): Promise<void> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }

    const hasMatches = await this.teamRepository.hasMatches(teamSeasonId);
    if (hasMatches) {
      throw new ValidationError('Cannot delete team because it has scheduled matches');
    }

    const hasRoster = await this.teamRepository.hasRosterEntries(teamSeasonId);
    if (hasRoster) {
      throw new ValidationError('Cannot delete team because it has players on the roster');
    }

    await this.teamRepository.delete(teamSeasonId);
  }
}
