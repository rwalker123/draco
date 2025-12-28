import { playerswantedclassified } from '#prisma/client';
import { getContactPhotoUrl } from '../config/logo.js';
import { dbClassifiedPageResponse, dbPlayersWanted } from '../repositories/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  AccountNameType,
  NamedContactType,
  PlayersWantedClassifiedPagedType,
  PlayersWantedClassifiedType,
} from '@draco/shared-schemas';

export class PlayersWantedResponseFormatter {
  /**
   * Transform database Players Wanted record to interface response
   *
   * Converts internal database record format to the standardized API response format,
   * formatting dates and restructuring data to match interface requirements.
   *
   * @param dbRecord - Raw database record from playerswantedclassified table
   * @param creator - Contact record of the user who created the classified
   * @param account - Account record that owns the classified
   * @returns Standardized Players Wanted response object with formatted dates
   *
   */
  static transformPlayersWantedToResponse(
    dbRecord: dbPlayersWanted,
    creator: NamedContactType,
    account: AccountNameType,
  ): PlayersWantedClassifiedType {
    return {
      id: dbRecord.id.toString(),
      accountId: dbRecord.accountid.toString(),
      dateCreated: DateUtils.formatDateForResponse(dbRecord.datecreated),
      createdByContactId: dbRecord.createdbycontactid.toString(),
      teamEventName: dbRecord.teameventname,
      description: dbRecord.description,
      positionsNeeded: dbRecord.positionsneeded,
      notifyOptOut: dbRecord.notifyoptout ?? false,
      creator: {
        id: creator.id.toString(),
        firstName: creator.firstName,
        lastName: creator.lastName,
        photoUrl: getContactPhotoUrl(account.id.toString(), creator.id.toString()),
      },
      account: {
        id: account.id.toString(),
        name: account.name,
      },
    };
  }

  static transformPagedPlayersWanted(
    dbResult: dbClassifiedPageResponse<playerswantedclassified>,
  ): PlayersWantedClassifiedPagedType {
    const transformedData = dbResult.data.map((record) => {
      const recordWithRelations = record as playerswantedclassified & {
        contacts?: { id: bigint; firstname: string; lastname: string } | null;
        accounts?: { id: bigint; name: string } | null;
      };

      const contact = recordWithRelations.contacts;
      const account = recordWithRelations.accounts;

      const contactId = (contact?.id ?? record.createdbycontactid).toString();
      const accountId = (account?.id ?? record.accountid).toString();

      return {
        id: record.id.toString(),
        accountId,
        dateCreated: DateUtils.formatDateForResponse(record.datecreated),
        createdByContactId: record.createdbycontactid.toString(),
        teamEventName: record.teameventname,
        description: record.description,
        positionsNeeded: record.positionsneeded,
        notifyOptOut: record.notifyoptout ?? false,
        creator: {
          id: contactId,
          firstName: contact?.firstname ?? '',
          lastName: contact?.lastname ?? '',
          photoUrl: contact && account ? getContactPhotoUrl(accountId, contactId) : '',
        },
        account: {
          id: accountId,
          name: account?.name ?? '',
        },
      } as PlayersWantedClassifiedType;
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
      data: transformedData,
      total: dbResult.total,
      pagination: dbResult.pagination,
      filters: formattedFilters,
    };
  }
}
