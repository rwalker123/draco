import { PrismaClient } from '#prisma/client';
import { IGolferRepository, GolferWithHomeCourse } from '../interfaces/IGolferRepository.js';

export class PrismaGolferRepository implements IGolferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(golferId: bigint): Promise<GolferWithHomeCourse | null> {
    return this.prisma.golfer.findUnique({
      where: { id: golferId },
      include: {
        homecourse: true,
      },
    });
  }

  async findByContactId(contactId: bigint): Promise<GolferWithHomeCourse | null> {
    return this.prisma.golfer.findUnique({
      where: { contactid: contactId },
      include: {
        homecourse: true,
      },
    });
  }

  async create(contactId: bigint, homeCourseId?: bigint): Promise<GolferWithHomeCourse> {
    return this.prisma.golfer.create({
      data: {
        contactid: contactId,
        homecourseid: homeCourseId ?? null,
      },
      include: {
        homecourse: true,
      },
    });
  }

  async updateHomeCourse(
    golferId: bigint,
    homeCourseId: bigint | null,
  ): Promise<GolferWithHomeCourse> {
    return this.prisma.golfer.update({
      where: { id: golferId },
      data: {
        homecourseid: homeCourseId,
      },
      include: {
        homecourse: true,
      },
    });
  }

  async updateLowHandicapIndex(
    golferId: bigint,
    lowHandicapIndex: number,
  ): Promise<GolferWithHomeCourse> {
    return this.prisma.golfer.update({
      where: { id: golferId },
      data: {
        lowhandicapindex: lowHandicapIndex,
      },
      include: {
        homecourse: true,
      },
    });
  }
}
