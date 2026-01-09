import { PrismaClient, golfmatch } from '#prisma/client';
import {
  IGolfMatchRepository,
  GolfMatchWithTeams,
  GolfMatchWithScores,
  CreateGolfMatchData,
  UpdateGolfMatchData,
} from '../interfaces/IGolfMatchRepository.js';
import { GolfMatchStatus } from '../../utils/golfConstants.js';

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
        leagueid: flightId,
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
        matchstatus: GolfMatchStatus.SCHEDULED,
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
        matchstatus: GolfMatchStatus.COMPLETED,
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

  async updateTee(matchId: bigint, teeId: bigint): Promise<void> {
    await this.prisma.golfmatch.update({
      where: { id: matchId },
      data: { teeid: teeId },
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

  async updatePoints(
    matchId: bigint,
    data: {
      team1points: number;
      team2points: number;
      team1totalscore: number;
      team2totalscore: number;
      team1netscore: number;
      team2netscore: number;
      team1holewins: number;
      team2holewins: number;
      team1ninewins: number;
      team2ninewins: number;
      team1matchwins: number;
      team2matchwins: number;
    },
  ): Promise<golfmatch> {
    return this.prisma.golfmatch.update({
      where: { id: matchId },
      data: {
        team1points: data.team1points,
        team2points: data.team2points,
        team1totalscore: data.team1totalscore,
        team2totalscore: data.team2totalscore,
        team1netscore: data.team1netscore,
        team2netscore: data.team2netscore,
        team1holewins: data.team1holewins,
        team2holewins: data.team2holewins,
        team1ninewins: data.team1ninewins,
        team2ninewins: data.team2ninewins,
        team1matchwins: data.team1matchwins,
        team2matchwins: data.team2matchwins,
      },
    });
  }
}
