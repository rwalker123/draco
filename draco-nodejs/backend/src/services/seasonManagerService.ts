import { PrismaClient, Prisma } from '@prisma/client';
import validator from 'validator';

export interface SeasonManagerFilters {
  leagueSeasonId?: string;
  teamSeasonId?: string;
  search?: string;
}

export interface SeasonManager {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  hasValidEmail: boolean;
  allTeams: Array<{
    leagueSeasonId: string;
    teamSeasonId: string;
    teamName: string;
    leagueName: string;
  }>;
}

export class SeasonManagerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all managers for a season, aggregated from team managers
   */
  async getSeasonManagers(
    accountId: bigint,
    seasonId: bigint,
    filters?: SeasonManagerFilters,
  ): Promise<SeasonManager[]> {
    // Build where clause for team managers
    const whereClause: Prisma.teamseasonmanagerWhereInput = {
      teamsseason: {
        leagueseason: {
          season: {
            id: seasonId,
            accountid: accountId,
          },
        },
      },
    };

    // Add league season filter
    if (filters?.leagueSeasonId) {
      if (!whereClause.teamsseason) {
        whereClause.teamsseason = {};
      }
      whereClause.teamsseason.leagueseasonid = BigInt(filters.leagueSeasonId);
    }

    // Add team season filter
    if (filters?.teamSeasonId) {
      whereClause.teamseasonid = BigInt(filters.teamSeasonId);
    }

    // Add search filter
    if (filters?.search) {
      whereClause.contacts = {
        OR: [
          { firstname: { contains: filters.search, mode: 'insensitive' } },
          { lastname: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    // Query team managers with related data
    const teamManagers = await this.prisma.teamseasonmanager.findMany({
      where: whereClause,
      select: {
        id: true,
        contactid: true,
        contacts: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
          },
        },
        teamsseason: {
          select: {
            id: true,
            name: true,
            leagueseasonid: true,
            leagueseason: {
              select: {
                id: true,
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ contacts: { lastname: 'asc' } }, { contacts: { firstname: 'asc' } }],
    });

    // Group by contact ID to handle deduplication
    const managerMap = new Map<string, SeasonManager>();

    for (const teamManager of teamManagers) {
      const contactId = teamManager.contactid.toString();
      const contact = teamManager.contacts;
      const teamSeason = teamManager.teamsseason;
      const leagueSeason = teamSeason.leagueseason;
      const league = leagueSeason.league;

      const teamInfo = {
        leagueSeasonId: leagueSeason.id.toString(),
        teamSeasonId: teamSeason.id.toString(),
        teamName: teamSeason.name,
        leagueName: league.name,
      };

      if (managerMap.has(contactId)) {
        // Add team to existing manager
        const existingManager = managerMap.get(contactId)!;
        existingManager.allTeams.push(teamInfo);
      } else {
        // Create new manager entry
        const manager: SeasonManager = {
          id: `${contactId}-${teamSeason.id}`,
          contactId: contactId,
          firstName: contact.firstname,
          lastName: contact.lastname,
          email: contact.email,
          phone1: contact.phone1,
          phone2: contact.phone2,
          phone3: contact.phone3,
          hasValidEmail: this.isValidEmail(contact.email),
          allTeams: [teamInfo],
        };
        managerMap.set(contactId, manager);
      }
    }

    return Array.from(managerMap.values());
  }

  /**
   * Check if email is valid using validator.js for robust validation
   */
  private isValidEmail(email: string | null): boolean {
    if (!email) return false;
    return validator.isEmail(email);
  }
}
