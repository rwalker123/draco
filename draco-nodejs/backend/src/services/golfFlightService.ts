import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { IGolfFlightRepository, RepositoryFactory } from '../repositories/index.js';
import { GolfFlightResponseFormatter } from '../responseFormatters/golfFlightResponseFormatter.js';
import {
  GolfFlightType,
  GolfFlightWithTeamCountType,
  CreateGolfFlightType,
  UpdateGolfFlightType,
} from '@draco/shared-schemas';

export class GolfFlightService {
  private readonly flightRepository: IGolfFlightRepository;

  constructor(flightRepository?: IGolfFlightRepository) {
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
  }

  async getFlightsForSeason(seasonId: bigint): Promise<GolfFlightWithTeamCountType[]> {
    const flights = await this.flightRepository.findBySeasonId(seasonId);
    return GolfFlightResponseFormatter.formatManyWithCounts(flights);
  }

  async getFlightById(flightId: bigint): Promise<GolfFlightType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }
    return GolfFlightResponseFormatter.format(flight);
  }

  async createFlight(
    accountId: bigint,
    seasonId: bigint,
    data: CreateGolfFlightType,
  ): Promise<GolfFlightType> {
    const name = data.name.trim();

    const nameExists = await this.flightRepository.flightNameExistsInSeason(
      accountId,
      seasonId,
      name,
    );
    if (nameExists) {
      throw new ValidationError('A flight with this name already exists in this season');
    }

    const flight = await this.flightRepository.create(accountId, seasonId, name);
    return GolfFlightResponseFormatter.format(flight);
  }

  async updateFlight(
    flightId: bigint,
    accountId: bigint,
    data: UpdateGolfFlightType,
  ): Promise<GolfFlightType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }

    if (data.name !== undefined) {
      const name = data.name.trim();

      const existingFlights = await this.flightRepository.findBySeasonId(flight.seasonid);
      const duplicateName = existingFlights.some(
        (f) => f.id !== flightId && f.league.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicateName) {
        throw new ValidationError('A flight with this name already exists in this season');
      }

      const updatedFlight = await this.flightRepository.update(flightId, name);
      return GolfFlightResponseFormatter.format(updatedFlight);
    }

    return GolfFlightResponseFormatter.format(flight);
  }

  async deleteFlight(flightId: bigint): Promise<void> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }

    const playerCount = await this.flightRepository.getPlayerCountForFlight(flightId);
    if (playerCount > 0) {
      throw new ValidationError('Cannot delete flight because it has teams assigned to it');
    }

    await this.flightRepository.delete(flightId);
  }
}
