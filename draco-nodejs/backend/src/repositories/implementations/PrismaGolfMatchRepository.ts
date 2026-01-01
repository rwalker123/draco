import { PrismaClient, golfmatch } from '#prisma/client';
import {
  IGolfMatchRepository,
  GolfMatchWithTeams,
  GolfMatchWithScores,
  CreateGolfMatchData,
  UpdateGolfMatchData,
} from '../interfaces/IGolfMatchRepository.js';

const matchTeamInclude = {
  teamsseason_golfmatch_team1Toteamsseason: {
    include: {
      teams: true,
    },
  },
  teamsseason_golfmatch_team2Toteamsseason: {
    include: {
      teams: true,
    },
  },
  golfcourse: true,
  golfteeinformation: true,
};

const matchWithScoresInclude = {
  ...matchTeamInclude,
  golfmatchscores: {
    include: {
      golfscore: {
        include: {
          golfer: {
            include: {
              contact: true,
            },
          },
        },
      },
      golfer: {
        include: {
          contact: true,
        },
      },
      teamsseason: true,
    },
  },
};

export class PrismaGolfMatchRepository implements IGolfMatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfMatchWithTeams[]> {
    return this.prisma.golfmatch.findMany({
      where: { leagueseason: { seasonid: seasonId } },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
    });
  }

  async findBySeasonIdWithDateRange(
    seasonId: bigint,
    startDate?: Date,
    endDate?: Date,
  ): Promise<GolfMatchWithTeams[]> {
    return this.prisma.golfmatch.findMany({
      where: {
        leagueseason: { seasonid: seasonId },
        ...(startDate || endDate
          ? {
              matchdate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
    });
  }

  async findByFlightId(flightId: bigint): Promise<GolfMatchWithTeams[]> {
    return this.prisma.golfmatch.findMany({
      where: {
        OR: [
          { teamsseason_golfmatch_team1Toteamsseason: { divisionseasonid: flightId } },
          { teamsseason_golfmatch_team2Toteamsseason: { divisionseasonid: flightId } },
        ],
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
    });
  }

  async findById(matchId: bigint): Promise<GolfMatchWithTeams | null> {
    return this.prisma.golfmatch.findUnique({
      where: { id: matchId },
      include: matchTeamInclude,
    });
  }

  async findByIdWithScores(matchId: bigint): Promise<GolfMatchWithScores | null> {
    return this.prisma.golfmatch.findUnique({
      where: { id: matchId },
      include: matchWithScoresInclude,
    });
  }

  async findUpcoming(seasonId: bigint, limit = 10): Promise<GolfMatchWithTeams[]> {
    const now = new Date();
    return this.prisma.golfmatch.findMany({
      where: {
        leagueseason: { seasonid: seasonId },
        matchdate: { gte: now },
        matchstatus: { in: [0, 1] },
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
      take: limit,
    });
  }

  async findCompleted(seasonId: bigint, limit = 10): Promise<GolfMatchWithTeams[]> {
    return this.prisma.golfmatch.findMany({
      where: {
        leagueseason: { seasonid: seasonId },
        matchstatus: 2,
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'desc' },
      take: limit,
    });
  }

  async findByTeam(teamSeasonId: bigint): Promise<GolfMatchWithTeams[]> {
    return this.prisma.golfmatch.findMany({
      where: {
        OR: [{ team1: teamSeasonId }, { team2: teamSeasonId }],
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
    });
  }

  async findByDate(seasonId: bigint, date: Date): Promise<GolfMatchWithTeams[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prisma.golfmatch.findMany({
      where: {
        leagueseason: { seasonid: seasonId },
        matchdate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: matchTeamInclude,
      orderBy: { matchdate: 'asc' },
    });
  }

  async create(data: CreateGolfMatchData): Promise<golfmatch> {
    return this.prisma.golfmatch.create({
      data: {
        team1: data.team1,
        team2: data.team2,
        leagueid: data.leagueid,
        matchdate: data.matchdate,
        courseid: data.courseid ?? null,
        teeid: data.teeid ?? null,
        matchstatus: data.matchstatus,
        matchtype: data.matchtype,
        comment: data.comment,
      },
    });
  }

  async update(matchId: bigint, data: UpdateGolfMatchData): Promise<golfmatch> {
    return this.prisma.golfmatch.update({
      where: { id: matchId },
      data,
    });
  }

  async delete(matchId: bigint): Promise<golfmatch> {
    return this.prisma.golfmatch.delete({
      where: { id: matchId },
    });
  }

  async updateStatus(matchId: bigint, status: number): Promise<golfmatch> {
    return this.prisma.golfmatch.update({
      where: { id: matchId },
      data: { matchstatus: status },
    });
  }

  async hasScores(matchId: bigint): Promise<boolean> {
    const count = await this.prisma.golfmatchscores.count({
      where: { matchid: matchId },
    });
    return count > 0;
  }

  async seasonHasLeagueSeasons(seasonId: bigint): Promise<boolean> {
    const count = await this.prisma.leagueseason.count({
      where: { seasonid: seasonId },
    });
    return count > 0;
  }
}
