import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '../utils/customErrors.js';
import { getLogoUrl } from '../config/logo.js';
import { getTeamRecord } from '../utils/teamRecord.js';

export interface TeamSeasonSummary {
  id: string;
  name: string;
  teamId: string;
  league: {
    id: string;
    name: string;
  };
  division: {
    id: string;
    name: string;
  } | null;
  webAddress: string | null;
  youtubeUserId: string | null;
  defaultVideo: string | null;
  autoPlayVideo: boolean;
}

export interface TeamSeasonDetails extends TeamSeasonSummary {
  logoUrl: string;
  leagueName: string;
  season: {
    id: string;
    name: string;
  } | null;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
}

export interface UpdateTeamRequest {
  name: string;
}

export class TeamService {
  constructor(private prisma: PrismaClient) {}

  async getTeamsBySeasonId(seasonId: bigint, accountId: bigint): Promise<TeamSeasonSummary[]> {
    const teams = await this.prisma.teamsseason.findMany({
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

    return teams.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      teamId: team.teamid.toString(),
      league: {
        id: team.leagueseason.league.id.toString(),
        name: team.leagueseason.league.name,
      },
      division: team.divisionseason?.divisiondefs
        ? {
            id: team.divisionseason.divisiondefs.id.toString(),
            name: team.divisionseason.divisiondefs.name,
          }
        : null,
      webAddress: team.teams.webaddress,
      youtubeUserId: team.teams.youtubeuserid,
      defaultVideo: team.teams.defaultvideo,
      autoPlayVideo: team.teams.autoplayvideo,
    }));
  }

  async getTeamSeasonDetails(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamSeasonDetails> {
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

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Calculate team record
    const record = await getTeamRecord(this.prisma, teamSeasonId);

    return {
      id: teamSeason.id.toString(),
      name: teamSeason.name,
      teamId: teamSeason.teamid.toString(),
      league: {
        id: teamSeason.leagueseason.league.id.toString(),
        name: teamSeason.leagueseason.league.name,
      },
      division: null, // Not included in details query currently
      webAddress: teamSeason.teams?.webaddress || null,
      youtubeUserId: teamSeason.teams?.youtubeuserid || null,
      defaultVideo: teamSeason.teams?.defaultvideo || null,
      autoPlayVideo: teamSeason.teams?.autoplayvideo || false,
      logoUrl: getLogoUrl(accountId.toString(), teamSeason.teamid.toString()),
      leagueName: teamSeason.leagueseason?.league?.name || 'Unknown League',
      season: {
        id: teamSeason.leagueseason?.season?.id?.toString() || 'unknown',
        name: teamSeason.leagueseason?.season?.name || 'Unknown Season',
      },
      record,
    };
  }

  async updateTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: UpdateTeamRequest,
  ): Promise<TeamSeasonSummary> {
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
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Check if team name already exists in this league season
    const existingTeam = await this.prisma.teamsseason.findFirst({
      where: {
        leagueseasonid: teamSeason.leagueseasonid,
        name: updateData.name.trim(),
        id: { not: teamSeasonId },
      },
    });

    if (existingTeam) {
      throw new ConflictError('A team with this name already exists in this league');
    }

    // Update team season name
    const updatedTeamSeason = await this.prisma.teamsseason.update({
      where: {
        id: teamSeasonId,
      },
      data: {
        name: updateData.name.trim(),
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
      },
    });

    return {
      id: updatedTeamSeason.id.toString(),
      name: updatedTeamSeason.name,
      teamId: updatedTeamSeason.teamid.toString(),
      league: {
        id: updatedTeamSeason.leagueseason.league.id.toString(),
        name: updatedTeamSeason.leagueseason.league.name,
      },
      division: null, // Not included in update query
      webAddress: updatedTeamSeason.teams.webaddress,
      youtubeUserId: updatedTeamSeason.teams.youtubeuserid,
      defaultVideo: updatedTeamSeason.teams.defaultvideo,
      autoPlayVideo: updatedTeamSeason.teams.autoplayvideo,
    };
  }

  async getLeagueInfo(teamSeasonId: bigint, seasonId: bigint, accountId: bigint) {
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

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    return {
      id: teamSeason.leagueseason.league.id,
      name: teamSeason.leagueseason.league.name,
    };
  }
}
