import { PrismaClient, baseballlivescoringsession } from '#prisma/client';
import {
  IBaseballLiveScoringRepository,
  BaseballLiveScoringSessionWithScores,
  BaseballLiveInningScoreWithDetails,
  CreateBaseballLiveScoringSessionData,
  UpsertBaseballLiveInningScoreData,
} from '../interfaces/IBaseballLiveScoringRepository.js';

const sessionWithScoresInclude = {
  scores: {
    include: {
      enteredbyuser: true,
    },
    orderBy: [{ inningnumber: 'asc' as const }, { ishometeam: 'asc' as const }],
  },
  startedbyuser: true,
};

const inningScoreWithDetailsInclude = {
  enteredbyuser: true,
};

export class PrismaBaseballLiveScoringRepository implements IBaseballLiveScoringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByGame(gameId: bigint): Promise<BaseballLiveScoringSessionWithScores | null> {
    return this.prisma.baseballlivescoringsession.findFirst({
      where: {
        gameid: gameId,
        status: 1, // Active
      },
      include: sessionWithScoresInclude,
    });
  }

  async findByGame(gameId: bigint): Promise<BaseballLiveScoringSessionWithScores | null> {
    return this.prisma.baseballlivescoringsession.findFirst({
      where: {
        gameid: gameId,
      },
      include: sessionWithScoresInclude,
    });
  }

  async findById(sessionId: bigint): Promise<BaseballLiveScoringSessionWithScores | null> {
    return this.prisma.baseballlivescoringsession.findUnique({
      where: { id: sessionId },
      include: sessionWithScoresInclude,
    });
  }

  async create(data: CreateBaseballLiveScoringSessionData): Promise<baseballlivescoringsession> {
    return this.prisma.baseballlivescoringsession.create({
      data: {
        gameid: data.gameid,
        startedby: data.startedby,
        currentinning: data.currentinning ?? 1,
        status: 1, // Active
      },
    });
  }

  async updateStatus(sessionId: bigint, status: number): Promise<baseballlivescoringsession> {
    return this.prisma.baseballlivescoringsession.update({
      where: { id: sessionId },
      data: {
        status,
        lastactivity: new Date(),
      },
    });
  }

  async updateCurrentInning(
    sessionId: bigint,
    inningNumber: number,
  ): Promise<baseballlivescoringsession> {
    return this.prisma.baseballlivescoringsession.update({
      where: { id: sessionId },
      data: {
        currentinning: inningNumber,
        lastactivity: new Date(),
      },
    });
  }

  async updateLastActivity(sessionId: bigint): Promise<baseballlivescoringsession> {
    return this.prisma.baseballlivescoringsession.update({
      where: { id: sessionId },
      data: {
        lastactivity: new Date(),
      },
    });
  }

  async upsertInningScore(
    data: UpsertBaseballLiveInningScoreData,
  ): Promise<BaseballLiveInningScoreWithDetails> {
    return this.prisma.baseballliveinningscore.upsert({
      where: {
        sessionid_inningnumber_ishometeam: {
          sessionid: data.sessionid,
          inningnumber: data.inningnumber,
          ishometeam: data.ishometeam,
        },
      },
      create: {
        sessionid: data.sessionid,
        inningnumber: data.inningnumber,
        ishometeam: data.ishometeam,
        runs: data.runs,
        enteredby: data.enteredby,
      },
      update: {
        runs: data.runs,
        enteredby: data.enteredby,
        enteredat: new Date(),
      },
      include: inningScoreWithDetailsInclude,
    });
  }

  async getSessionScores(sessionId: bigint): Promise<BaseballLiveInningScoreWithDetails[]> {
    return this.prisma.baseballliveinningscore.findMany({
      where: { sessionid: sessionId },
      include: inningScoreWithDetailsInclude,
      orderBy: [{ inningnumber: 'asc' }, { ishometeam: 'asc' }],
    });
  }

  async deleteSession(sessionId: bigint): Promise<baseballlivescoringsession> {
    return this.prisma.baseballlivescoringsession.delete({
      where: { id: sessionId },
    });
  }

  async findActiveSessionsForAccount(
    accountId: bigint,
  ): Promise<{ gameId: bigint; sessionId: bigint }[]> {
    const sessions = await this.prisma.baseballlivescoringsession.findMany({
      where: {
        status: 1, // Active
        leagueschedule: {
          leagueseason: {
            league: {
              accountid: accountId,
            },
          },
        },
      },
      select: {
        id: true,
        gameid: true,
      },
    });

    return sessions.map((s) => ({
      gameId: s.gameid,
      sessionId: s.id,
    }));
  }

  async markAllActiveSessionsAbandoned(): Promise<number> {
    const result = await this.prisma.baseballlivescoringsession.updateMany({
      where: {
        status: 1, // Active
      },
      data: {
        status: 5, // Abandoned
        lastactivity: new Date(),
      },
    });
    return result.count;
  }
}
