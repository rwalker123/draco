import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementService } from '../announcementService.js';
import {
  IAnnouncementRepository,
  ITeamRepository,
  dbAccountAnnouncement,
  dbTeamAnnouncement,
} from '../../repositories/index.js';
import { leaguenews, teamnews } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { DiscordIntegrationService } from '../discordIntegrationService.js';

const publishAnnouncementSpy = vi
  .spyOn(DiscordIntegrationService.prototype, 'publishAnnouncement')
  .mockResolvedValue();

afterEach(() => {
  publishAnnouncementSpy.mockClear();
});

afterAll(() => {
  publishAnnouncementSpy.mockRestore();
});

const cloneAccountAnnouncement = (record: dbAccountAnnouncement): dbAccountAnnouncement => ({
  id: record.id,
  accountid: record.accountid,
  date: new Date(record.date),
  title: record.title,
  text: record.text,
  specialannounce: record.specialannounce,
});

const cloneTeamAnnouncement = (record: dbTeamAnnouncement): dbTeamAnnouncement => ({
  id: record.id,
  teamid: record.teamid,
  date: new Date(record.date),
  title: record.title,
  text: record.text,
  specialannounce: record.specialannounce,
  teams: {
    id: record.teams.id,
    accountid: record.teams.accountid,
  },
});

