import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors';
import {
  ContactEntry,
  ContactInputData,
  AvailableContactRaw,
} from '../interfaces/contactInterfaces';
import { getContactPhotoUrl } from '../config/logo';
import { DateUtils } from '../utils/dateUtils';

export interface RosterPlayer {
  id: bigint;
  contactId: bigint;
  submittedDriversLicense: boolean | null;
  firstYear: number | null;
  contact: ContactEntry;
}

export interface RosterMember {
  id: bigint;
  playerNumber: number;
  inactive: boolean;
  submittedWaiver: boolean;
  dateAdded: Date | null;
  player: RosterPlayer;
}

export interface AddPlayerRequest {
  contactId?: string; // Optional - if not provided, contactData must be provided
  contactData?: ContactInputData; // Optional - for creating new contacts
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export interface UpdateRosterMemberRequest {
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export class RosterService {
  constructor(private prisma: PrismaClient) {}

  async getRosterMembers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember[]> {
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

    // Get all roster members for this team season
    const rosterMembers = await this.prisma.rosterseason.findMany({
      where: {
        teamseasonid: teamSeasonId,
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
      orderBy: [{ inactive: 'asc' }, { playernumber: 'asc' }],
    });

    return rosterMembers.map((member) => {
      const contact = member.roster.contacts;

      // Transform contact to standard ContactEntry format with photoUrl
      const contactEntry: ContactEntry = {
        id: contact.id.toString(),
        firstName: contact.firstname,
        lastName: contact.lastname,
        email: contact.email,
        userId: null, // Roster contacts don't have userId
        photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
        contactDetails: {
          phone1: contact.phone1,
          phone2: contact.phone2,
          phone3: contact.phone3,
          streetaddress: contact.streetaddress,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
          dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
          middlename: contact.middlename,
        },
        contactroles: [], // Roster doesn't include roles
      };

      return {
        id: member.id,
        playerNumber: member.playernumber,
        inactive: member.inactive,
        submittedWaiver: member.submittedwaiver,
        dateAdded: member.dateadded,
        player: {
          id: member.roster.id,
          contactId: member.roster.contactid,
          submittedDriversLicense: member.roster.submitteddriverslicense,
          firstYear: member.roster.firstyear,
          contact: contactEntry,
        },
      };
    });
  }

  async getAvailablePlayers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    _includeFull: boolean = false,
  ): Promise<ContactEntry[]> {
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

    // Single optimized query using LEFT JOIN to find contacts NOT assigned to this league season
    // This replaces the previous dual-query approach that loaded all contacts and filtered in memory
    const availableContacts = await this.prisma.$queryRaw<AvailableContactRaw[]>`
      SELECT DISTINCT 
        c.id,
        c.firstname,
        c.lastname,
        c.email,
        c.phone1,
        c.phone2,
        c.phone3,
        c.streetaddress,
        c.city,
        c.state,
        c.zip,
        c.dateofbirth,
        c.middlename,
        r.id as roster_id,
        r.firstyear,
        r.submitteddriverslicense
      FROM contacts c
      LEFT JOIN roster r ON c.id = r.contactid
      LEFT JOIN rosterseason rs ON r.id = rs.playerid
      LEFT JOIN teamsseason ts ON rs.teamseasonid = ts.id 
        AND ts.leagueseasonid = ${leagueSeasonId}
      WHERE c.creatoraccountid = ${accountId}
        AND rs.id IS NULL
      ORDER BY c.lastname, c.firstname, c.middlename;
    `;

    // Transform raw query results to ContactEntry format
    return availableContacts.map((contact) => {
      const contactEntry: ContactEntry = {
        id: contact.id.toString(),
        firstName: contact.firstname,
        lastName: contact.lastname,
        email: contact.email,
        userId: null, // Roster contacts don't have userId
        photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
        contactDetails: {
          phone1: contact.phone1,
          phone2: contact.phone2,
          phone3: contact.phone3,
          streetaddress: contact.streetaddress,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
          dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
          middlename: contact.middlename,
        },
        contactroles: [], // Available players don't include roles
      };

      return contactEntry;
    });
  }

  async addPlayerToRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    addPlayerData: AddPlayerRequest,
  ): Promise<RosterMember> {
    const {
      contactId,
      contactData,
      playerNumber,
      submittedWaiver,
      submittedDriversLicense,
      firstYear,
    } = addPlayerData;

    // Validate that either contactId or contactData is provided
    if (!contactId && !contactData) {
      throw new ValidationError('Either contactId or contactData is required');
    }

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
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

    // If contactId is provided, check if the contact exists
    if (contactId) {
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
      // Create new contact if contactData is provided
      if (!contactData) {
        throw new ValidationError('ContactData is required when contactId is not provided');
      }

      // Validate required fields for contact creation
      if (!contactData.firstname || !contactData.lastname) {
        throw new ValidationError('First name and last name are required for contact creation');
      }

      // Create the contact
      const newContact = await this.prisma.contacts.create({
        data: {
          firstname: contactData.firstname,
          lastname: contactData.lastname,
          middlename: contactData.middlename || '',
          email: contactData.email || null,
          phone1: contactData.phone1 || null,
          phone2: contactData.phone2 || null,
          phone3: contactData.phone3 || null,
          streetaddress: contactData.streetaddress || null,
          city: contactData.city || null,
          state: contactData.state || null,
          zip: contactData.zip || null,
          creatoraccountid: accountId,
          dateofbirth: contactData.dateofbirth
            ? DateUtils.parseDateOfBirthForDatabase(contactData.dateofbirth)
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
    const newRosterMember = await this.prisma.rosterseason.create({
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
            contacts: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
    });

    const contactInfo = newRosterMember.roster.contacts;

    // Transform contact to standard ContactEntry format with photoUrl
    const contactEntry: ContactEntry = {
      id: contactInfo.id.toString(),
      firstName: contactInfo.firstname,
      lastName: contactInfo.lastname,
      email: contactInfo.email,
      userId: null, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(accountId.toString(), contactInfo.id.toString()),
      contactDetails: {
        phone1: contactInfo.phone1,
        phone2: contactInfo.phone2,
        phone3: contactInfo.phone3,
        streetaddress: contactInfo.streetaddress,
        city: contactInfo.city,
        state: contactInfo.state,
        zip: contactInfo.zip,
        dateofbirth: DateUtils.formatDateOfBirthForResponse(contactInfo.dateofbirth),
        middlename: contactInfo.middlename,
      },
      contactroles: [], // Roster doesn't include roles
    };

    return {
      id: newRosterMember.id,
      playerNumber: newRosterMember.playernumber,
      inactive: newRosterMember.inactive,
      submittedWaiver: newRosterMember.submittedwaiver,
      dateAdded: newRosterMember.dateadded,
      player: {
        id: newRosterMember.roster.id,
        contactId: newRosterMember.roster.contactid,
        submittedDriversLicense: newRosterMember.roster.submitteddriverslicense,
        firstYear: newRosterMember.roster.firstyear,
        contact: contactEntry,
      },
    };
  }

  async updateRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: UpdateRosterMemberRequest,
  ): Promise<RosterMember> {
    const { playerNumber, submittedWaiver, submittedDriversLicense, firstYear } = updateData;

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
    }

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
                id: true,
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
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    // Update roster season data
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: {
        playernumber: playerNumber !== undefined ? playerNumber : rosterMember.playernumber,
        submittedwaiver:
          submittedWaiver !== undefined ? submittedWaiver : rosterMember.submittedwaiver,
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
    });

    // Update roster data (player-specific data)
    const updatedRoster = await this.prisma.roster.update({
      where: { id: rosterMember.playerid },
      data: {
        submitteddriverslicense:
          submittedDriversLicense !== undefined
            ? submittedDriversLicense
            : rosterMember.roster.submitteddriverslicense,
        firstyear: firstYear !== undefined ? firstYear : rosterMember.roster.firstyear,
      },
    });

    const contact = updatedRosterMember.roster.contacts;

    // Transform contact to standard ContactEntry format with photoUrl
    const contactEntry: ContactEntry = {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: null, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
      contactDetails: {
        phone1: contact.phone1,
        phone2: contact.phone2,
        phone3: contact.phone3,
        streetaddress: contact.streetaddress,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
        middlename: contact.middlename,
      },
      contactroles: [], // Roster doesn't include roles
    };

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRoster.submitteddriverslicense,
        firstYear: updatedRoster.firstyear,
        contact: contactEntry,
      },
    };
  }

