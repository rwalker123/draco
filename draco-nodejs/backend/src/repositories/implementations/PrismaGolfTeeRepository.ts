import { PrismaClient, golfteeinformation } from '#prisma/client';
import { IGolfTeeRepository } from '../interfaces/IGolfTeeRepository.js';

export class PrismaGolfTeeRepository implements IGolfTeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<golfteeinformation | null> {
    return this.prisma.golfteeinformation.findUnique({
      where: { id },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<golfteeinformation[]> {
    return this.prisma.golfteeinformation.findMany({ where });
  }

  async findByCourseId(courseId: bigint): Promise<golfteeinformation[]> {
    return this.prisma.golfteeinformation.findMany({
      where: { courseid: courseId },
      orderBy: { priority: 'asc' },
    });
  }

  async findByColor(courseId: bigint, teeColor: string): Promise<golfteeinformation | null> {
    return this.prisma.golfteeinformation.findFirst({
      where: {
        courseid: courseId,
        teecolor: teeColor,
      },
    });
  }

  async findByColorExcludingId(
    courseId: bigint,
    teeColor: string,
    excludeTeeId: bigint,
  ): Promise<golfteeinformation | null> {
    return this.prisma.golfteeinformation.findFirst({
      where: {
        courseid: courseId,
        teecolor: teeColor,
        id: { not: excludeTeeId },
      },
    });
  }

  async create(data: Partial<golfteeinformation>): Promise<golfteeinformation> {
    return this.prisma.golfteeinformation.create({
      data: data as Parameters<typeof this.prisma.golfteeinformation.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<golfteeinformation>): Promise<golfteeinformation> {
    return this.prisma.golfteeinformation.update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint): Promise<golfteeinformation> {
    return this.prisma.golfteeinformation.delete({
      where: { id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.golfteeinformation.count({ where });
  }

  async isTeeInUse(teeId: bigint): Promise<boolean> {
    const scoreCount = await this.prisma.golfscore.count({
      where: { teeid: teeId },
    });

    return scoreCount > 0;
  }

  async updatePriorities(
    courseId: bigint,
    teePriorities: { id: bigint; priority: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      teePriorities.map(({ id, priority }) =>
        this.prisma.golfteeinformation.update({
          where: { id, courseid: courseId },
          data: { priority },
        }),
      ),
    );
  }
}
