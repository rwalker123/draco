import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  ContactResponseFormatter,
  RosterResponseFormatter,
} from '../responseFormatters/responseFormatters.js';
import {
  CreateRosterMemberType,
  RosterMemberType,
  TeamRosterMembersType,
  BaseContactType,
  SignRosterMemberType,
  CreateContactType,
} from '@draco/shared-schemas';
import { dbTeamSeason, dbRosterSeason, dbRosterMember } from '../repositories/index.js';

export class RosterService {
  constructor(private prisma: PrismaClient) {}

  async getTeamRosterMembers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamRosterMembersType> {
    // Verify the team season exists and belongs to this account and season
    const teamSeason: dbTeamSeason | null = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
      select: { id: true, name: true },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Get all roster members for this team season
    const rosterMembers: dbRosterSeason[] = await this.prisma.rosterseason.findMany({
      where: {
        teamseasonid: teamSeasonId,
      },
      include: {
        roster: {
          include: {
            contacts: true,
          },
        },
      },
      orderBy: [{ inactive: 'asc' }, { playernumber: 'asc' }],
    });

    const response = RosterResponseFormatter.formatRosterMembersResponse(teamSeason, rosterMembers);
    return response;
  }

  /**
   * Get all available players (not on any team in this season) for adding to roster
   * @param teamSeasonId
   * @param seasonId
   * @param accountId
   * @returns BaseContactType[]
   */
  async getAvailablePlayers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    page: number = 1,
    limit: number = 50,
    firstName?: string,
    lastName?: string,
  ): Promise<BaseContactType[]> {
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
      select: {
        leagueseasonid: true,
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const leagueSeasonId = teamSeason.leagueseasonid;

    // Step 1: Get ContactIds of players already on teams in this league season (active only)
    const assignedRosterMembers = await this.prisma.rosterseason.findMany({
      where: {
        teamsseason: {
          leagueseasonid: leagueSeasonId,
        },
        inactive: false, // Only exclude active players
      },
      select: {
        roster: {
          select: {
            contactid: true,
          },
        },
      },
    });

    const assignedContactIds = assignedRosterMembers.map((rm) => rm.roster.contactid);

    // Step 2: Build where clause for available contacts
    const whereClause = {
      creatoraccountid: accountId,
      id: {
        notIn: assignedContactIds,
      },
      // Add name filtering if provided
      ...(firstName && {
        firstname: {
          contains: firstName,
          mode: 'insensitive' as const,
        },
      }),
      ...(lastName && {
        lastname: {
          contains: lastName,
          mode: 'insensitive' as const,
        },
      }),
    };

    // Get paginated results
    const skip = (page - 1) * limit;
    const availableContacts = await this.prisma.contacts.findMany({
      where: whereClause,
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { middlename: 'asc' }],
      skip,
      take: limit + 1, // Take one extra to check if there's a next page
      select: {
        id: true,
        userid: true,
        firstname: true,
        lastname: true,
        middlename: true,
        email: true,
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        creatoraccountid: true,
      },
    });

    // Check if there's a next page
    const hasNext = availableContacts.length > limit;
    const contacts = hasNext ? availableContacts.slice(0, limit) : availableContacts;

    const response = ContactResponseFormatter.formatManyContactsResponse(contacts);
    return response;
  }

  async addPlayerToRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    addPlayerData: SignRosterMemberType,
  ): Promise<RosterMemberType> {
    // Extract variables from addPlayerData with proper type handling
    const { playerNumber, submittedWaiver } = addPlayerData;
    const { submittedDriversLicense, firstYear, contact } = addPlayerData.player;
    if (!contact) {
      throw new ValidationError('Contact is required');
    }

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

    let existingContact: { firstname: string; lastname: string } | null = null;
    let actualContactId: bigint;

    // Type guard to check if contact has an id (existing contact)
    const hasId = 'id' in contact && contact.id !== undefined;

    // If contactId is provided, check if the contact exists
    if (hasId) {
      const contactId = contact.id;
      existingContact = await this.prisma.contacts.findFirst({
        where: {
          id: BigInt(contactId),
          creatoraccountid: accountId,
        },
        select: {
          firstname: true,
          lastname: true,
        },
      });

      if (!existingContact) {
        throw new NotFoundError('Contact not found');
      }

      actualContactId = BigInt(contactId);
    } else {
      // Contact data is provided for creating a new contact
      const contactData = contact as CreateContactType;

      // Validate required fields for contact creation
      if (!contactData.firstName || !contactData.lastName) {
        throw new ValidationError('First name and last name are required for contact creation');
      }

      // Create the contact
      const newContact = await this.prisma.contacts.create({
        data: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          middlename: contactData.middleName || '',
          email: contactData.email || null,
          phone1: contactData.contactDetails?.phone1 || null,
          phone2: contactData.contactDetails?.phone2 || null,
          phone3: contactData.contactDetails?.phone3 || null,
          streetaddress: contactData.contactDetails?.streetAddress || null,
          city: contactData.contactDetails?.city || null,
          state: contactData.contactDetails?.state || null,
          zip: contactData.contactDetails?.zip || null,
          creatoraccountid: accountId,
          dateofbirth: contactData.contactDetails?.dateOfBirth
            ? DateUtils.parseDateOfBirthForDatabase(contactData.contactDetails.dateOfBirth)
            : new Date('1900-01-01'),
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
        },
      });

      existingContact = {
        firstname: newContact.firstname,
        lastname: newContact.lastname,
      };

      actualContactId = newContact.id;
    }

    // Check if contact already has a roster entry
    let player = await this.prisma.roster.findFirst({
      where: {
        contactid: actualContactId,
      },
      include: {
        contacts: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    // If no roster entry exists, create one
    if (!player) {
      player = await this.prisma.roster.create({
        data: {
          contactid: actualContactId,
          submitteddriverslicense: submittedDriversLicense || false,
          firstyear: firstYear || 0,
        },
        include: {
          contacts: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
      });
    }

    // Get the leagueseasonid for this team
    const leagueSeasonId = teamSeason.leagueseasonid;

    // Check if player is already on a team in this league season
    const existingRosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        playerid: player.id,
        teamsseason: {
          leagueseasonid: leagueSeasonId,
        },
      },
    });

    if (existingRosterMember) {
      throw new ConflictError('Player is already on a team in this season');
    }

    // Update player's roster information if provided
    if (submittedDriversLicense !== undefined || firstYear !== undefined) {
      await this.prisma.roster.update({
        where: { id: player.id },
        data: {
          submitteddriverslicense:
            submittedDriversLicense !== undefined
              ? submittedDriversLicense
              : player.submitteddriverslicense,
          firstyear: firstYear !== undefined ? firstYear : player.firstyear,
        },
      });
    }

    // Add player to roster
    const newRosterMember: dbRosterMember = await this.prisma.rosterseason.create({
      data: {
        playerid: player.id,
        teamseasonid: teamSeasonId,
        playernumber: playerNumber || 0,
        inactive: false,
        submittedwaiver: submittedWaiver || false,
        dateadded: new Date(),
      },
      include: {
        roster: {
          include: {
            contacts: true,
          },
        },
      },
    });

    const rosterMember: RosterMemberType =
      RosterResponseFormatter.formatRosterMemberResponse(newRosterMember);
    return rosterMember;
  }

  async updateRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: CreateRosterMemberType,
  ): Promise<RosterMemberType> {
    const { playerNumber, submittedWaiver } = updateData;
    const { submittedDriversLicense, firstYear } = updateData.player;

    // Verify the roster member exists and belongs to this team season
    const dbRosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: true,
          },
        },
      },
    });

    if (!dbRosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    // Update roster data (player-specific data)
    await this.prisma.roster.update({
      where: { id: dbRosterMember.playerid },
      data: {
        submitteddriverslicense:
          submittedDriversLicense !== undefined
            ? submittedDriversLicense
            : dbRosterMember.roster.submitteddriverslicense,
        firstyear: firstYear !== undefined ? firstYear : dbRosterMember.roster.firstyear,
      },
    });

    // Update roster season data
    const updatedRosterMember: dbRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: {
        playernumber: playerNumber !== undefined ? playerNumber : dbRosterMember.playernumber,
        submittedwaiver:
          submittedWaiver !== undefined ? submittedWaiver : dbRosterMember.submittedwaiver,
      },
      include: {
        roster: {
          include: {
            contacts: true,
          },
        },
      },
    });

    const rosterMember: RosterMemberType =
      RosterResponseFormatter.formatRosterMemberResponse(updatedRosterMember);
    return rosterMember;
  }

  async releaseOrActivatePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    inactive: boolean,
  ): Promise<RosterMemberType> {
    // Verify the roster member exists and belongs to this team season
    const dbRosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: true,
      },
    });

    if (!dbRosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    if (inactive && dbRosterMember.inactive) {
      throw new ConflictError('Player is already released');
    } else if (!inactive && !dbRosterMember.inactive) {
      throw new ConflictError('Player is already active');
    }

    // Release the player
    const updatedRosterMember: dbRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: { inactive: inactive },
      include: {
        roster: {
          include: {
            contacts: true,
          },
        },
      },
    });

    const rosterMember: RosterMemberType =
      RosterResponseFormatter.formatRosterMemberResponse(updatedRosterMember);
    return rosterMember;
  }

  async deleteRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<{ playerName: string }> {
    // Verify the roster member exists and belongs to this team season
    const rosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    const playerName = `${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}`;

    // Permanently delete the roster member
    await this.prisma.rosterseason.delete({
      where: { id: rosterMemberId },
    });

    return { playerName };
  }
}