describe('AnnouncementService', () => {
  const accountId = 42n;
  const otherAccountId = 7n;
  const teamId = 5n;

  let accountAnnouncements: dbAccountAnnouncement[];
  let teamAnnouncements: dbTeamAnnouncement[];
  let nextAccountId: bigint;
  let nextTeamId: bigint;
  let announcementRepository: IAnnouncementRepository;
  let teamRepository: ITeamRepository;
  let service: AnnouncementService;

  beforeEach(() => {
    nextAccountId = 2n;
    nextTeamId = 2n;

    accountAnnouncements = [
      {
        id: 1n,
        accountid: accountId,
        date: new Date('2024-06-01T12:00:00Z'),
        title: 'Season opener',
        text: 'Welcome to the new season!',
        specialannounce: false,
      },
    ];

    teamAnnouncements = [
      {
        id: 1n,
        teamid: teamId,
        date: new Date('2024-06-02T15:00:00Z'),
        title: 'Practice schedule',
        text: 'Practice every Tuesday at 6pm.',
        specialannounce: true,
        teams: {
          id: teamId,
          accountid: accountId,
        },
      },
    ];

    announcementRepository = {
      async listAccountAnnouncements(requestedAccountId: bigint): Promise<dbAccountAnnouncement[]> {
        return accountAnnouncements
          .filter((record) => record.accountid === requestedAccountId)
          .map(cloneAccountAnnouncement);
      },
      async findAccountAnnouncementById(
        announcementId: bigint,
        requestedAccountId: bigint,
      ): Promise<dbAccountAnnouncement | null> {
        const found = accountAnnouncements.find(
          (record) => record.id === announcementId && record.accountid === requestedAccountId,
        );
        return found ? cloneAccountAnnouncement(found) : null;
      },
      async createAccountAnnouncement(data: Partial<leaguenews>): Promise<leaguenews> {
        const id = nextAccountId;
        nextAccountId += 1n;
        const record: dbAccountAnnouncement = {
          id,
          accountid: data.accountid as bigint,
          date: data.date as Date,
          title: data.title as string,
          text: data.text as string,
          specialannounce: (data.specialannounce as boolean | undefined) ?? false,
        };
        accountAnnouncements.push(record);
        return { ...(record as unknown as leaguenews) };
      },
      async updateAccountAnnouncement(
        announcementId: bigint,
        data: Partial<leaguenews>,
      ): Promise<leaguenews> {
        const index = accountAnnouncements.findIndex((record) => record.id === announcementId);
        if (index === -1) {
          throw new NotFoundError('Announcement not found');
        }
        const current = accountAnnouncements[index];
        const updated: dbAccountAnnouncement = {
          id: current.id,
          accountid: current.accountid,
          date: (data.date as Date | undefined) ?? current.date,
          title: (data.title as string | undefined) ?? current.title,
          text: (data.text as string | undefined) ?? current.text,
          specialannounce: (data.specialannounce as boolean | undefined) ?? current.specialannounce,
        };
        accountAnnouncements[index] = updated;
        return { ...(updated as unknown as leaguenews) };
      },
      async deleteAccountAnnouncement(announcementId: bigint): Promise<void> {
        const index = accountAnnouncements.findIndex((record) => record.id === announcementId);
        if (index === -1) {
          throw new NotFoundError('Announcement not found');
        }
        accountAnnouncements.splice(index, 1);
      },
      async listTeamAnnouncements(requestedTeamId: bigint): Promise<dbTeamAnnouncement[]> {
        return teamAnnouncements
          .filter((record) => record.teamid === requestedTeamId)
          .map(cloneTeamAnnouncement);
      },
      async findTeamAnnouncementById(
        announcementId: bigint,
        requestedTeamId: bigint,
      ): Promise<dbTeamAnnouncement | null> {
        const found = teamAnnouncements.find(
          (record) => record.id === announcementId && record.teamid === requestedTeamId,
        );
        return found ? cloneTeamAnnouncement(found) : null;
      },
      async createTeamAnnouncement(data: Partial<teamnews>): Promise<teamnews> {
        const id = nextTeamId;
        nextTeamId += 1n;
        const teamRecord = {
          id: data.teamid as bigint,
          accountid: accountId,
        };
        const record: dbTeamAnnouncement = {
          id,
          teamid: data.teamid as bigint,
          date: data.date as Date,
          title: data.title as string,
          text: data.text as string,
          specialannounce: (data.specialannounce as boolean | undefined) ?? false,
          teams: teamRecord,
        };
        teamAnnouncements.push(record);
        return { ...(record as unknown as teamnews) };
      },
      async updateTeamAnnouncement(
        announcementId: bigint,
        data: Partial<teamnews>,
      ): Promise<teamnews> {
        const index = teamAnnouncements.findIndex((record) => record.id === announcementId);
        if (index === -1) {
          throw new NotFoundError('Team announcement not found');
        }
        const current = teamAnnouncements[index];
        const updated: dbTeamAnnouncement = {
          id: current.id,
          teamid: current.teamid,
          date: (data.date as Date | undefined) ?? current.date,
          title: (data.title as string | undefined) ?? current.title,
          text: (data.text as string | undefined) ?? current.text,
          specialannounce: (data.specialannounce as boolean | undefined) ?? current.specialannounce,
          teams: current.teams,
        };
        teamAnnouncements[index] = updated;
        return { ...(updated as unknown as teamnews) };
      },
      async deleteTeamAnnouncement(announcementId: bigint): Promise<void> {
        const index = teamAnnouncements.findIndex((record) => record.id === announcementId);
        if (index === -1) {
          throw new NotFoundError('Team announcement not found');
        }
        teamAnnouncements.splice(index, 1);
      },
    } satisfies IAnnouncementRepository;

    teamRepository = {
      async findTeamDefinition(requestedTeamId: bigint) {
        if (requestedTeamId === teamId) {
          return {
            id: requestedTeamId,
            accountid: accountId,
          };
        }
        if (requestedTeamId === 99n) {
          return {
            id: requestedTeamId,
            accountid: otherAccountId,
          };
        }
        return null;
      },
    } as unknown as ITeamRepository;

    service = new AnnouncementService(announcementRepository, teamRepository);
  });

  it('lists account announcements with normalized output', async () => {
    const result = await service.listAccountAnnouncements(accountId);

    expect(result).toEqual([
      {
        id: '1',
        accountId: accountId.toString(),
        title: 'Season opener',
        body: 'Welcome to the new season!',
        publishedAt: accountAnnouncements[0].date.toISOString(),
        isSpecial: false,
        visibility: 'account',
      },
    ]);
  });

  it('lists account announcement summaries with filters applied', async () => {
    const specialDate = new Date('2024-06-05T15:30:00Z');
    accountAnnouncements.unshift({
      id: 2n,
      accountid: accountId,
      date: specialDate,
      title: 'Special bulletin',
      text: 'Important account announcement.',
      specialannounce: true,
    });

    const result = await service.listAccountAnnouncementSummaries(accountId, {
      includeSpecialOnly: true,
      limit: 1,
    });

    expect(result).toEqual([
      {
        id: '2',
        accountId: accountId.toString(),
        title: 'Special bulletin',
        publishedAt: specialDate.toISOString(),
        isSpecial: true,
        visibility: 'account',
      },
    ]);
  });

  it('creates an account announcement with trimmed payload', async () => {
    const payload = {
      title: '  New Sponsor  ',
      body: '  Welcome our new sponsor!  ',
      publishedAt: '2024-07-01T09:00:00Z',
      isSpecial: true,
    };

    const result = await service.createAccountAnnouncement(accountId, payload);

    expect(result.title).toBe('New Sponsor');
    expect(result.body).toBe('Welcome our new sponsor!');
    expect(result.isSpecial).toBe(true);
    expect(accountAnnouncements).toHaveLength(2);
  });

  it('updates a team announcement', async () => {
    const payload = {
      title: 'Updated practice schedule',
      body: 'Practice every Wednesday instead.',
      publishedAt: '2024-06-03T10:00:00Z',
      isSpecial: false,
    };

    const result = await service.updateTeamAnnouncement(accountId, teamId, 1n, payload);

    expect(result.title).toBe('Updated practice schedule');
    expect(result.isSpecial).toBe(false);
    const stored = teamAnnouncements.find((record) => record.id === 1n);
    expect(stored?.title).toBe('Updated practice schedule');
  });

  it('lists team announcement summaries with limit applied', async () => {
    const latestDate = new Date('2024-06-03T18:00:00Z');
    teamAnnouncements.unshift({
      id: 2n,
      teamid: teamId,
      date: latestDate,
      title: 'Lineup posted',
      text: "Visit the portal for this week's lineup.",
      specialannounce: false,
      teams: {
        id: teamId,
        accountid: accountId,
      },
    });

    const result = await service.listTeamAnnouncementSummaries(accountId, teamId, { limit: 1 });

    expect(result).toEqual([
      {
        id: '2',
        accountId: accountId.toString(),
        teamId: teamId.toString(),
        title: 'Lineup posted',
        publishedAt: latestDate.toISOString(),
        isSpecial: false,
        visibility: 'team',
      },
    ]);
  });

  it('deletes a team announcement', async () => {
    await service.deleteTeamAnnouncement(accountId, teamId, 1n);
    expect(teamAnnouncements).toHaveLength(0);
  });

  it('throws when publishedAt is invalid', async () => {
    await expect(
      service.createAccountAnnouncement(accountId, {
        title: 'Bad date',
        body: 'This should fail.',
        publishedAt: 'not-a-date',
        isSpecial: false,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws when team announcement is requested for another account', async () => {
    await expect(service.getTeamAnnouncement(otherAccountId, teamId, 1n)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
