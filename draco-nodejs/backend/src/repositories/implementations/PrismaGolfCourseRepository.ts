import { PrismaClient, golfcourse, Prisma } from '#prisma/client';
import {
  IGolfCourseRepository,
  GolfCourseWithTees,
  GolfLeagueCourseRaw,
  CreateGolfCourseData,
  UpdateGolfCourseData,
} from '../interfaces/IGolfCourseRepository.js';

export class PrismaGolfCourseRepository implements IGolfCourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<golfcourse | null> {
    return this.prisma.golfcourse.findUnique({
      where: { id },
    });
  }

  async findByIdWithTees(courseId: bigint): Promise<GolfCourseWithTees | null> {
    return this.prisma.golfcourse.findUnique({
      where: { id: courseId },
      include: {
        golfteeinformation: {
          orderBy: { priority: 'asc' },
        },
      },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<golfcourse[]> {
    return this.prisma.golfcourse.findMany({ where });
  }

  async findLeagueCourses(accountId: bigint): Promise<GolfLeagueCourseRaw[]> {
    return this.prisma.golfleaguecourses.findMany({
      where: { accountid: accountId },
      include: {
        golfcourse: {
          include: {
            golfteeinformation: {
              orderBy: { priority: 'asc' },
            },
          },
        },
      },
    });
  }

  async addLeagueCourse(
    accountId: bigint,
    courseId: bigint,
    defaultMensTeeId?: bigint | null,
    defaultWomansTeeId?: bigint | null,
  ): Promise<void> {
    await this.prisma.golfleaguecourses.create({
      data: {
        accountid: accountId,
        courseid: courseId,
        defaultmenstee: defaultMensTeeId ?? null,
        defaultwomanstee: defaultWomansTeeId ?? null,
      },
    });
  }

  async removeLeagueCourse(accountId: bigint, courseId: bigint): Promise<void> {
    await this.prisma.golfleaguecourses.delete({
      where: {
        accountid_courseid: {
          accountid: accountId,
          courseid: courseId,
        },
      },
    });
  }

  async updateLeagueCourseDefaults(
    accountId: bigint,
    courseId: bigint,
    defaultMensTeeId?: bigint | null,
    defaultWomansTeeId?: bigint | null,
  ): Promise<void> {
    await this.prisma.golfleaguecourses.update({
      where: {
        accountid_courseid: {
          accountid: accountId,
          courseid: courseId,
        },
      },
      data: {
        defaultmenstee: defaultMensTeeId ?? null,
        defaultwomanstee: defaultWomansTeeId ?? null,
      },
    });
  }

  async create(data: CreateGolfCourseData): Promise<golfcourse> {
    return this.prisma.golfcourse.create({
      data: data as Prisma.golfcourseUncheckedCreateInput,
    });
  }

  async update(id: bigint, data: UpdateGolfCourseData): Promise<golfcourse> {
    return this.prisma.golfcourse.update({
      where: { id },
      data: data as Prisma.golfcourseUncheckedUpdateInput,
    });
  }

  async delete(id: bigint): Promise<golfcourse> {
    return this.prisma.golfcourse.delete({
      where: { id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.golfcourse.count({ where });
  }

  async findByName(name: string): Promise<golfcourse | null> {
    return this.prisma.golfcourse.findFirst({
      where: { name },
    });
  }

  async findByNameExcludingId(name: string, excludeCourseId: bigint): Promise<golfcourse | null> {
    return this.prisma.golfcourse.findFirst({
      where: {
        name,
        id: { not: excludeCourseId },
      },
    });
  }

  async findByExternalId(externalId: string): Promise<golfcourse | null> {
    return this.prisma.golfcourse.findFirst({
      where: { externalid: externalId },
    });
  }

  async isCourseInUse(courseId: bigint): Promise<boolean> {
    const matchCount = await this.prisma.golfmatch.count({
      where: { courseid: courseId },
    });

    const scoreCount = await this.prisma.golfscore.count({
      where: { courseid: courseId },
    });

    return matchCount > 0 || scoreCount > 0;
  }

  async findAllPaginated(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ courses: golfcourse[]; total: number }> {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.golfcourseWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { state: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [courses, total] = await Promise.all([
      this.prisma.golfcourse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.golfcourse.count({ where }),
    ]);

    return { courses, total };
  }

  async searchCustomCourses(
    query: string,
    excludeCourseIds?: bigint[],
    limit: number = 20,
  ): Promise<golfcourse[]> {
    const where: Prisma.golfcourseWhereInput = {
      externalid: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ],
      ...(excludeCourseIds && excludeCourseIds.length > 0
        ? { id: { notIn: excludeCourseIds } }
        : {}),
    };

    return this.prisma.golfcourse.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}
