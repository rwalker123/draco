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
    seasonId: bigint,
    accountId: bigint,
    data: CreateGolfFlightType,
  ): Promise<GolfFlightType> {
    const seasonExists = await this.flightRepository.leagueSeasonExists(seasonId);
    if (!seasonExists) {
      throw new NotFoundError('League season not found');
    }

    const name = data.name.trim();
    const existingFlights = await this.flightRepository.findBySeasonId(seasonId);
    const duplicateName = existingFlights.some(
      (f) => f.divisiondefs.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicateName) {
      throw new ValidationError('A flight with this name already exists in this season');
    }

    const division = await this.flightRepository.findOrCreateDivision(accountId, name);

    const maxPriority = existingFlights.reduce((max, f) => Math.max(max, f.priority), -1);

    const divisionSeason = await this.flightRepository.create(
      seasonId,
      division.id,
      maxPriority + 1,
    );

    const createdFlight = await this.flightRepository.findById(divisionSeason.id);
    if (!createdFlight) {
      throw new NotFoundError('Created flight not found');
    }
    return GolfFlightResponseFormatter.format(createdFlight);
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
      const existingFlights = await this.flightRepository.findBySeasonId(flight.leagueseason.id);
      const duplicateName = existingFlights.some(
        (f) => f.id !== flightId && f.divisiondefs.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicateName) {
        throw new ValidationError('A flight with this name already exists in this season');
      }

      const newDivision = await this.flightRepository.findOrCreateDivision(accountId, name);
      await this.flightRepository.update(flightId, { divisionid: newDivision.id });
    }

    const updatedFlight = await this.flightRepository.findById(flightId);
    if (!updatedFlight) {
      throw new NotFoundError('Updated flight not found');
    }
    return GolfFlightResponseFormatter.format(updatedFlight);
  }

  async deleteFlight(flightId: bigint): Promise<void> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }

    const flights = await this.flightRepository.findBySeasonId(flight.leagueseason.id);
    const flightWithCounts = flights.find((f) => f.id === flightId);

    if (flightWithCounts && flightWithCounts._count.teamsseason > 0) {
      throw new ValidationError('Cannot delete flight because it has teams assigned to it');
    }

    await this.flightRepository.delete(flightId);
  }
}
