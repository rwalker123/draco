import { PrismaClient, livescoringsession, liveholescore } from '#prisma/client';
import {
  ILiveScoringRepository,
  LiveScoringSessionWithScores,
  LiveHoleScoreWithDetails,
  CreateLiveScoringSessionData,
  UpsertLiveHoleScoreData,
} from '../interfaces/ILiveScoringRepository.js';

const sessionWithScoresInclude = {
  scores: {
    include: {
      golfer: {
        include: {
          contact: {
            select: { firstname: true, lastname: true },
          },
        },
      },
      enteredbyuser: true,
    },
    orderBy: [{ golferid: 'asc' as const }, { holenumber: 'asc' as const }],
  },
  startedbyuser: true,
};

const holeScoreWithDetailsInclude = {
  golfer: {
    include: {
      contact: {
        select: { firstname: true, lastname: true },
      },
    },
  },
  enteredbyuser: true,
};

export class PrismaLiveScoringRepository implements ILiveScoringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByMatch(matchId: bigint): Promise<LiveScoringSessionWithScores | null> {
    return this.prisma.livescoringsession.findFirst({
      where: {
        matchid: matchId,
        status: 1, // Active
      },
      include: sessionWithScoresInclude,
    });
  }

  async findById(sessionId: bigint): Promise<LiveScoringSessionWithScores | null> {
    return this.prisma.livescoringsession.findUnique({
      where: { id: sessionId },
      include: sessionWithScoresInclude,
    });
  }

  async create(data: CreateLiveScoringSessionData): Promise<livescoringsession> {
    return this.prisma.livescoringsession.create({
      data: {
        matchid: data.matchid,
        startedby: data.startedby,
        currenthole: data.currenthole ?? 1,
        status: 1, // Active
      },
    });
  }

  async updateStatus(sessionId: bigint, status: number): Promise<livescoringsession> {
    return this.prisma.livescoringsession.update({
      where: { id: sessionId },
      data: {
        status,
        lastactivity: new Date(),
      },
    });
  }

  async updateCurrentHole(sessionId: bigint, holeNumber: number): Promise<livescoringsession> {
    return this.prisma.livescoringsession.update({
      where: { id: sessionId },
      data: {
        currenthole: holeNumber,
        lastactivity: new Date(),
      },
    });
  }

  async updateLastActivity(sessionId: bigint): Promise<livescoringsession> {
    return this.prisma.livescoringsession.update({
      where: { id: sessionId },
      data: {
        lastactivity: new Date(),
      },
    });
  }

  async upsertHoleScore(data: UpsertLiveHoleScoreData): Promise<LiveHoleScoreWithDetails> {
    return this.prisma.liveholescore.upsert({
      where: {
        sessionid_golferid_holenumber: {
          sessionid: data.sessionid,
          golferid: data.golferid,
          holenumber: data.holenumber,
        },
      },
      create: {
        sessionid: data.sessionid,
        golferid: data.golferid,
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

  async getSessionScores(sessionId: bigint): Promise<LiveHoleScoreWithDetails[]> {
    return this.prisma.liveholescore.findMany({
      where: { sessionid: sessionId },
      include: holeScoreWithDetailsInclude,
      orderBy: [{ golferid: 'asc' }, { holenumber: 'asc' }],
    });
  }

  async getGolferScores(sessionId: bigint, golferId: bigint): Promise<liveholescore[]> {
    return this.prisma.liveholescore.findMany({
      where: {
        sessionid: sessionId,
        golferid: golferId,
      },
      orderBy: { holenumber: 'asc' },
    });
  }

  async deleteSession(sessionId: bigint): Promise<livescoringsession> {
    return this.prisma.livescoringsession.delete({
      where: { id: sessionId },
    });
  }

  async findActiveSessionsForAccount(
    accountId: bigint,
  ): Promise<{ matchId: bigint; sessionId: bigint }[]> {
    const sessions = await this.prisma.livescoringsession.findMany({
      where: {
        status: 1, // Active
        golfmatch: {
          leagueseason: {
            league: {
              accountid: accountId,
            },
          },
        },
      },
      select: {
        id: true,
        matchid: true,
      },
    });

    return sessions.map((s) => ({
      matchId: s.matchid,
      sessionId: s.id,
    }));
  }
}
