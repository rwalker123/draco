/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Prisma, teamsseason } from '@prisma/client';
import { NotFoundError } from './customErrors.js';

export interface TeamSeasonValidationResult {
  id: bigint;
  teamid: bigint;
  name: string;
  leagueseasonid: bigint;
  divisionseasonid: bigint | null;
  leagueseason: {
    id: bigint;
    seasonid: bigint;
    leagueid: bigint;
    league: {
      id: bigint;
      name: string;
      accountid: bigint;
    };
    season?: {
      id: bigint;
      name: string;
    };
  };
  teams?: {
    id: bigint;
    webaddress: string | null;
    youtubeuserid: string | null;
    defaultvideo: string | null;
    autoplayvideo: boolean;
  };
  divisionseason?: {
    id: bigint;
    divisionid: bigint;
    divisiondefs: {
      id: bigint;
      name: string;
    };
  };
}

export interface TeamValidationOptions {
  includeTeams?: boolean;
  includeDivisionSeason?: boolean;
  includeLeagueSeason?: boolean;
  customIncludes?: Prisma.teamsseasonInclude;
}

/**
 * Validates that a team season exists and belongs to the specified account and season
 * This is a critical security function that enforces account boundary protection
 */
export async function validateTeamSeasonAccess(
  prisma: PrismaClient,
  teamSeasonId: bigint,
  seasonId: bigint,
  accountId: bigint,
  options: TeamValidationOptions = {},
): Promise<teamsseason & Record<string, any>> {
  const { includeTeams = false, includeDivisionSeason = false, customIncludes } = options;

  // Build the include object based on options
  let include: Prisma.teamsseasonInclude = {
    leagueseason: {
      include: {
        league: true,
      },
    },
  };

  if (includeTeams) {
    include.teams = true;
  }

  if (includeDivisionSeason) {
    include.divisionseason = {
      include: {
        divisiondefs: true,
      },
    };
  }

  // Override with custom includes if provided
  if (customIncludes) {
    include = customIncludes;
  }

  const teamSeason = await prisma.teamsseason.findFirst({
    where: {
      id: teamSeasonId,
      leagueseason: {
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
    },
    include,
  });

  if (!teamSeason) {
    throw new NotFoundError('Team not found or access denied');
  }

  return teamSeason;
}

/**
 * Validates team season access with commonly used includes for team details
 */
export async function validateTeamSeasonWithTeamDetails(
  prisma: PrismaClient,
  teamSeasonId: bigint,
  seasonId: bigint,
  accountId: bigint,
): Promise<teamsseason & Record<string, any>> {
  return validateTeamSeasonAccess(prisma, teamSeasonId, seasonId, accountId, {
    includeTeams: true,
    includeLeagueSeason: true,
  });
}

/**
 * Validates team season access with division information
 */
export async function validateTeamSeasonWithDivision(
  prisma: PrismaClient,
  teamSeasonId: bigint,
  seasonId: bigint,
  accountId: bigint,
): Promise<teamsseason & Record<string, any>> {
  return validateTeamSeasonAccess(prisma, teamSeasonId, seasonId, accountId, {
    includeTeams: true,
    includeDivisionSeason: true,
    includeLeagueSeason: true,
  });
}

/**
 * Basic validation without additional includes - fastest option
 */
export async function validateTeamSeasonBasic(
  prisma: PrismaClient,
  teamSeasonId: bigint,
  seasonId: bigint,
  accountId: bigint,
): Promise<teamsseason & Record<string, any>> {
  return validateTeamSeasonAccess(prisma, teamSeasonId, seasonId, accountId, {
    includeLeagueSeason: true,
  });
}
