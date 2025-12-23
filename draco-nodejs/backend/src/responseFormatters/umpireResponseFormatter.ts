import { PaginationWithTotalType, UmpireType, UmpiresType } from '@draco/shared-schemas';
import { dbLeagueUmpireWithContact } from '../repositories/types/dbTypes.js';
import { getContactPhotoUrl } from '../config/logo.js';

export class UmpireResponseFormatter {
  private static buildPagination(
    page: number,
    limit: number,
    total: number,
  ): PaginationWithTotalType {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  static formatUmpire(umpire: dbLeagueUmpireWithContact): UmpireType {
    const email = umpire.contacts.email ?? null;

    return {
      id: umpire.id.toString(),
      accountId: umpire.accountid.toString(),
      contactId: umpire.contactid.toString(),
      firstName: umpire.contacts.firstname,
      lastName: umpire.contacts.lastname,
      email,
      displayName: `${umpire.contacts.firstname} ${umpire.contacts.lastname}`.trim(),
      photoUrl: getContactPhotoUrl(umpire.accountid.toString(), umpire.contacts.id.toString()),
      contactDetails: {
        phone1: umpire.contacts.phone1 ?? '',
        phone2: umpire.contacts.phone2 ?? '',
        phone3: umpire.contacts.phone3 ?? '',
        streetAddress: umpire.contacts.streetaddress ?? '',
        city: umpire.contacts.city ?? '',
        state: umpire.contacts.state ?? '',
        zip: umpire.contacts.zip ?? '',
        dateOfBirth: umpire.contacts.dateofbirth?.toISOString().split('T')[0] ?? '',
      },
    };
  }

  static formatUmpires(umpires: dbLeagueUmpireWithContact[]): UmpireType[] {
    return umpires.map((umpire) => this.formatUmpire(umpire));
  }

  static formatPagedUmpires(
    umpires: dbLeagueUmpireWithContact[],
    page: number,
    limit: number,
    total: number,
  ): UmpiresType {
    return {
      umpires: this.formatUmpires(umpires),
      pagination: this.buildPagination(page, limit, total),
    };
  }
}