  async releasePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember> {
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
                id: true,
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
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    if (rosterMember.inactive) {
      throw new ConflictError('Player is already released');
    }

    // Release the player
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: { inactive: true },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
    });

    const contact = updatedRosterMember.roster.contacts;

    // Transform contact to standard ContactEntry format with photoUrl
    const contactEntry: ContactEntry = {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: null, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
      contactDetails: {
        phone1: contact.phone1,
        phone2: contact.phone2,
        phone3: contact.phone3,
        streetaddress: contact.streetaddress,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
        middlename: contact.middlename,
      },
      contactroles: [], // Roster doesn't include roles
    };

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRosterMember.roster.submitteddriverslicense,
        firstYear: updatedRosterMember.roster.firstyear,
        contact: contactEntry,
      },
    };
  }

  async activatePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember> {
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
                id: true,
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
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    if (!rosterMember.inactive) {
      throw new ConflictError('Player is already active');
    }

    // Activate the player
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: { inactive: false },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
    });

    const contact = updatedRosterMember.roster.contacts;

    // Transform contact to standard ContactEntry format with photoUrl
    const contactEntry: ContactEntry = {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: null, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
      contactDetails: {
        phone1: contact.phone1,
        phone2: contact.phone2,
        phone3: contact.phone3,
        streetaddress: contact.streetaddress,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
        middlename: contact.middlename,
      },
      contactroles: [], // Roster doesn't include roles
    };

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRosterMember.roster.submitteddriverslicense,
        firstYear: updatedRosterMember.roster.firstyear,
        contact: contactEntry,
      },
    };
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
