import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import {
  IGolfTeeRepository,
  IGolfCourseRepository,
  RepositoryFactory,
} from '../repositories/index.js';
import { GolfTeeResponseFormatter } from '../responseFormatters/index.js';
import {
  GolfCourseTeeType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';

export class GolfTeeService {
  private readonly teeRepository: IGolfTeeRepository;
  private readonly courseRepository: IGolfCourseRepository;

  constructor(teeRepository?: IGolfTeeRepository, courseRepository?: IGolfCourseRepository) {
    this.teeRepository = teeRepository ?? RepositoryFactory.getGolfTeeRepository();
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
  }

  private buildPrismaDistanceData(distances: number[]): Record<string, number> {
    const data: Record<string, number> = {};
    for (let i = 0; i < 18; i++) {
      data[`distancehole${i + 1}`] = distances[i] ?? 0;
    }
    return data;
  }

  async getTeeById(teeId: bigint): Promise<GolfCourseTeeType> {
    const tee = await this.teeRepository.findById(teeId);
    if (!tee) {
      throw new NotFoundError('Golf tee not found');
    }
    return GolfTeeResponseFormatter.format(tee);
  }

  async getTeesByCourse(courseId: bigint): Promise<GolfCourseTeeType[]> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const tees = await this.teeRepository.findByCourseId(courseId);
    return GolfTeeResponseFormatter.formatMany(tees);
  }

  async createTee(courseId: bigint, teeData: CreateGolfCourseTeeType): Promise<GolfCourseTeeType> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const existingTee = await this.teeRepository.findByColor(courseId, teeData.teeColor);
    if (existingTee) {
      throw new ValidationError('A tee with this color already exists for this course');
    }

    const newTee = await this.teeRepository.create({
      courseid: courseId,
      teecolor: teeData.teeColor,
      teename: teeData.teeName,
      priority: teeData.priority,
      mensrating: teeData.mensRating,
      menslope: teeData.mensSlope,
      womansrating: teeData.womansRating,
      womanslope: teeData.womansSlope,
      mensratingfront9: teeData.mensRatingFront9 ?? 0,
      menslopefront9: teeData.mensSlopeFront9 ?? 0,
      womansratingfront9: teeData.womansRatingFront9 ?? 0,
      womanslopefront9: teeData.womansSlopeFront9 ?? 0,
      mensratingback9: teeData.mensRatingBack9 ?? 0,
      menslopeback9: teeData.mensSlopeBack9 ?? 0,
      womansratingback9: teeData.womansRatingBack9 ?? 0,
      womanslopeback9: teeData.womansSlopeBack9 ?? 0,
      ...this.buildPrismaDistanceData(teeData.distances),
    });

    return GolfTeeResponseFormatter.format(newTee);
  }

  async updateTee(teeId: bigint, teeData: UpdateGolfCourseTeeType): Promise<GolfCourseTeeType> {
    const tee = await this.teeRepository.findById(teeId);
    if (!tee) {
      throw new NotFoundError('Golf tee not found');
    }

    if (teeData.teeColor !== undefined) {
      const duplicateTee = await this.teeRepository.findByColorExcludingId(
        tee.courseid,
        teeData.teeColor,
        teeId,
      );
      if (duplicateTee) {
        throw new ValidationError('A tee with this color already exists for this course');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (teeData.teeColor !== undefined) {
      updateData.teecolor = teeData.teeColor;
    }
    if (teeData.teeName !== undefined) {
      updateData.teename = teeData.teeName;
    }
    if (teeData.priority !== undefined) {
      updateData.priority = teeData.priority;
    }
    if (teeData.mensRating !== undefined) {
      updateData.mensrating = teeData.mensRating;
    }
    if (teeData.mensSlope !== undefined) {
      updateData.menslope = teeData.mensSlope;
    }
    if (teeData.womansRating !== undefined) {
      updateData.womansrating = teeData.womansRating;
    }
    if (teeData.womansSlope !== undefined) {
      updateData.womanslope = teeData.womansSlope;
    }
    if (teeData.mensRatingFront9 !== undefined) {
      updateData.mensratingfront9 = teeData.mensRatingFront9;
    }
    if (teeData.mensSlopeFront9 !== undefined) {
      updateData.menslopefront9 = teeData.mensSlopeFront9;
    }
    if (teeData.womansRatingFront9 !== undefined) {
      updateData.womansratingfront9 = teeData.womansRatingFront9;
    }
    if (teeData.womansSlopeFront9 !== undefined) {
      updateData.womanslopefront9 = teeData.womansSlopeFront9;
    }
    if (teeData.mensRatingBack9 !== undefined) {
      updateData.mensratingback9 = teeData.mensRatingBack9;
    }
    if (teeData.mensSlopeBack9 !== undefined) {
      updateData.menslopeback9 = teeData.mensSlopeBack9;
    }
    if (teeData.womansRatingBack9 !== undefined) {
      updateData.womansratingback9 = teeData.womansRatingBack9;
    }
    if (teeData.womansSlopeBack9 !== undefined) {
      updateData.womanslopeback9 = teeData.womansSlopeBack9;
    }
    if (teeData.distances !== undefined) {
      Object.assign(updateData, this.buildPrismaDistanceData(teeData.distances));
    }

    const updatedTee = await this.teeRepository.update(teeId, updateData);
    return GolfTeeResponseFormatter.format(updatedTee);
  }

  async deleteTee(teeId: bigint): Promise<void> {
    const tee = await this.teeRepository.findById(teeId);
    if (!tee) {
      throw new NotFoundError('Golf tee not found');
    }

    const inUse = await this.teeRepository.isTeeInUse(teeId);
    if (inUse) {
      throw new ValidationError(
        'Cannot delete tee because it is being used as a default tee for a league or in scores',
      );
    }

    await this.teeRepository.delete(teeId);
  }

  async updateTeePriorities(
    courseId: bigint,
    teePriorities: { id: string; priority: number }[],
  ): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const tees = await this.teeRepository.findByCourseId(courseId);
    const teeIds = new Set(tees.map((t) => t.id.toString()));

    for (const tp of teePriorities) {
      if (!teeIds.has(tp.id)) {
        throw new ValidationError(`Tee with ID ${tp.id} does not belong to this course`);
      }
    }

    await this.teeRepository.updatePriorities(
      courseId,
      teePriorities.map((tp) => ({ id: BigInt(tp.id), priority: tp.priority })),
    );
  }
}
