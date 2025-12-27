import { PrismaClient, golfcourse } from '#prisma/client';
import {
  IGolfCourseRepository,
  GolfCourseWithTees,
  GolfLeagueCourseRaw,
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

  async create(data: Partial<golfcourse>): Promise<golfcourse> {
    return this.prisma.golfcourse.create({
      data: data as Parameters<typeof this.prisma.golfcourse.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<golfcourse>): Promise<golfcourse> {
    return this.prisma.golfcourse.update({
      where: { id },
      data,
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

  async isCourseInUse(courseId: bigint): Promise<boolean> {
    const matchCount = await this.prisma.golfmatch.count({
      where: { courseid: courseId },
    });

    const scoreCount = await this.prisma.golfscore.count({
      where: { courseid: courseId },
    });

    return matchCount > 0 || scoreCount > 0;
  }
}
