import { PaginationWithTotalType, UmpireType, UmpiresType } from '@draco/shared-schemas';
import { dbLeagueUmpireWithContact } from '../repositories/types/dbTypes.js';

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
