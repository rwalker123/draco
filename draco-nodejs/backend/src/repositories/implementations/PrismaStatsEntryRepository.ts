import { Prisma, PrismaClient } from '#prisma/client';
import {
  IStatsEntryRepository,
  BattingStatValues,
  PitchingStatValues,
} from '../interfaces/IStatsEntryRepository.js';
import {
  dbGameAttendance,
  dbGameBattingStat,
  dbGamePitchingStat,
  dbStatsEntryGame,
} from '../types/dbTypes.js';

const statsGameSelect = {
  id: true,
  gamedate: true,
  hteamid: true,
  vteamid: true,
  hscore: true,
  vscore: true,
  gamestatus: true,
  hometeam: {
    select: {
      id: true,
      name: true,
    },
  },
  visitingteam: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.leaguescheduleSelect;

const battingInclude = {
  rosterseason: {
    include: {
      roster: {
        include: {
          contacts: true,
        },
      },
    },
  },
} satisfies Prisma.batstatsumInclude;

const pitchingInclude = {
  rosterseason: {
    include: {
      roster: {
        include: {
          contacts: true,
        },
      },
    },
  },
} satisfies Prisma.pitchstatsumInclude;

export class PrismaStatsEntryRepository implements IStatsEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCompletedGames(
    teamSeasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<dbStatsEntryGame[]> {
    return this.prisma.leagueschedule.findMany({
      where: {
        leagueid: leagueSeasonId,
        gamestatus: {
          in: [1, 4, 5],
        },
        OR: [
          {
            hteamid: teamSeasonId,
          },
          {
            vteamid: teamSeasonId,
          },
        ],
      },
      select: statsGameSelect,
      orderBy: {
        gamedate: 'desc',
      },
    });
  }

  async findTeamGame(
    gameId: bigint,
    teamSeasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<dbStatsEntryGame | null> {
    return this.prisma.leagueschedule.findFirst({
      where: {
        id: gameId,
        leagueid: leagueSeasonId,
        gamestatus: {
          in: [1, 4, 5],
        },
        OR: [
          {
            hteamid: teamSeasonId,
          },
          {
            vteamid: teamSeasonId,
          },
        ],
      },
      select: statsGameSelect,
    });
  }

  async listGameBattingStats(gameId: bigint, teamSeasonId: bigint): Promise<dbGameBattingStat[]> {
    return this.prisma.batstatsum.findMany({
      where: {
        gameid: gameId,
        teamid: teamSeasonId,
      },
      include: battingInclude,
      orderBy: [
        {
          rosterseason: {
            playernumber: 'asc',
          },
        },
        {
          id: 'asc',
        },
      ],
    });
  }

  async findBattingStatById(statId: bigint): Promise<dbGameBattingStat | null> {
    return this.prisma.batstatsum.findUnique({
      where: { id: statId },
      include: battingInclude,
    });
  }

  async createGameBattingStat(
    gameId: bigint,
    teamSeasonId: bigint,
    rosterSeasonId: bigint,
    values: BattingStatValues,
  ): Promise<dbGameBattingStat> {
    await this.prisma.$executeRaw(
      Prisma.sql`INSERT INTO batstatsum (
        playerid, gameid, teamid, ab, h, r, d, t, hr, rbi, so, bb, hbp, sb, cs, sf, sh, re, intr, lob
      ) VALUES (
        ${rosterSeasonId}, ${gameId}, ${teamSeasonId}, ${values.ab}, ${values.h}, ${values.r},
        ${values.d}, ${values.t}, ${values.hr}, ${values.rbi}, ${values.so}, ${values.bb},
        ${values.hbp}, ${values.sb}, ${values.cs}, ${values.sf}, ${values.sh}, ${values.re},
        ${values.intr}, ${values.lob}
      )`,
    );

    const stat = await this.prisma.batstatsum.findUnique({
      where: {
        playerid_gameid_teamid: {
          playerid: rosterSeasonId,
          gameid: gameId,
          teamid: teamSeasonId,
        },
      },
      include: battingInclude,
    });

    if (!stat) {
      throw new Error('Failed to create batting stat.');
    }

    return stat;
  }

  async updateGameBattingStat(
    statId: bigint,
    values: BattingStatValues,
  ): Promise<dbGameBattingStat> {
    return this.prisma.batstatsum.update({
      where: { id: statId },
      data: values,
      include: battingInclude,
    });
  }

  async deleteGameBattingStat(statId: bigint): Promise<void> {
    await this.prisma.batstatsum.delete({
      where: { id: statId },
    });
  }

  async listGamePitchingStats(gameId: bigint, teamSeasonId: bigint): Promise<dbGamePitchingStat[]> {
    return this.prisma.pitchstatsum.findMany({
      where: {
        gameid: gameId,
        teamid: teamSeasonId,
      },
      include: pitchingInclude,
      orderBy: [
        {
          rosterseason: {
            playernumber: 'asc',
          },
        },
        {
          id: 'asc',
        },
      ],
    });
  }

  async findPitchingStatById(statId: bigint): Promise<dbGamePitchingStat | null> {
    return this.prisma.pitchstatsum.findUnique({
      where: { id: statId },
      include: pitchingInclude,
    });
  }

  async createGamePitchingStat(
    gameId: bigint,
    teamSeasonId: bigint,
    rosterSeasonId: bigint,
    values: PitchingStatValues,
  ): Promise<dbGamePitchingStat> {
    await this.prisma.$executeRaw(
      Prisma.sql`INSERT INTO pitchstatsum (
        playerid, gameid, teamid, ip, ip2, bf, w, l, s, h, r, er, d, t, hr, so, bb, wp, hbp, bk, sc
      ) VALUES (
        ${rosterSeasonId}, ${gameId}, ${teamSeasonId}, ${values.ip}, ${values.ip2}, ${values.bf},
        ${values.w}, ${values.l}, ${values.s}, ${values.h}, ${values.r}, ${values.er},
        ${values.d}, ${values.t}, ${values.hr}, ${values.so}, ${values.bb}, ${values.wp},
        ${values.hbp}, ${values.bk}, ${values.sc}
      )`,
    );

    const stat = await this.prisma.pitchstatsum.findUnique({
      where: {
        playerid_gameid_teamid: {
          playerid: rosterSeasonId,
          gameid: gameId,
          teamid: teamSeasonId,
        },
      },
      include: pitchingInclude,
    });

    if (!stat) {
      throw new Error('Failed to create pitching stat.');
    }

    return stat;
  }

  async updateGamePitchingStat(
    statId: bigint,
    values: PitchingStatValues,
  ): Promise<dbGamePitchingStat> {
    return this.prisma.pitchstatsum.update({
      where: { id: statId },
      data: values,
      include: pitchingInclude,
    });
  }

  async deleteGamePitchingStat(statId: bigint): Promise<void> {
    await this.prisma.pitchstatsum.delete({
      where: { id: statId },
    });
  }

  async listAttendance(gameId: bigint, teamSeasonId: bigint): Promise<dbGameAttendance[]> {
    return this.prisma.playerrecap.findMany({
      where: {
        gameid: gameId,
        teamid: teamSeasonId,
      },
      select: {
        playerid: true,
      },
      orderBy: {
        playerid: 'asc',
      },
    });
  }

  async replaceAttendance(
    gameId: bigint,
    teamSeasonId: bigint,
    playerIds: bigint[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.playerrecap.deleteMany({
        where: {
          gameid: gameId,
          teamid: teamSeasonId,
        },
      }),
      ...(playerIds.length
        ? [
            this.prisma.playerrecap.createMany({
              data: playerIds.map((playerId) => ({
                gameid: gameId,
                teamid: teamSeasonId,
                playerid: playerId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  async addAttendance(gameId: bigint, teamSeasonId: bigint, playerId: bigint): Promise<void> {
    await this.prisma.playerrecap.createMany({
      data: [
        {
          playerid: playerId,
          gameid: gameId,
          teamid: teamSeasonId,
        },
      ],
      skipDuplicates: true,
    });
  }

  async removeAttendance(gameId: bigint, teamSeasonId: bigint, playerId: bigint): Promise<void> {
    await this.prisma.playerrecap.deleteMany({
      where: {
        playerid: playerId,
        gameid: gameId,
        teamid: teamSeasonId,
      },
    });
  }
}
