import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import {
  IGolfCourseRepository,
  IGolfTeeRepository,
  RepositoryFactory,
} from '../repositories/index.js';
import { GolfCourseResponseFormatter } from '../responseFormatters/index.js';
import {
  GolfCourseType,
  GolfCourseWithTeesType,
  GolfLeagueCourseType,
  CreateGolfCourseType,
  UpdateGolfCourseType,
  AddLeagueCourseType,
  ExternalCourseDetailType,
  ExternalCourseSearchResultType,
  GolfCourseSlimType,
  PaginationWithTotalType,
} from '@draco/shared-schemas';

export class GolfCourseService {
  private readonly courseRepository: IGolfCourseRepository;
  private readonly teeRepository: IGolfTeeRepository;

  constructor(courseRepository?: IGolfCourseRepository, teeRepository?: IGolfTeeRepository) {
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
    this.teeRepository = teeRepository ?? RepositoryFactory.getGolfTeeRepository();
  }

  private sanitizeOptionalString(value: string | null | undefined): string {
    if (typeof value !== 'string') {
      return '';
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
  }

  private truncateString(value: string, maxLength: number): string {
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  }

  private sanitizeAndTruncate(value: string | null | undefined, maxLength: number): string {
    const sanitized = this.sanitizeOptionalString(value);
    return this.truncateString(sanitized, maxLength);
  }

  private buildPrismaParData(
    parArray: number[],
    prefix: 'menspar' | 'womanspar',
  ): Record<string, number> {
    const data: Record<string, number> = {};
    for (let i = 0; i < 18; i++) {
      data[`${prefix}${i + 1}`] = parArray[i] ?? 4;
    }
    return data;
  }

  private buildPrismaHandicapData(
    handicapArray: number[],
    prefix: 'menshandicap' | 'womanshandicap',
  ): Record<string, number> {
    const data: Record<string, number> = {};
    for (let i = 0; i < 18; i++) {
      data[`${prefix}${i + 1}`] = handicapArray[i] ?? i + 1;
    }
    return data;
  }

  async getCourseById(courseId: bigint): Promise<GolfCourseType> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }
    return GolfCourseResponseFormatter.format(course);
  }

  async getCourseWithTees(courseId: bigint): Promise<GolfCourseWithTeesType> {
    const course = await this.courseRepository.findByIdWithTees(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }
    return GolfCourseResponseFormatter.formatWithTees(course);
  }

  async getLeagueCourses(accountId: bigint): Promise<GolfLeagueCourseType[]> {
    const leagueCourses = await this.courseRepository.findLeagueCourses(accountId);
    return GolfCourseResponseFormatter.formatLeagueCourses(leagueCourses);
  }

  async getAllCoursesPaginated(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ courses: GolfCourseSlimType[]; pagination: PaginationWithTotalType }> {
    const { page, limit, search } = options;
    const { courses, total } = await this.courseRepository.findAllPaginated({
      page,
      limit,
      search,
    });

    return {
      courses: courses.map((course) => GolfCourseResponseFormatter.formatSlim(course)),
      pagination: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getTotalCourseCount(): Promise<number> {
    return this.courseRepository.count();
  }

  async createCourse(courseData: CreateGolfCourseType): Promise<GolfCourseType> {
    const name = courseData.name.trim();
    const existingCourse = await this.courseRepository.findByName(name);
    if (existingCourse) {
      throw new ValidationError('A course with this name already exists');
    }

    const newCourse = await this.courseRepository.create({
      name,
      designer: this.sanitizeOptionalString(courseData.designer),
      yearbuilt: courseData.yearBuilt ?? null,
      numberofholes: courseData.numberOfHoles,
      address: this.sanitizeOptionalString(courseData.address),
      city: this.sanitizeOptionalString(courseData.city),
      state: this.sanitizeOptionalString(courseData.state),
      zip: this.sanitizeOptionalString(courseData.zip),
      country: this.sanitizeOptionalString(courseData.country),
      ...this.buildPrismaParData(courseData.mensPar, 'menspar'),
      ...this.buildPrismaParData(courseData.womansPar, 'womanspar'),
      ...this.buildPrismaHandicapData(courseData.mensHandicap, 'menshandicap'),
      ...this.buildPrismaHandicapData(courseData.womansHandicap, 'womanshandicap'),
    });

    return GolfCourseResponseFormatter.format(newCourse);
  }

  async updateCourse(courseId: bigint, courseData: UpdateGolfCourseType): Promise<GolfCourseType> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    if (courseData.name) {
      const name = courseData.name.trim();
      const duplicateCourse = await this.courseRepository.findByNameExcludingId(name, courseId);
      if (duplicateCourse) {
        throw new ValidationError('A course with this name already exists');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (courseData.name !== undefined) {
      updateData.name = courseData.name.trim();
    }
    if (courseData.designer !== undefined) {
      updateData.designer = this.sanitizeOptionalString(courseData.designer);
    }
    if (courseData.yearBuilt !== undefined) {
      updateData.yearbuilt = courseData.yearBuilt;
    }
    if (courseData.numberOfHoles !== undefined) {
      updateData.numberofholes = courseData.numberOfHoles;
    }
    if (courseData.address !== undefined) {
      updateData.address = this.sanitizeOptionalString(courseData.address);
    }
    if (courseData.city !== undefined) {
      updateData.city = this.sanitizeOptionalString(courseData.city);
    }
    if (courseData.state !== undefined) {
      updateData.state = this.sanitizeOptionalString(courseData.state);
    }
    if (courseData.zip !== undefined) {
      updateData.zip = this.sanitizeOptionalString(courseData.zip);
    }
    if (courseData.country !== undefined) {
      updateData.country = this.sanitizeOptionalString(courseData.country);
    }
    if (courseData.mensPar !== undefined) {
      Object.assign(updateData, this.buildPrismaParData(courseData.mensPar, 'menspar'));
    }
    if (courseData.womansPar !== undefined) {
      Object.assign(updateData, this.buildPrismaParData(courseData.womansPar, 'womanspar'));
    }
    if (courseData.mensHandicap !== undefined) {
      Object.assign(
        updateData,
        this.buildPrismaHandicapData(courseData.mensHandicap, 'menshandicap'),
      );
    }
    if (courseData.womansHandicap !== undefined) {
      Object.assign(
        updateData,
        this.buildPrismaHandicapData(courseData.womansHandicap, 'womanshandicap'),
      );
    }

    const updatedCourse = await this.courseRepository.update(courseId, updateData);
    return GolfCourseResponseFormatter.format(updatedCourse);
  }

  async deleteCourse(courseId: bigint): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const inUse = await this.courseRepository.isCourseInUse(courseId);
    if (inUse) {
      throw new ValidationError(
        'Cannot delete course because it is being used in matches or has associated scores',
      );
    }

    await this.courseRepository.delete(courseId);
  }

  async addLeagueCourse(accountId: bigint, data: AddLeagueCourseType): Promise<void> {
    const courseId = BigInt(data.courseId);
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Golf course not found');
    }

    const existingLeagueCourses = await this.courseRepository.findLeagueCourses(accountId);
    const alreadyAdded = existingLeagueCourses.some((lc) => lc.courseid === courseId);
    if (alreadyAdded) {
      throw new ValidationError('This course is already added to the league');
    }

    await this.courseRepository.addLeagueCourse(
      accountId,
      courseId,
      data.defaultMensTeeId ? BigInt(data.defaultMensTeeId) : null,
      data.defaultWomansTeeId ? BigInt(data.defaultWomansTeeId) : null,
    );
  }

  async removeLeagueCourse(accountId: bigint, courseId: bigint): Promise<void> {
    const existingLeagueCourses = await this.courseRepository.findLeagueCourses(accountId);
    const leagueCourse = existingLeagueCourses.find((lc) => lc.courseid === courseId);
    if (!leagueCourse) {
      throw new NotFoundError('Course is not associated with this league');
    }

    await this.courseRepository.removeLeagueCourse(accountId, courseId);
  }

  async updateLeagueCourseDefaults(
    accountId: bigint,
    courseId: bigint,
    defaultMensTeeId?: bigint | null,
    defaultWomansTeeId?: bigint | null,
  ): Promise<void> {
    const existingLeagueCourses = await this.courseRepository.findLeagueCourses(accountId);
    const leagueCourse = existingLeagueCourses.find((lc) => lc.courseid === courseId);
    if (!leagueCourse) {
      throw new NotFoundError('Course is not associated with this league');
    }

    await this.courseRepository.updateLeagueCourseDefaults(
      accountId,
      courseId,
      defaultMensTeeId,
      defaultWomansTeeId,
    );
  }

  async findOrCreateFromExternal(
    externalCourse: ExternalCourseDetailType,
  ): Promise<GolfCourseWithTeesType> {
    const existingCourse = await this.courseRepository.findByExternalId(externalCourse.externalId);
    if (existingCourse) {
      const courseWithTees = await this.courseRepository.findByIdWithTees(existingCourse.id);
      if (!courseWithTees) {
        throw new NotFoundError('Golf course not found');
      }
      return GolfCourseResponseFormatter.formatWithTees(courseWithTees);
    }

    const newCourse = await this.courseRepository.create({
      externalid: this.sanitizeAndTruncate(externalCourse.externalId, 50),
      name: this.truncateString(externalCourse.name, 100),
      designer: this.sanitizeAndTruncate(externalCourse.designer, 50),
      yearbuilt: externalCourse.yearBuilt ?? null,
      numberofholes: externalCourse.numberOfHoles,
      address: this.sanitizeAndTruncate(externalCourse.address, 200),
      city: this.sanitizeAndTruncate(externalCourse.city, 50),
      state: this.sanitizeAndTruncate(externalCourse.state, 50),
      zip: this.sanitizeAndTruncate(externalCourse.zip, 20),
      country: this.sanitizeAndTruncate(externalCourse.country, 30),
      ...this.buildPrismaParData(externalCourse.mensPar, 'menspar'),
      ...this.buildPrismaParData(externalCourse.womansPar, 'womanspar'),
      ...this.buildPrismaHandicapData(externalCourse.mensHandicap, 'menshandicap'),
      ...this.buildPrismaHandicapData(externalCourse.womansHandicap, 'womanshandicap'),
    });

    for (let i = 0; i < externalCourse.tees.length; i++) {
      const tee = externalCourse.tees[i];
      await this.teeRepository.create({
        courseid: newCourse.id,
        teecolor: tee.teeColor,
        teename: tee.teeName,
        priority: i + 1,
        mensrating: tee.mensRating,
        menslope: tee.mensSlope,
        womansrating: tee.womansRating,
        womanslope: tee.womansSlope,
        mensratingfront9: tee.nineHoleMensRating ?? 0,
        menslopefront9: tee.nineHoleMensSlope ?? 0,
        womansratingfront9: tee.nineHoleWomansRating ?? 0,
        womanslopefront9: tee.nineHoleWomansSlope ?? 0,
        mensratingback9: 0,
        menslopeback9: 0,
        womansratingback9: 0,
        womanslopeback9: 0,
        ...this.buildPrismaDistanceData(tee.distances),
      });
    }

    const courseWithTees = await this.courseRepository.findByIdWithTees(newCourse.id);
    if (!courseWithTees) {
      throw new NotFoundError('Golf course not found after creation');
    }
    return GolfCourseResponseFormatter.formatWithTees(courseWithTees);
  }

  private buildPrismaDistanceData(distances: number[]): Record<string, number> {
    const data: Record<string, number> = {};
    for (let i = 0; i < 18; i++) {
      data[`distancehole${i + 1}`] = distances[i] ?? 0;
    }
    return data;
  }

  async searchCustomCourses(
    query: string,
    accountId?: bigint,
    limit: number = 20,
  ): Promise<ExternalCourseSearchResultType[]> {
    let excludeCourseIds: bigint[] | undefined;

    if (accountId) {
      const leagueCourses = await this.courseRepository.findLeagueCourses(accountId);
      excludeCourseIds = leagueCourses.map((lc) => lc.courseid);
    }

    const customCourses = await this.courseRepository.searchCustomCourses(
      query,
      excludeCourseIds,
      limit,
    );

    return customCourses.map((course) => ({
      externalId: '',
      name: course.name,
      city: course.city ?? null,
      state: course.state ?? null,
      country: course.country ?? null,
      numberOfHoles: course.numberofholes,
      courseId: course.id.toString(),
    }));
  }

  async getLeagueCourseIds(accountId: bigint): Promise<bigint[]> {
    const leagueCourses = await this.courseRepository.findLeagueCourses(accountId);
    return leagueCourses.map((lc) => lc.courseid);
  }
}
