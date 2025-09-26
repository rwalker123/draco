import {
  dbAccount,
  dbClassifiedPageResponse,
  dbContactInfo,
  dbTeamsWanted,
  dbTeamsWantedPublic,
} from '../repositories/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  AccountNameType,
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedPagedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';

export class TeamsWantedResponseFormatter {
  /**
   * Transform database Teams Wanted record to interface response (for authenticated account members)
   *
   * Converts internal database record to standardized API response format for authenticated users
   * within the same account. This method exposes PII data (email, phone, birth date) but never
   * the access code for security reasons.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Standardized Teams Wanted response object with PII data included
   *
   * @security This method exposes PII data and should only be called for authenticated
   * users with appropriate permissions within the same account boundary.
   *
   * @example
   * ```typescript
   * const response = dataService.transformTeamsWantedToResponse(dbRecord, accountRecord);
   * console.log(response.email); // 'player@example.com' - PII exposed for account members
   * ```
   */
  static transformTeamsWantedToResponse(
    dbRecord: dbTeamsWanted,
    account: dbAccount,
  ): TeamsWantedOwnerClassifiedType {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      age: DateUtils.calculateAge(dbRecord.birthdate),
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to public response (excludes contact info)
   *
   * Converts database record to public API response format that excludes sensitive
   * PII data (email, phone). This method is used for list responses where contact
   * information should not be exposed until explicitly requested.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Public Teams Wanted response object without PII data
   *
   * @security This method excludes email and phone for privacy protection.
   * Contact information must be requested separately through the contact endpoint.
   *
   * @example
   * ```typescript
   * const publicResponse = dataService.transformTeamsWantedToPublicResponse(dbRecord, account);
   * console.log(publicResponse.email); // undefined - PII not exposed
   * console.log(publicResponse.name); // 'John Doe' - non-PII data included
   * ```
   */
  static transformTeamsWantedToPublicResponse(
    dbRecord: dbTeamsWanted,
    account: dbAccount,
  ): TeamsWantedPublicClassifiedType {
    const birthDateForResponse = DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate);
    const age = birthDateForResponse !== null ? DateUtils.calculateAge(birthDateForResponse) : null;

    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      age,
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  /**
   * Transform database Teams Wanted record to owner response (excludes accessCode for security)
   *
   * Converts database record to response format for the classified owner (person who created it).
   * This transformation includes all personal information but never exposes the hashed access code
   * to prevent security vulnerabilities.
   *
   * @param dbRecord - Raw database record from teamswantedclassified table
   * @param account - Account record that owns the classified
   * @returns Owner response object with full PII but no access code
   *
   * @security The access code is never included in any response to prevent
   * unauthorized access. Only the original plain-text code is sent via email.
   *
   * @example
   * ```typescript
   * const ownerResponse = dataService.transformTeamsWantedToOwnerResponse(dbRecord, account);
   * console.log(ownerResponse.email); // 'owner@example.com'
   * console.log(ownerResponse.accessCode); // undefined - never exposed
   * ```
   */
  static transformTeamsWantedToOwnerResponse(
    dbRecord: dbTeamsWanted,
    account: AccountNameType,
  ): TeamsWantedOwnerClassifiedType {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      experience: dbRecord.experience,
      positionsPlayed: dbRecord.positionsplayed,
      birthDate: DateUtils.formatDateOfBirthForResponse(dbRecord.birthdate),
      age: DateUtils.calculateAge(dbRecord.birthdate),
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  static transformPagedTeamsWantedPublic(
    dbResult: dbClassifiedPageResponse<dbTeamsWantedPublic>,
  ): TeamsWantedPublicClassifiedPagedType {
    const data = dbResult.data.map((record) => {
      const accountId = record.accounts.id.toString();
      const birthDateForResponse = DateUtils.formatDateOfBirthForResponse(record.birthdate);
      const age = birthDateForResponse ? DateUtils.calculateAge(birthDateForResponse) : null;

      return {
        id: record.id.toString(),
        accountId,
        dateCreated: DateUtils.formatDateForResponse(record.datecreated),
        name: record.name,
        experience: record.experience,
        positionsPlayed: record.positionsplayed,
        age,
        account: {
          id: accountId,
          name: record.accounts.name,
        },
      };
    });

    const filters = dbResult.filters;
    const formattedFilters = {
      type: filters.type,
      positions: filters.positions,
      experience: filters.experience,
      dateRange: {
        from: filters.dateRange.from
          ? DateUtils.formatDateForResponse(filters.dateRange.from)
          : null,
        to: filters.dateRange.to ? DateUtils.formatDateForResponse(filters.dateRange.to) : null,
      },
      searchQuery: filters.searchQuery,
    };

    return {
      data,
      total: dbResult.total,
      pagination: dbResult.pagination,
      filters: formattedFilters,
    };
  }

  static transformContactInfo(dbResult: dbContactInfo): {
    email: string | null;
    phone: string | null;
    birthDate: string | null;
  } {
    return {
      email: dbResult.email,
      phone: dbResult.phone,
      birthDate: dbResult.birthDate,
    };
  }
}
