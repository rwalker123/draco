import { AnnouncementType } from '@draco/shared-schemas';
import { dbAccountAnnouncement, dbTeamAnnouncement } from '../repositories/types/index.js';
import { DateUtils } from '../utils/dateUtils.js';

export class AnnouncementResponseFormatter {
  static formatAccountAnnouncement(record: dbAccountAnnouncement): AnnouncementType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      title: record.title,
      body: record.text,
      publishedAt: this.mapPublishedDate(record.date),
      isSpecial: record.specialannounce,
      visibility: 'account',
    };
  }

  static formatTeamAnnouncement(record: dbTeamAnnouncement, accountId: bigint): AnnouncementType {
    return {
      id: record.id.toString(),
      accountId: accountId.toString(),
      teamId: record.teamid.toString(),
      title: record.title,
      body: record.text,
      publishedAt: this.mapPublishedDate(record.date),
      isSpecial: record.specialannounce,
      visibility: 'team',
    };
  }

  static formatAccountAnnouncements(records: dbAccountAnnouncement[]): AnnouncementType[] {
    return records.map((record) => this.formatAccountAnnouncement(record));
  }

  static formatTeamAnnouncements(
    records: dbTeamAnnouncement[],
    accountId: bigint,
  ): AnnouncementType[] {
    return records.map((record) => this.formatTeamAnnouncement(record, accountId));
  }

  private static mapPublishedDate(date: Date): string {
    return DateUtils.formatDateTimeForResponse(date) ?? date.toISOString();
  }
}
