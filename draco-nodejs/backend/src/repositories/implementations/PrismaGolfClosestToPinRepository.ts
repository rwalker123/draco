import { PrismaClient, golfclosesttopin } from '#prisma/client';
import {
  IGolfClosestToPinRepository,
  GolfClosestToPinWithDetails,
  CreateGolfClosestToPinData,
  UpdateGolfClosestToPinData,
} from '../interfaces/IGolfClosestToPinRepository.js';

const ctpWithDetailsInclude = {
  contacts: {
    select: {
      id: true,
      firstname: true,
      lastname: true,
    },
  },
  golfmatch: {
    select: {
      id: true,
      matchdate: true,
      weeknumber: true,
    },
  },
};

export class PrismaGolfClosestToPinRepository implements IGolfClosestToPinRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<GolfClosestToPinWithDetails | null> {
    return this.prisma.golfclosesttopin.findUnique({
      where: { id },
      include: ctpWithDetailsInclude,
    });
  }

  async findByMatchId(matchId: bigint): Promise<GolfClosestToPinWithDetails[]> {
    return this.prisma.golfclosesttopin.findMany({
      where: { matchid: matchId },
      include: ctpWithDetailsInclude,
      orderBy: { holeno: 'asc' },
    });
  }

  async findByFlightId(flightId: bigint): Promise<GolfClosestToPinWithDetails[]> {
    return this.prisma.golfclosesttopin.findMany({
      where: {
        golfmatch: {
          OR: [
            { teamsseason_golfmatch_team1Toteamsseason: { divisionseasonid: flightId } },
            { teamsseason_golfmatch_team2Toteamsseason: { divisionseasonid: flightId } },
          ],
        },
      },
      include: ctpWithDetailsInclude,
      orderBy: [{ golfmatch: { matchdate: 'desc' } }, { holeno: 'asc' }],
    });
  }

  async create(data: CreateGolfClosestToPinData): Promise<golfclosesttopin> {
    return this.prisma.golfclosesttopin.create({
      data: {
        matchid: data.matchid,
        holeno: data.holeno,
        contactid: data.contactid,
        distance: data.distance,
        unit: data.unit,
        enteredby: data.enteredby,
      },
    });
  }

  async update(id: bigint, data: UpdateGolfClosestToPinData): Promise<golfclosesttopin> {
    return this.prisma.golfclosesttopin.update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint): Promise<golfclosesttopin> {
    return this.prisma.golfclosesttopin.delete({
      where: { id },
    });
  }
}
