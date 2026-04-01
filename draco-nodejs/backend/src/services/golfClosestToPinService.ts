import {
  GolfClosestToPinEntryType,
  CreateGolfClosestToPinType,
  UpdateGolfClosestToPinType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IGolfClosestToPinRepository } from '../repositories/interfaces/IGolfClosestToPinRepository.js';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { GolfClosestToPinResponseFormatter } from '../responseFormatters/golfClosestToPinResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export class GolfClosestToPinService {
  private readonly ctpRepository: IGolfClosestToPinRepository;
  private readonly matchRepository: IGolfMatchRepository;
  private readonly courseRepository: IGolfCourseRepository;

  constructor() {
    this.ctpRepository = RepositoryFactory.getGolfClosestToPinRepository();
    this.matchRepository = RepositoryFactory.getGolfMatchRepository();
    this.courseRepository = RepositoryFactory.getGolfCourseRepository();
  }

  async getForMatch(matchId: bigint): Promise<GolfClosestToPinEntryType[]> {
    const entries = await this.ctpRepository.findByMatchId(matchId);
    return GolfClosestToPinResponseFormatter.formatMany(entries);
  }

  async getForFlight(flightId: bigint): Promise<GolfClosestToPinEntryType[]> {
    const entries = await this.ctpRepository.findByFlightId(flightId);
    return GolfClosestToPinResponseFormatter.formatMany(entries);
  }

  async create(
    matchId: bigint,
    data: CreateGolfClosestToPinType,
    userId: string,
  ): Promise<GolfClosestToPinEntryType> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    if (!match.courseid) {
      throw new ValidationError('Match does not have a course assigned');
    }

    const course = await this.courseRepository.findById(match.courseid);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const mensPar = course[`menspar${data.holeNumber}` as keyof typeof course] as number;
    const womansPar = course[`womanspar${data.holeNumber}` as keyof typeof course] as number;

    if (mensPar !== 3 && womansPar !== 3) {
      throw new ValidationError(`Hole ${data.holeNumber} is not a par 3`);
    }

    const created = await this.ctpRepository.create({
      matchid: matchId,
      holeno: data.holeNumber,
      contactid: BigInt(data.contactId),
      distance: data.distance,
      unit: data.unit,
      enteredby: userId,
    });

    const withDetails = await this.ctpRepository.findById(created.id);
    if (!withDetails) {
      throw new NotFoundError('Created closest to pin entry not found');
    }

    return GolfClosestToPinResponseFormatter.format(withDetails);
  }

  async update(id: bigint, data: UpdateGolfClosestToPinType): Promise<GolfClosestToPinEntryType> {
    await this.ctpRepository.update(id, {
      contactid: data.contactId !== undefined ? BigInt(data.contactId) : undefined,
      distance: data.distance,
      unit: data.unit,
    });

    const withDetails = await this.ctpRepository.findById(id);
    if (!withDetails) {
      throw new NotFoundError('Closest to pin entry not found');
    }

    return GolfClosestToPinResponseFormatter.format(withDetails);
  }

  async delete(id: bigint): Promise<void> {
    await this.ctpRepository.delete(id);
  }
}
