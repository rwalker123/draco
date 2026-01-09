import { PrismaClient, individuallivescoringsession } from '#prisma/client';
import {
  IIndividualLiveScoringRepository,
  IndividualLiveScoringSessionWithScores,
  IndividualLiveHoleScoreWithDetails,
  CreateIndividualLiveScoringSessionData,
  UpsertIndividualLiveHoleScoreData,
} from '../interfaces/IIndividualLiveScoringRepository.js';

const sessionWithScoresInclude = {
  scores: {
    include: {
      enteredbyuser: true,
    },
    orderBy: { holenumber: 'asc' as const },
  },
  startedbyuser: true,
  golfer: {
    include: {
      contact: {
        select: { firstname: true, lastname: true },
      },
    },
  },
  golfcourse: true,
  golfteeinformation: true,
};

const holeScoreWithDetailsInclude = {
  enteredbyuser: true,
};

export class PrismaIndividualLiveScoringRepository implements IIndividualLiveScoringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByAccount(
    accountId: bigint,
  ): Promise<IndividualLiveScoringSessionWithScores | null> {
    return this.prisma.individuallivescoringsession.findFirst({
      where: {
        accountid: accountId,
        status: 1,
      },
      include: sessionWithScoresInclude,
    });
  }

  async findByAccount(accountId: bigint): Promise<IndividualLiveScoringSessionWithScores | null> {
    return this.prisma.individuallivescoringsession.findFirst({
      where: {
        accountid: accountId,
      },
      include: sessionWithScoresInclude,
    });
  }

  async findById(sessionId: bigint): Promise<IndividualLiveScoringSessionWithScores | null> {
    return this.prisma.individuallivescoringsession.findUnique({
      where: { id: sessionId },
      include: sessionWithScoresInclude,
    });
  }

  async create(
    data: CreateIndividualLiveScoringSessionData,
  ): Promise<individuallivescoringsession> {
    return this.prisma.individuallivescoringsession.create({
      data: {
        accountid: data.accountid,
        golferid: data.golferid,
        courseid: data.courseid,
        teeid: data.teeid,
        startedby: data.startedby,
        currenthole: data.currenthole ?? 1,
        holesplayed: data.holesplayed ?? 18,
        dateplayed: data.dateplayed,
        status: 1,
      },
    });
  }

  async updateStatus(sessionId: bigint, status: number): Promise<individuallivescoringsession> {
    return this.prisma.individuallivescoringsession.update({
      where: { id: sessionId },
      data: {
        status,
        lastactivity: new Date(),
      },
    });
  }

  async updateCurrentHole(
    sessionId: bigint,
    holeNumber: number,
  ): Promise<individuallivescoringsession> {
    return this.prisma.individuallivescoringsession.update({
      where: { id: sessionId },
      data: {
        currenthole: holeNumber,
        lastactivity: new Date(),
      },
    });
  }

  async updateLastActivity(sessionId: bigint): Promise<individuallivescoringsession> {
    return this.prisma.individuallivescoringsession.update({
      where: { id: sessionId },
      data: {
        lastactivity: new Date(),
      },
    });
  }

  async upsertHoleScore(
    data: UpsertIndividualLiveHoleScoreData,
  ): Promise<IndividualLiveHoleScoreWithDetails> {
    return this.prisma.individualliveholescore.upsert({
      where: {
        sessionid_holenumber: {
          sessionid: data.sessionid,
          holenumber: data.holenumber,
        },
      },
      create: {
        sessionid: data.sessionid,
        holenumber: data.holenumber,
        score: data.score,
        enteredby: data.enteredby,
      },
      update: {
        score: data.score,
        enteredby: data.enteredby,
        enteredat: new Date(),
      },
      include: holeScoreWithDetailsInclude,
    });
  }

  async getSessionScores(sessionId: bigint): Promise<IndividualLiveHoleScoreWithDetails[]> {
    return this.prisma.individualliveholescore.findMany({
      where: { sessionid: sessionId },
      include: holeScoreWithDetailsInclude,
      orderBy: { holenumber: 'asc' },
    });
  }

  async deleteSession(sessionId: bigint): Promise<individuallivescoringsession> {
    return this.prisma.individuallivescoringsession.delete({
      where: { id: sessionId },
    });
  }

  async markAllActiveSessionsAbandoned(): Promise<number> {
    const result = await this.prisma.individuallivescoringsession.updateMany({
      where: {
        status: 1,
      },
      data: {
        status: 5,
        lastactivity: new Date(),
      },
    });
    return result.count;
  }
}
