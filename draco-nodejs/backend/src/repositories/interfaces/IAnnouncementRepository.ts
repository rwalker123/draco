import { leaguenews, teamnews } from '#prisma/client';
import { dbAccountAnnouncement, dbTeamAnnouncement } from '../types/index.js';

export interface IAnnouncementRepository {
  listAccountAnnouncements(accountId: bigint): Promise<dbAccountAnnouncement[]>;
  findAccountAnnouncementById(
    announcementId: bigint,
    accountId: bigint,
  ): Promise<dbAccountAnnouncement | null>;
  createAccountAnnouncement(data: Partial<leaguenews>): Promise<leaguenews>;
  updateAccountAnnouncement(announcementId: bigint, data: Partial<leaguenews>): Promise<leaguenews>;
  deleteAccountAnnouncement(announcementId: bigint): Promise<void>;

  listTeamAnnouncements(teamId: bigint): Promise<dbTeamAnnouncement[]>;
  findTeamAnnouncementById(
    announcementId: bigint,
    teamId: bigint,
  ): Promise<dbTeamAnnouncement | null>;
  createTeamAnnouncement(data: Partial<teamnews>): Promise<teamnews>;
  updateTeamAnnouncement(announcementId: bigint, data: Partial<teamnews>): Promise<teamnews>;
  deleteTeamAnnouncement(announcementId: bigint): Promise<void>;
}
