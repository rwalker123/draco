import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../emailService.js';

describe('EmailService recipient resolution for team managers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const buildService = () => {
    const service = Object.create(EmailService.prototype) as EmailService;

    const rosterService = {
      getTeamRosterMembers: vi.fn().mockResolvedValue({ rosterMembers: [] }),
    };

    const teamService = {
      getTeamsByLeagueSeasonId: vi.fn(),
    };

    const teamManagerService = {
      listManagers: vi.fn(),
    };

    Object.assign(
      service as unknown as {
        rosterService: typeof rosterService;
        teamService: typeof teamService;
        teamManagerService: typeof teamManagerService;
      },
      {
        rosterService,
        teamService,
        teamManagerService,
      },
    );

    return { service, rosterService, teamService, teamManagerService };
  };

  it('returns only team managers when teamManagers is true', async () => {
    const { service, rosterService, teamService, teamManagerService } = buildService();

    teamService.getTeamsByLeagueSeasonId.mockResolvedValue([{ id: '101' }]);
    teamManagerService.listManagers.mockResolvedValue([
      {
        id: '1',
        team: { id: '101' },
        contact: {
          id: '201',
          firstName: 'Alice',
          lastName: 'Manager',
          email: 'alice@example.com',
        },
      },
      {
        id: '2',
        team: { id: '101' },
        contact: {
          id: '202',
          firstName: 'Bob',
          lastName: 'Coach',
          email: 'bob@example.com',
        },
      },
    ]);

    const recipients = await (
      service as unknown as {
        resolveRecipients(
          accountId: bigint,
          seasonId: bigint,
          selection: { leagues: string[]; teamManagers: boolean },
        ): Promise<
          Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>
        >;
      }
    ).resolveRecipients(BigInt(1), BigInt(65), { leagues: ['264'], teamManagers: true });

    expect(recipients).toHaveLength(2);
    expect(recipients.every((r) => r.recipientType === 'teamManager')).toBe(true);
    expect(rosterService.getTeamRosterMembers).not.toHaveBeenCalled();
  });

  it('falls back to roster members when teamManagers is false or absent', async () => {
    const { service, rosterService, teamService, teamManagerService } = buildService();

    teamService.getTeamsByLeagueSeasonId.mockResolvedValue([{ id: '102' }]);
    rosterService.getTeamRosterMembers.mockResolvedValue({
      rosterMembers: [
        {
          player: {
            contact: {
              id: '301',
              firstName: 'Regular',
              lastName: 'Player',
              email: 'player@example.com',
            },
          },
        },
      ],
    });

    const recipients = await (
      service as unknown as {
        resolveRecipients(
          accountId: bigint,
          seasonId: bigint,
          selection: { leagues: string[] },
        ): Promise<
          Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>
        >;
      }
    ).resolveRecipients(BigInt(1), BigInt(65), { leagues: ['265'] });

    expect(recipients).toHaveLength(1);
    expect(recipients[0].recipientType).toBe('league');
    expect(teamManagerService.listManagers).not.toHaveBeenCalled();
  });
});
