import {
  BaseContactType,
  NamedContactType,
  RosterMemberType,
  TeamRosterMembersType,
  TeamManagerType,
  RosterPlayerType,
  BaseRoleType,
  RoleWithContactType,
  RoleCheckType,
  ContactType,
  PagedContactType,
  ContactRoleType,
  AccountPollType,
  SponsorType,
} from '@draco/shared-schemas';
import { getContactPhotoUrl } from '../config/logo.js';
import { getSponsorPhotoUrl } from '../config/logo.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  dbBaseContact,
  dbRosterPlayer,
  dbRosterMember,
  dbTeamSeason,
  dbRosterSeason,
  dbTeamManagerWithContact,
  dbGlobalRoles,
  dbContactRoles,
  dbContactWithRoleAndDetails,
  dbPollQuestionWithCounts,
  dbPollQuestionWithUserVotes,
  dbSponsor,
} from '../repositories/index.js';
import { ROLE_NAMES } from '../config/roles.js';
import { PaginationHelper } from '../utils/pagination.js';

// todo: delete this once the shared api client is used more widely
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ContactResponseFormatter {
  static formatNamedContactResponse(contact: dbBaseContact): NamedContactType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
    };
  }

  static formatContactResponse(contact: dbBaseContact): BaseContactType {
    const namedContact = this.formatNamedContactResponse(contact);
    const contactEntry: BaseContactType = {
      ...namedContact,
      email: contact.email || undefined,
      userId: contact.userid || undefined, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(contact.creatoraccountid.toString(), contact.id.toString()),
      contactDetails: {
        phone1: contact.phone1 || '',
        phone2: contact.phone2 || '',
        phone3: contact.phone3 || '',
        streetAddress: contact.streetaddress || '',
        city: contact.city || '',
        state: contact.state || '',
        zip: contact.zip || '',
        dateOfBirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
      },
    };
    return contactEntry;
  }

  static formatManyContactsResponse(contacts: dbBaseContact[]): BaseContactType[] {
    return contacts.map((contact) => this.formatContactResponse(contact));
  }

  static formatRosterPlayerResponse(dbRoster: dbRosterPlayer): RosterPlayerType {
    const contact: dbBaseContact = dbRoster.contacts;
    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);
    const rosterPlayer: RosterPlayerType = {
      id: dbRoster.id.toString(),
      submittedDriversLicense: dbRoster.submitteddriverslicense,
      firstYear: dbRoster.firstyear,
      contact: contactEntry,
    };
    return rosterPlayer;
  }

  /**
   * Transform raw SQL rows into structured contact response
   */
  static formatPagedContactRolesResponse(
    rows: dbContactWithRoleAndDetails[],
    accountId: bigint,
    pagination?: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    includeContactDetails?: boolean,
  ): PagedContactType {
    // Group rows by contact ID
    const contactMap = new Map<string, ContactType>();

    // Process each row
    for (const row of rows) {
      const contactId = row.id.toString();

      // Get or create contact entry
      if (!contactMap.has(contactId)) {
        const contactEntry: ContactType = {
          id: contactId,
          creatoraccountid: accountId.toString(),
          firstName: row.firstname,
          lastName: row.lastname,
          middleName: row.middlename || '',
          email: row.email || undefined,
          userId: row.userid || undefined,
          photoUrl: getContactPhotoUrl(accountId.toString(), contactId),
          contactroles: [],
        };

        // Add contact details if available and requested
        if (includeContactDetails && 'phone1' in row) {
          const contactRow = row as dbContactWithRoleAndDetails;
          contactEntry.contactDetails = {
            phone1: contactRow.phone1 || '',
            phone2: contactRow.phone2 || '',
            phone3: contactRow.phone3 || '',
            streetAddress: contactRow.streetaddress || '',
            city: contactRow.city || '',
            state: contactRow.state || '',
            zip: contactRow.zip || '',
            dateOfBirth: DateUtils.formatDateOfBirthForResponse(contactRow.dateofbirth),
          };
        }

        contactMap.set(contactId, contactEntry);
      }

      // Add role if present
      if (row.roleid && row.roledata) {
        const contact = contactMap.get(contactId)!;

        // Map role ID to role name
        const roleName = ROLE_NAMES[row.roleid];

        const role = {
          id: row.contactrole_id?.toString() || `${row.roleid}-${row.roledata}`,
          roleId: row.roleid,
          roleName: roleName,
          roleData: row.roledata.toString(),
        };

        // Add context name if available (team or league name)
        if (row.role_context_name) {
          (role as { contextName?: string }).contextName = row.role_context_name;
        }

        contact.contactroles?.push(role);
      }
    }

    // Convert map to array and sort
    const allContacts = Array.from(contactMap.values()).sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    // Handle pagination with efficient hasNext approach
    if (pagination) {
      // Check if we have more results than requested (the +1 record)
      const hasNext = allContacts.length > pagination.limit;

      // Remove the extra contact if present
      const contacts = hasNext ? allContacts.slice(0, pagination.limit) : allContacts;

      return {
        contacts,
        total: contacts.length, // Only the contacts returned, not global total
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          hasNext,
          hasPrev: pagination.page > 1,
        },
      };
    }

    // Return all contacts without pagination
    return {
      contacts: allContacts,
      total: allContacts.length,
    };
  }

  static formatPagedContactResponse(
    accountId: bigint,
    contactsWithTotalCount: { contacts: dbBaseContact[]; total: number },
    includeContactDetails?: boolean,
    pagination?: { page: number; limit: number },
  ): PagedContactType {
    // Transform response (simple contacts without roles)
    const transformedContacts: ContactType[] = contactsWithTotalCount.contacts.map((contact) => ({
      id: contact.id.toString(),
      creatoraccountid: accountId.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename,
      email: contact.email || undefined,
      userId: contact.userid || undefined,
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
      contactroles: [],
      ...(includeContactDetails && {
        contactDetails: {
          phone1: contact.phone1 || '',
          phone2: contact.phone2 || '',
          phone3: contact.phone3 || '',
          streetAddress: contact.streetaddress || '',
          city: contact.city || '',
          state: contact.state || '',
          zip: contact.zip || '',
          dateOfBirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
        },
      }),
    }));

    // Format response
    if (pagination) {
      const response = PaginationHelper.formatResponse(
        transformedContacts,
        pagination.page,
        pagination.limit,
        contactsWithTotalCount.total,
      );

      return {
        contacts: response.data,
        total: response.pagination.total,
        pagination: response.pagination,
      };
    }

    return {
      contacts: transformedContacts,
      total: contactsWithTotalCount.total,
    };
  }
}

