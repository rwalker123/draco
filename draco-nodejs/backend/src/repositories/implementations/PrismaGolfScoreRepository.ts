import { PrismaClient, golfscore, golfmatchscores, golfteeinformation } from '#prisma/client';
import {
  IGolfScoreRepository,
  GolfScoreWithDetails,
  GolfMatchScoreWithDetails,
  CreateGolfScoreData,
  UpdateGolfScoreData,
  CreateMatchScoreData,
  MatchScoreSubmission,
  SubmitMatchScoresResult,
} from '../interfaces/IGolfScoreRepository.js';
import { GolfMatchStatus } from '../../utils/golfConstants.js';

const scoreWithDetailsInclude = {
  golfer: {
    include: {
      contact: true,
    },
  },
  golfcourse: true,
  golfteeinformation: true,
};

const matchScoreWithDetailsInclude = {
  golfscore: {
    include: scoreWithDetailsInclude,
  },
};

export class PrismaGolfScoreRepository implements IGolfScoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(scoreId: bigint): Promise<GolfScoreWithDetails | null> {
    return this.prisma.golfscore.findUnique({
      where: { id: scoreId },
      include: scoreWithDetailsInclude,
    });
  }

  async findByGolferId(golferId: bigint, limit = 20): Promise<GolfScoreWithDetails[]> {
    return this.prisma.golfscore.findMany({
      where: {
        golferid: golferId,
        golfmatchscores: {
          some: {
            golfmatch: {
              matchstatus: GolfMatchStatus.COMPLETED,
            },
          },
        },
      },
      include: scoreWithDetailsInclude,
      orderBy: { dateplayed: 'desc' },
      take: limit,
    });
  }

  async findAllByGolferId(golferId: bigint, limit = 20): Promise<GolfScoreWithDetails[]> {
    return this.prisma.golfscore.findMany({
      where: {
        golferid: golferId,
      },
      include: scoreWithDetailsInclude,
      orderBy: { dateplayed: 'desc' },
      take: limit,
    });
  }

  async findByGolferIdBeforeDate(
    golferId: bigint,
    beforeDate: Date,
    limit = 20,
  ): Promise<GolfScoreWithDetails[]> {
    return this.prisma.golfscore.findMany({
      where: {
        golferid: golferId,
        dateplayed: { lt: beforeDate },
        golfmatchscores: {
          some: {
            golfmatch: {
              matchstatus: GolfMatchStatus.COMPLETED,
            },
          },
        },
      },
      include: scoreWithDetailsInclude,
      orderBy: { dateplayed: 'desc' },
      take: limit,
    });
  }

  async findByMatchId(matchId: bigint): Promise<GolfMatchScoreWithDetails[]> {
    return this.prisma.golfmatchscores.findMany({
      where: { matchid: matchId },
      include: matchScoreWithDetailsInclude,
    });
  }

  async findByMatchIds(matchIds: bigint[]): Promise<Map<bigint, GolfMatchScoreWithDetails[]>> {
    if (matchIds.length === 0) {
      return new Map();
    }

    const allScores = await this.prisma.golfmatchscores.findMany({
      where: { matchid: { in: matchIds } },
      include: matchScoreWithDetailsInclude,
    });

    const scoresByMatchId = new Map<bigint, GolfMatchScoreWithDetails[]>();
    for (const matchId of matchIds) {
      scoresByMatchId.set(matchId, []);
    }
    for (const score of allScores) {
      const matchScores = scoresByMatchId.get(score.matchid);
      if (matchScores) {
        matchScores.push(score);
      }
    }

    return scoresByMatchId;
  }

  async findByTeamAndMatch(matchId: bigint, teamId: bigint): Promise<GolfMatchScoreWithDetails[]> {
    return this.prisma.golfmatchscores.findMany({
      where: {
        matchid: matchId,
        teamid: teamId,
      },
      include: matchScoreWithDetailsInclude,
    });
  }

  async create(data: CreateGolfScoreData): Promise<golfscore> {
    return this.prisma.golfscore.create({
      data: {
        courseid: data.courseid,
        golferid: data.golferid,
        teeid: data.teeid,
        dateplayed: data.dateplayed,
        holesplayed: data.holesplayed,
        totalscore: data.totalscore,
        totalsonly: data.totalsonly,
        holescrore1: data.holescrore1,
        holescrore2: data.holescrore2,
        holescrore3: data.holescrore3,
        holescrore4: data.holescrore4,
        holescrore5: data.holescrore5,
        holescrore6: data.holescrore6,
        holescrore7: data.holescrore7,
        holescrore8: data.holescrore8,
        holescrore9: data.holescrore9,
        holescrore10: data.holescrore10,
        holescrore11: data.holescrore11,
        holescrore12: data.holescrore12,
        holescrore13: data.holescrore13,
        holescrore14: data.holescrore14,
        holescrore15: data.holescrore15,
        holescrore16: data.holescrore16,
        holescrore17: data.holescrore17,
        holescrore18: data.holescrore18,
        startindex: data.startindex ?? null,
        startindex9: data.startindex9 ?? null,
      },
    });
  }

  async update(scoreId: bigint, data: UpdateGolfScoreData): Promise<golfscore> {
    return this.prisma.golfscore.update({
      where: { id: scoreId },
      data,
    });
  }

  async delete(scoreId: bigint): Promise<golfscore> {
    return this.prisma.golfscore.delete({
      where: { id: scoreId },
    });
  }

  async createMatchScore(data: CreateMatchScoreData): Promise<golfmatchscores> {
    return this.prisma.golfmatchscores.create({
      data: {
        matchid: data.matchid,
        teamid: data.teamid,
        golferid: data.golferid,
        scoreid: data.scoreid,
        substitutefor: data.substitutefor ?? null,
      },
    });
  }

  async deleteMatchScores(matchId: bigint): Promise<number> {
    const result = await this.prisma.golfmatchscores.deleteMany({
      where: { matchid: matchId },
    });
    return result.count;
  }

  async deleteMatchScoresForTeam(matchId: bigint, teamId: bigint): Promise<number> {
    const result = await this.prisma.golfmatchscores.deleteMany({
      where: {
        matchid: matchId,
        teamid: teamId,
      },
    });
    return result.count;
  }

  async getPlayerScoresForSeason(
    contactId: bigint,
    seasonId: bigint,
  ): Promise<GolfScoreWithDetails[]> {
    return this.prisma.golfscore.findMany({
      where: {
        golfer: {
          contactid: contactId,
        },
        golfmatchscores: {
          some: {
            golfmatch: {
              matchstatus: GolfMatchStatus.COMPLETED,
              leagueseason: {
                seasonid: seasonId,
              },
            },
          },
        },
      },
      include: scoreWithDetailsInclude,
      orderBy: { dateplayed: 'desc' },
    });
  }

  calculateDifferential(score: golfscore, teeInfo: golfteeinformation): number {
    const courseRating = Number(teeInfo.mensrating) || 72;
    const slopeRating = Number(teeInfo.menslope) || 113;

    const differential = ((score.totalscore - courseRating) * 113) / slopeRating;

    return Math.round(differential * 10) / 10;
  }

  async submitMatchScoresTransactional(
    matchId: bigint,
    teamIds: bigint[],
    submissions: MatchScoreSubmission[],
  ): Promise<SubmitMatchScoresResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingByGolfer = new Map<
        string,
        { scoreid: bigint; teamid: bigint; startindex: number | null }
      >();

      for (const teamId of teamIds) {
        const existingMatchScores = await tx.golfmatchscores.findMany({
          where: {
            matchid: matchId,
            teamid: teamId,
          },
          select: {
            golferid: true,
            scoreid: true,
            teamid: true,
            golfscore: {
              select: { startindex: true },
            },
          },
        });

        for (const ms of existingMatchScores) {
          existingByGolfer.set(ms.golferid.toString(), {
            scoreid: ms.scoreid,
            teamid: ms.teamid,
            startindex: ms.golfscore.startindex,
          });
        }
      }

      const submittedGolferIds = new Set<string>();
      const createdScoreIds: bigint[] = [];

      for (const submission of submissions) {
        const golferKey = submission.golferId.toString();
        submittedGolferIds.add(golferKey);

        const existing = existingByGolfer.get(golferKey);

        if (existing) {
          const shouldBackfillStartindex =
            existing.startindex === null && submission.scoreData.startindex !== null;

          await tx.golfscore.update({
            where: { id: existing.scoreid },
            data: {
              courseid: submission.scoreData.courseid,
              teeid: submission.scoreData.teeid,
              dateplayed: submission.scoreData.dateplayed,
              holesplayed: submission.scoreData.holesplayed,
              totalscore: submission.scoreData.totalscore,
              totalsonly: submission.scoreData.totalsonly,
              holescrore1: submission.scoreData.holescrore1,
              holescrore2: submission.scoreData.holescrore2,
              holescrore3: submission.scoreData.holescrore3,
              holescrore4: submission.scoreData.holescrore4,
              holescrore5: submission.scoreData.holescrore5,
              holescrore6: submission.scoreData.holescrore6,
              holescrore7: submission.scoreData.holescrore7,
              holescrore8: submission.scoreData.holescrore8,
              holescrore9: submission.scoreData.holescrore9,
              holescrore10: submission.scoreData.holescrore10,
              holescrore11: submission.scoreData.holescrore11,
              holescrore12: submission.scoreData.holescrore12,
              holescrore13: submission.scoreData.holescrore13,
              holescrore14: submission.scoreData.holescrore14,
              holescrore15: submission.scoreData.holescrore15,
              holescrore16: submission.scoreData.holescrore16,
              holescrore17: submission.scoreData.holescrore17,
              holescrore18: submission.scoreData.holescrore18,
              ...(shouldBackfillStartindex && {
                startindex: submission.scoreData.startindex,
                startindex9: submission.scoreData.startindex9,
              }),
            },
          });

          if (existing.teamid !== submission.teamId) {
            await tx.golfmatchscores.updateMany({
              where: { matchid: matchId, golferid: submission.golferId },
              data: { teamid: submission.teamId },
            });
          }
        } else {
          const score = await tx.golfscore.create({
            data: {
              courseid: submission.scoreData.courseid,
              golferid: submission.scoreData.golferid,
              teeid: submission.scoreData.teeid,
              dateplayed: submission.scoreData.dateplayed,
              holesplayed: submission.scoreData.holesplayed,
              totalscore: submission.scoreData.totalscore,
              totalsonly: submission.scoreData.totalsonly,
              holescrore1: submission.scoreData.holescrore1,
              holescrore2: submission.scoreData.holescrore2,
              holescrore3: submission.scoreData.holescrore3,
              holescrore4: submission.scoreData.holescrore4,
              holescrore5: submission.scoreData.holescrore5,
              holescrore6: submission.scoreData.holescrore6,
              holescrore7: submission.scoreData.holescrore7,
              holescrore8: submission.scoreData.holescrore8,
              holescrore9: submission.scoreData.holescrore9,
              holescrore10: submission.scoreData.holescrore10,
              holescrore11: submission.scoreData.holescrore11,
              holescrore12: submission.scoreData.holescrore12,
              holescrore13: submission.scoreData.holescrore13,
              holescrore14: submission.scoreData.holescrore14,
              holescrore15: submission.scoreData.holescrore15,
              holescrore16: submission.scoreData.holescrore16,
              holescrore17: submission.scoreData.holescrore17,
              holescrore18: submission.scoreData.holescrore18,
              startindex: submission.scoreData.startindex ?? null,
              startindex9: submission.scoreData.startindex9 ?? null,
            },
          });

          await tx.golfmatchscores.create({
            data: {
              matchid: matchId,
              teamid: submission.teamId,
              golferid: submission.golferId,
              scoreid: score.id,
            },
          });

          createdScoreIds.push(score.id);
        }
      }

      for (const [golferKey, existing] of existingByGolfer) {
        if (!submittedGolferIds.has(golferKey)) {
          await tx.golfmatchscores.deleteMany({
            where: { matchid: matchId, scoreid: existing.scoreid },
          });
          await tx.golfscore.delete({
            where: { id: existing.scoreid },
          });
        }
      }

      return { createdScoreIds };
    });
  }
}
