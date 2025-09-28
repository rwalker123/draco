import { PrismaClient, teamsseason, teams, teamseasonmanager } from '@prisma/client';
import { ITeamRepository } from '../interfaces/ITeamRepository.js';
import {
  dbTeamSeasonLeague,
  dbTeamSeasonManagerContact,
  dbTeamSeasonWithLeague,
  dbTeamSeasonWithLeaguesAndTeams,
  dbTeamsWithLeaguesAndDivisions,
  dbUserManagerTeams,
  dbUserTeams,
} from '../types/dbTypes.js';
import { ConflictError, NotFoundError } from '@/utils/customErrors.js';
import { TeamSeasonRecordType } from '@draco/shared-schemas';
import { BatchQueryHelper } from './batchQueries.js';

export class PrismaTeamRepository implements ITeamRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<teamsseason | null> {
    return this.prisma.teamsseason.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({ where });
  }

  async create(data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.create({
      data: data as Parameters<typeof this.prisma.teamsseason.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<teamsseason> {
    return this.prisma.teamsseason.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamsseason.count({ where });
  }

  async findBySeasonId(seasonId: bigint, accountId: bigint): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      include: {
        teams: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });
  }

  async findTeamSeasonWithLeague(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonWithLeague | null> {
    const result = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });

    return result;
  }

  async findTeamDefinition(teamId: bigint): Promise<teams | null> {
    return this.prisma.teams.findUnique({
      where: { id: teamId },
    });
  }

  async findTeamManager(
    contactId: bigint,
    teamId: bigint,
    seasonId: bigint,
  ): Promise<teamseasonmanager | null> {
    return this.prisma.teamseasonmanager.findFirst({
      where: {
        contactid: contactId,
        teamseasonid: teamId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
          },
        },
      },
    });
  }

  async findTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<teamsseason | null> {
    return this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: { seasonid: seasonId, league: { accountid: accountId } },
      },
    });
  }

  async getLeagueInfo(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonLeague | null> {
    return await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        leagueseason: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findTeamSeasonManagers(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonManagerContact[]> {
    // Query team managers for the current season using Prisma relations
    return await this.prisma.teamseasonmanager.findMany({
      where: {
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
          },
        },
        contacts: {
          creatoraccountid: accountId,
        },
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        teamsseason: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { contacts: { lastname: 'asc' } },
        { contacts: { firstname: 'asc' } },
        { teamsseason: { name: 'asc' } },
      ],
    });
  }

  async findContactTeams(
    accountId: bigint,
    contactId: bigint,
    seasonId: bigint,
  ): Promise<dbUserTeams[]> {
    // Get teams where the user is a roster member
    return await this.prisma.rosterseason.findMany({
      where: {
        roster: {
          contactid: contactId,
        },
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: { accountid: accountId },
          },
        },
        inactive: false,
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                id: true,
                accountid: true,
              },
            },
          },
        },
      },
    });
  }

  async findContactManager(
    accountId: bigint,
    contactid: bigint,
    seasonId: bigint,
  ): Promise<dbUserManagerTeams[]> {
    return await this.prisma.teamseasonmanager.findMany({
      where: {
        contactid: contactid,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: { accountid: accountId },
          },
        },
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                id: true,
                accountid: true,
              },
            },
          },
        },
      },
    });
  }

  async fetchTeamsWithLeagueInfo(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<dbTeamsWithLeaguesAndDivisions[]> {
    return await this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
        divisionseasonid: {
          not: null,
        },
      },
      include: {
        teams: {
          select: {
            id: true,
            webaddress: true,
            youtubeuserid: true,
            defaultvideo: true,
            autoplayvideo: true,
          },
        },
        leagueseason: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        divisionseason: {
          include: {
            divisiondefs: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ leagueseason: { league: { name: 'asc' } } }, { name: 'asc' }],
    });
  }

  async findTeamSeasonWithLeaguesAndTeams(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonWithLeaguesAndTeams | null> {
    return await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        teams: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async updateTeamSeasonName(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: string,
  ): Promise<teamsseason> {
    // Verify the team season exists and belongs to this account and season
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Check if team name already exists in this league season
    const existingTeam = await this.prisma.teamsseason.findFirst({
      where: {
        leagueseasonid: teamSeason.leagueseasonid,
        name: updateData.trim(),
        id: { not: teamSeasonId },
      },
    });

    if (existingTeam) {
      throw new ConflictError('A team with this name already exists in this league');
    }

    // Update team season name
    return await this.prisma.teamsseason.update({
      where: {
        id: teamSeasonId,
      },
      data: {
        name: updateData.trim(),
      },
    });
  }

  /**
   * Fetch and calculate team record from database
   * @param teamSeasonId - Team season ID to calculate record for
   * @returns Promise<TeamRecord> object with wins, losses, and ties
   */
  async getTeamRecord(teamSeasonId: bigint): Promise<TeamSeasonRecordType> {
    // Use batch helper for better performance when called multiple times
    const records = await BatchQueryHelper.batchTeamRecords(this.prisma, [teamSeasonId]);
    return records.get(teamSeasonId.toString()) || { wins: 0, losses: 0, ties: 0 };
  }

  /**
   * Fetch and calculate multiple team records from database (batch operation)
   * @param prisma - Prisma client instance
   * @param teamSeasonIds - Array of team season IDs to calculate records for
   * @returns Promise<Map<string, TeamRecord>> mapping team ID to record
   */
  async getTeamRecords(teamSeasonIds: bigint[]): Promise<Map<string, TeamSeasonRecordType>> {
    return BatchQueryHelper.batchTeamRecords(this.prisma, teamSeasonIds);
  }
}