export class PollResponseFormatter {
  static formatPoll(poll: dbPollQuestionWithCounts | dbPollQuestionWithUserVotes): AccountPollType {
    const options = poll.voteoptions.map((option) => ({
      id: option.id.toString(),
      optionText: option.optiontext,
      priority: option.priority,
      voteCount: option._count?.voteanswers ?? 0,
    }));

    const totalVotes = options.reduce((sum, option) => sum + option.voteCount, 0);

    const userVoteOptionId =
      'voteanswers' in poll && poll.voteanswers.length > 0
        ? poll.voteanswers[0].optionid.toString()
        : undefined;

    return {
      id: poll.id.toString(),
      accountId: poll.accountid.toString(),
      question: poll.question,
      active: poll.active,
      options,
      totalVotes,
      userVoteOptionId,
    };
  }
}
export class SponsorResponseFormatter {
  static formatSponsor(sponsor: dbSponsor): SponsorType {
    return {
      id: sponsor.id.toString(),
      accountId: sponsor.accountid.toString(),
      teamId: sponsor.teamid ? sponsor.teamid.toString() : undefined,
      name: sponsor.name,
      streetAddress: sponsor.streetaddress || '',
      cityStateZip: sponsor.citystatezip || '',
      description: sponsor.description || '',
      email: sponsor.email || undefined,
      phone: sponsor.phone || undefined,
      fax: sponsor.fax || undefined,
      website: sponsor.website || undefined,
      photoUrl: getSponsorPhotoUrl(sponsor.accountid.toString(), sponsor.id.toString()),
    };
  }

  static formatSponsors(sponsors: dbSponsor[]): SponsorType[] {
    return sponsors.map((sponsor) => this.formatSponsor(sponsor));
  }
}

export class RosterResponseFormatter {
  static formatRosterMembersResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterSeason[],
  ): TeamRosterMembersType {
    const rosterMembers: RosterMemberType[] = dbRosterMembers.map((member) => {
      return this.formatRosterMemberResponse(member);
    });

    const teamRosterMembers: TeamRosterMembersType = {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      rosterMembers: rosterMembers,
    };

    return teamRosterMembers;
  }

  static formatRosterMemberResponse(member: dbRosterMember): RosterMemberType {
    const contact: dbBaseContact = member.roster.contacts;

    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);

    const player: RosterPlayerType = {
      id: member.roster.id.toString(),
      submittedDriversLicense: member.roster.submitteddriverslicense,
      firstYear: member.roster.firstyear,
      contact: contactEntry,
    };

    const rosterMember: RosterMemberType = {
      id: member.id.toString(),
      playerNumber: member.playernumber,
      inactive: member.inactive,
      submittedWaiver: member.submittedwaiver,
      dateAdded: member.dateadded,
      player: player,
    };

    return rosterMember;
  }

  static formatUpdateRosterMemberResponse(
    rosterMember: RosterMemberType,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: RosterMemberType;
  }> {
    return {
      success: true,
      data: {
        message: `Roster information updated for "${playerName}"`,
        rosterMember,
      },
    };
  }

  static formatActivatePlayerResponse(
    rosterMember: RosterMemberType,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: RosterMemberType;
  }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been reactivated`,
        rosterMember,
      },
    };
  }

  static formatDeletePlayerResponse(playerName: string): ApiResponse<{ message: string }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been permanently removed from the roster`,
      },
    };
  }
}

