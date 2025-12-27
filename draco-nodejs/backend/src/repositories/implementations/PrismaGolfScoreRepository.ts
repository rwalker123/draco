import { PrismaClient, golfscore, golfmatchscores, golfteeinformation } from '#prisma/client';
import {
  IGolfScoreRepository,
  GolfScoreWithDetails,
  GolfMatchScoreWithDetails,
  CreateGolfScoreData,
  UpdateGolfScoreData,
  CreateMatchScoreData,
} from '../interfaces/IGolfScoreRepository.js';

const scoreWithDetailsInclude = {
  contacts: true,
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

  async findByContactId(contactId: bigint, limit = 20): Promise<GolfScoreWithDetails[]> {
    return this.prisma.golfscore.findMany({
      where: { contactid: contactId },
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
        contactid: data.contactid,
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
        playerid: data.playerid,
        scoreid: data.scoreid,
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
        contactid: contactId,
        golfmatchscores: {
          some: {
            golfmatch: {
              leagueid: seasonId,
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
}
