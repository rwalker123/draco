import {
  BaseContactType,
  NamedContactType,
  RosterPlayerType,
  ContactType,
  PagedContactType,
  AccountPollType,
  PublicContactSummaryType,
} from '@draco/shared-schemas';
import { getContactPhotoUrl } from '../config/logo.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  dbBaseContact,
  dbRosterPlayer,
  dbContactWithRoleAndDetails,
  dbPollQuestionWithCounts,
  dbPollQuestionWithUserVotes,
  dbBirthdayContact,
} from '../repositories/index.js';
import { ROLE_NAMES } from '../config/roles.js';
import { PaginationHelper } from '../utils/pagination.js';

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
        firstYear: null, // Not available without roster join
      },
    };
    return contactEntry;
  }

  static formatBirthdayContactResponse(
    accountId: bigint,
    contact: dbBirthdayContact,
  ): BaseContactType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
    };
  }

  static formatManyContactsResponse(contacts: dbBaseContact[]): BaseContactType[] {
    return contacts.map((contact) => this.formatContactResponse(contact));
  }

  static formatPublicContactSummary(
    accountId: bigint,
    contact: dbBaseContact,
  ): PublicContactSummaryType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
    };
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
            firstYear: contactRow.firstyear ?? null,
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

    // Convert map to array - preserve insertion order from SQL query
    // The SQL query already applies the requested sort order, and JavaScript Maps
    // maintain insertion order, so we don't need to re-sort here
    const allContacts = Array.from(contactMap.values());

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
          firstYear: null, // Not available in simple contact query - would require roster join
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
