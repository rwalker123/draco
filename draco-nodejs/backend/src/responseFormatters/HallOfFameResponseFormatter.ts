import {
  HofClassSummaryType,
  HofClassWithMembersType,
  HofContactSummaryType,
  HofEligibleContactsResponseType,
  HofMemberType,
  HofNominationListType,
  HofNominationSetupType,
  HofNominationType,
} from '@draco/shared-schemas';
import { getContactPhotoUrl } from '../config/logo.js';
import {
  dbHofClassSummary,
  dbHofEligibleContact,
  dbHofMemberWithContact,
  dbHofNomination,
  dbHofNominationSetup,
} from '../repositories/types/dbTypes.js';
import validator from 'validator';

interface PaginationInfo {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class HallOfFameResponseFormatter {
  private static sanitizeForHtml(value: string | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.includes('<') || trimmed.includes('>')) {
      return validator.escape(trimmed);
    }

    return trimmed;
  }

  private static sanitizeForText(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();

    if (trimmed.includes('<') || trimmed.includes('>')) {
      return validator.escape(trimmed);
    }

    return trimmed;
  }

  private static buildDisplayName(contact: dbHofEligibleContact): string {
    const last = contact.lastname?.trim();
    const first = contact.firstname?.trim();
    const middle = contact.middlename?.trim();

    const nameParts: string[] = [];

    if (last) {
      nameParts.push(last);
    }

    const givenNames = [first, middle].filter(Boolean).join(' ').trim();
    if (givenNames) {
      if (nameParts.length > 0) {
        nameParts[0] = `${nameParts[0]}, ${givenNames}`;
      } else {
        nameParts.push(givenNames);
      }
    }

    const fallback = first || last || 'Unknown';
    return this.sanitizeForText(nameParts.join(' ') || fallback);
  }

  private static formatContactSummary(
    accountId: bigint,
    contact: dbHofEligibleContact,
  ): HofContactSummaryType {
    const creatorAccountId = contact.creatoraccountid?.toString() ?? accountId.toString();
    return {
      id: contact.id.toString(),
      firstName: this.sanitizeForText(contact.firstname),
      lastName: this.sanitizeForText(contact.lastname),
      displayName: this.buildDisplayName(contact),
      photoUrl: getContactPhotoUrl(creatorAccountId, contact.id.toString()),
    };
  }

  static formatClassSummary(entry: dbHofClassSummary): HofClassSummaryType {
    return {
      year: entry.year,
      memberCount: entry.memberCount,
    };
  }

  static formatMember(accountId: bigint, member: dbHofMemberWithContact): HofMemberType {
    const sanitizedBio = this.sanitizeForHtml(member.bio);
    const contactSummary = this.formatContactSummary(accountId, member.contacts);

    return {
      id: member.id.toString(),
      accountId: member.accountid.toString(),
      contactId: member.contactid.toString(),
      yearInducted: member.yearinducted,
      biographyHtml: sanitizedBio || undefined,
      contact: contactSummary,
    };
  }

  static formatClassWithMembers(
    accountId: bigint,
    classInfo: dbHofClassSummary,
    members: dbHofMemberWithContact[],
  ): HofClassWithMembersType {
    return {
      year: classInfo.year,
      memberCount: classInfo.memberCount,
      members: members.map((member) => this.formatMember(accountId, member)),
    };
  }

  static formatEligibleContacts(
    accountId: bigint,
    contacts: dbHofEligibleContact[],
    pagination: PaginationInfo,
  ): HofEligibleContactsResponseType {
    return {
      contacts: contacts.map((contact) => this.formatContactSummary(accountId, contact)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        skip: (pagination.page - 1) * pagination.limit,
        sortOrder: 'asc',
      },
    };
  }

  static formatNomination(nomination: dbHofNomination): HofNominationType {
    return {
      id: nomination.id.toString(),
      accountId: nomination.accountid.toString(),
      nominator: this.sanitizeForText(nomination.nominator),
      phoneNumber: this.sanitizeForText(nomination.phonenumber),
      email: this.sanitizeForText(nomination.email),
      nominee: this.sanitizeForText(nomination.nominee),
      reason: this.sanitizeForText(nomination.reason),
      submittedAt: undefined,
    };
  }

  static formatNominationList(
    nominations: dbHofNomination[],
    pagination: PaginationInfo & { total: number },
  ): HofNominationListType {
    return {
      nominations: nominations.map((nomination) => this.formatNomination(nomination)),
      total: pagination.total,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        skip: (pagination.page - 1) * pagination.limit,
        sortOrder: 'desc',
      },
    };
  }

  static formatNominationSetup(
    accountId: bigint,
    setup: dbHofNominationSetup | null,
  ): HofNominationSetupType {
    if (!setup) {
      return {
        accountId: accountId.toString(),
        enableNomination: false,
        criteriaText: undefined,
      };
    }

    const sanitizedCriteria = this.sanitizeForHtml(setup.criteriatext);

    return {
      accountId: setup.accountid.toString(),
      enableNomination: setup.enablenomination,
      criteriaText: sanitizedCriteria || undefined,
    };
  }
}

export default HallOfFameResponseFormatter;
