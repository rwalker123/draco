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

    const emailRepository = {
      findBouncedContactIds: vi.fn().mockResolvedValue([]),
    };

    Object.assign(
      service as unknown as {
        rosterService: typeof rosterService;
        teamService: typeof teamService;
        teamManagerService: typeof teamManagerService;
        emailRepository: typeof emailRepository;
      },
      {
        rosterService,
        teamService,
        teamManagerService,
        emailRepository,
      },
    );

    return { service, rosterService, teamService, teamManagerService, emailRepository };
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

    const result = await (
      service as unknown as {
        resolveRecipients(
          accountId: bigint,
          seasonId: bigint,
          selection: { seasonSelection: { leagues: string[]; managersOnly: boolean } },
        ): Promise<{
          active: Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>;
          skipped: Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>;
        }>;
      }
    ).resolveRecipients(BigInt(1), BigInt(65), {
      seasonSelection: { leagues: ['264'], managersOnly: true },
    });

    expect(result.active).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    expect(result.active.every((r) => r.recipientType === 'teamManager')).toBe(true);
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

    const result = await (
      service as unknown as {
        resolveRecipients(
          accountId: bigint,
          seasonId: bigint,
          selection: { seasonSelection: { leagues: string[] } },
        ): Promise<{
          active: Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>;
          skipped: Array<{
            contactId: bigint;
            emailAddress: string;
            contactName: string;
            recipientType: string;
          }>;
        }>;
      }
    ).resolveRecipients(BigInt(1), BigInt(65), { seasonSelection: { leagues: ['265'] } });

    expect(result.active).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.active[0].recipientType).toBe('league');
    expect(teamManagerService.listManagers).not.toHaveBeenCalled();
  });
});