export class ManagerResponseFormatter {
  static formatManagersListResponse(rawManagers: dbTeamManagerWithContact[]): TeamManagerType[] {
    return rawManagers.map((manager) => ({
      id: manager.id.toString(),
      team: {
        id: manager.teamseasonid.toString(),
      },
      contact: {
        id: manager.contacts.id.toString(),
        creatoraccountid: '', // Placeholder, as creatoraccountid is not in RawManager
        userId: manager.contacts.userid || undefined,
        firstName: manager.contacts.firstname,
        lastName: manager.contacts.lastname,
        middleName: manager.contacts.middlename || '',
        email: manager.contacts.email || undefined,
        contactroles: [],
      },
    }));
  }

  static formatAddManagerResponse(rawManager: dbTeamManagerWithContact): TeamManagerType {
    return {
      id: rawManager.id.toString(),
      team: {
        id: rawManager.teamseasonid.toString(),
      },
      contact: {
        id: rawManager.contacts.id.toString(),
        userId: rawManager.contacts.userid || undefined,
        firstName: rawManager.contacts.firstname,
        lastName: rawManager.contacts.lastname,
        middleName: rawManager.contacts.middlename || '',
        email: rawManager.contacts.email || undefined,
      },
    };
  }
}

export class RoleResponseFormatter {
  /**
   * Format the database global roles into the BaseRoleType array
   * @param dbRoles - The database global roles
   * @returns The formatted BaseRoleType array
   */
  static formatBaseRoles(dbRoles: dbGlobalRoles[]): BaseRoleType[] {
    return dbRoles.map((role) => ({
      roleId: role.roleid,
      name: ROLE_NAMES[role.roleid],
    }));
  }

  /**
   * Format the database global roles into the string array
   * @param dbRoles - The database global roles
   * @returns The formatted string array
   */
  static formatGlobalRoles(dbRoles: dbGlobalRoles[]): string[] {
    return dbRoles.map((role) => role.roleid);
  }

  /**
   * Format the database contact role into the ContactRoleType
   * @param dbContactRole - The database contact role
   * @returns The formatted ContactRoleType
   */
  static formatContactRole(dbContactRole: dbContactRoles): ContactRoleType {
    return {
      id: dbContactRole.id.toString(),
      roleId: dbContactRole.roleid,
      roleData: dbContactRole.roledata.toString(),
    };
  }

  /**
   * Format the database contact roles into the RoleWithContactType array
   * @param dbContact - The database contact
   * @param dbContactRoles - The database contact roles
   * @returns The formatted RoleWithContactType array
   */
  static formatRoleWithContact(
    dbContact: dbBaseContact,
    dbContactRoles: dbContactRoles[],
    contextNames?: Map<string, string>,
  ): RoleWithContactType[] {
    return dbContactRoles.map((role) => {
      const roleName = ROLE_NAMES[role.roleid];
      const contextKey = `${role.roleid}-${role.roledata}`;
      const contextName = contextNames?.get(contextKey);

      return {
        id: role.id.toString(),
        contact: {
          id: dbContact.id.toString(),
        },
        roleId: role.roleid,
        roleName: roleName,
        roleData: role.roledata.toString(),
        contextName: contextName,
        accountId: role.accountid.toString(),
      };
    });
  }

  /**
   * Format the database global role into the RoleCheckType
   * @param dbGlobalRole - The database global role
   * @returns The formatted RoleCheckType
   */
  static formatGlobalRoleCheckResult(dbGlobalRole: string): RoleCheckType {
    return {
      roleId: dbGlobalRole,
      userId: '',
      hasRole: true,
      roleLevel: 'global',
      context: '',
    };
  }

  /**
   * Format the database contact role into the RoleCheckType
   * @param dbContactRole - The database contact role
   * @returns The formatted RoleCheckType
   */
  static formatContactRoleCheckResult(dbContactRole: dbContactRoles): RoleCheckType {
    return {
      roleId: dbContactRole.roleid,
      userId: dbContactRole.contactid.toString(),
      hasRole: true,
      roleLevel: 'contact',
      context: dbContactRole.accountid.toString(),
    };
  }

  /**
   * Format the database contact roles into the RoleWithContactType array
   * @param dbContactRoles - The database contact roles
   * @returns The formatted RoleWithContactType array
   */
  static formatRoleWithContacts(dbContactRoles: dbContactRoles[]): RoleWithContactType[] {
    return dbContactRoles.map((role) => ({
      id: role.id.toString(),
      contact: {
        id: role.contactid.toString(),
      },
      roleId: role.roleid,
      roleData: role.roledata.toString(),
      accountId: role.accountid.toString(),
    }));
  }
}
