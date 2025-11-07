import { AnnouncementType } from '@draco/shared-schemas';
import { dbAccountAnnouncement, dbTeamAnnouncement } from '../repositories/types/index.js';
import { DateUtils } from '../utils/dateUtils.js';

export type AnnouncementSummaryResponse = Omit<AnnouncementType, 'body'>;

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

  static formatAccountAnnouncementSummary(
    record: dbAccountAnnouncement,
  ): AnnouncementSummaryResponse {
    return this.toSummary(this.formatAccountAnnouncement(record));
  }

  static formatTeamAnnouncementSummary(
    record: dbTeamAnnouncement,
    accountId: bigint,
  ): AnnouncementSummaryResponse {
    return this.toSummary(this.formatTeamAnnouncement(record, accountId));
  }

  static formatAccountAnnouncementSummaries(
    records: dbAccountAnnouncement[],
  ): AnnouncementSummaryResponse[] {
    return records.map((record) => this.formatAccountAnnouncementSummary(record));
  }

  static formatTeamAnnouncementSummaries(
    records: dbTeamAnnouncement[],
    accountId: bigint,
  ): AnnouncementSummaryResponse[] {
    return records.map((record) => this.formatTeamAnnouncementSummary(record, accountId));
  }

  private static mapPublishedDate(date: Date): string {
    return DateUtils.formatDateTimeForResponse(date) ?? date.toISOString();
  }

  private static toSummary(announcement: AnnouncementType): AnnouncementSummaryResponse {
    const { body: _body, ...summary } = announcement;
    return summary;
  }
}
