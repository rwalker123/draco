import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../emailService.js';
import { EmailConfigFactory } from '../../config/email.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { ContactBounceInfo } from '../../interfaces/emailInterfaces.js';

describe('EmailService bounce handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const buildService = () => {
    const service = Object.create(EmailService.prototype) as EmailService;

    const mockProvider = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
    };

    const emailRepository = {
      getBouncedContactsForAccount: vi.fn(),
      clearContactEmailBounce: vi.fn().mockResolvedValue(undefined),
      findBouncedContactIds: vi.fn().mockResolvedValue([]),
    };

    (service as any).provider = mockProvider;
    (service as any).emailRepository = emailRepository;

    return { service, mockProvider, emailRepository };
  };

  const makeBounce = (overrides: Partial<ContactBounceInfo> = {}): ContactBounceInfo => ({
    contactId: BigInt(1),
    emailAddress: 'contact@example.com',
    contactName: 'Test Contact',
    senderEmail: 'sender@example.com',
    senderName: 'Test Sender',
    bounceReason: 'Mailbox does not exist',
    emailSubject: 'Test Email',
    ...overrides,
  });

  const mockSettings = () =>
    vi.spyOn(EmailConfigFactory, 'getEmailSettings').mockReturnValue({
      provider: 'sendgrid',
      fromEmail: 'system@example.com',
      fromName: 'System',
    });

  describe('sendBounceNotifications', () => {
    it('returns early without calling the provider when given an empty array', async () => {
      const { service, mockProvider } = buildService();

      await service.sendBounceNotifications([]);

      expect(mockProvider.sendEmail).not.toHaveBeenCalled();
    });

    it('skips bounces with null or invalid sender email', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([
        makeBounce({ senderEmail: null }),
        makeBounce({ senderEmail: 'not-an-email' }),
      ]);

      expect(mockProvider.sendEmail).not.toHaveBeenCalled();
    });

    it('sends one notification per unique sender email', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([
        makeBounce({ senderEmail: 'alice@example.com', emailAddress: 'c1@example.com' }),
        makeBounce({ senderEmail: 'bob@example.com', emailAddress: 'c2@example.com' }),
      ]);

      expect(mockProvider.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('groups multiple bounces to the same sender into one email', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([
        makeBounce({ senderEmail: 'sender@example.com', emailAddress: 'c1@example.com' }),
        makeBounce({ senderEmail: 'sender@example.com', emailAddress: 'c2@example.com' }),
      ]);

      expect(mockProvider.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('uses singular subject when one contact bounced', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([makeBounce()]);

      expect(mockProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Email delivery failed — 1 contact has an unreachable address',
        }),
      );
    });

    it('uses plural subject when multiple contacts bounced for the same sender', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([
        makeBounce({ emailAddress: 'c1@example.com' }),
        makeBounce({ emailAddress: 'c2@example.com' }),
      ]);

      expect(mockProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Email delivery failed — 2 contacts have unreachable addresses',
        }),
      );
    });

    it('swallows provider errors without throwing', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();
      mockProvider.sendEmail.mockRejectedValue(new Error('SMTP failure'));

      await expect(service.sendBounceNotifications([makeBounce()])).resolves.toBeUndefined();
    });

    it('escapes HTML special characters in contactName, emailAddress, and bounceReason', async () => {
      const { service, mockProvider } = buildService();
      mockSettings();

      await service.sendBounceNotifications([
        makeBounce({
          contactName: '<script>alert(1)</script>',
          emailAddress: 'bad"&email@example.com',
          bounceReason: 'reason <b>bold</b> & more',
        }),
      ]);

      const html: string = mockProvider.sendEmail.mock.calls[0]?.[0]?.html ?? '';
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
      expect(html).not.toContain('<b>');
    });
  });

  describe('getBouncedContacts', () => {
    it('maps repository contacts to the expected camelCase format', async () => {
      const { service, emailRepository } = buildService();
      const bouncedAt = new Date('2024-06-01T12:00:00.000Z');

      emailRepository.getBouncedContactsForAccount.mockResolvedValue([
        {
          id: BigInt(42),
          firstname: 'Jane',
          lastname: 'Doe',
          email: 'jane@example.com',
          email_bounced_at: bouncedAt,
        },
      ]);

      const result = await service.getBouncedContacts(BigInt(1));

      expect(result).toEqual([
        {
          id: '42',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          emailBouncedAt: bouncedAt.toISOString(),
        },
      ]);
    });

    it('returns an empty array when no bounced contacts exist', async () => {
      const { service, emailRepository } = buildService();
      emailRepository.getBouncedContactsForAccount.mockResolvedValue([]);

      const result = await service.getBouncedContacts(BigInt(1));

      expect(result).toEqual([]);
    });
  });

  describe('clearContactEmailBounce', () => {
    it('throws ValidationError when newEmail is not a valid email address', async () => {
      const { service } = buildService();

      await expect(
        service.clearContactEmailBounce(BigInt(1), BigInt(10), 'not-an-email'),
      ).rejects.toThrow(ValidationError);
    });

    it('delegates to repository with the new email when valid', async () => {
      const { service, emailRepository } = buildService();

      await service.clearContactEmailBounce(BigInt(1), BigInt(10), 'valid@example.com');

      expect(emailRepository.clearContactEmailBounce).toHaveBeenCalledWith(
        BigInt(1),
        BigInt(10),
        'valid@example.com',
      );
    });

    it('delegates to repository without an email when none is provided', async () => {
      const { service, emailRepository } = buildService();

      await service.clearContactEmailBounce(BigInt(1), BigInt(10));

      expect(emailRepository.clearContactEmailBounce).toHaveBeenCalledWith(
        BigInt(1),
        BigInt(10),
        undefined,
      );
    });

    it('propagates NotFoundError from repository so the route returns 404', async () => {
      const { service, emailRepository } = buildService();
      emailRepository.clearContactEmailBounce.mockRejectedValue(
        new NotFoundError('Contact not found'),
      );

      await expect(service.clearContactEmailBounce(BigInt(1), BigInt(99))).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('resolveRecipients — bounce filtering', () => {
    it('moves a contact with a bounced ID from active to skipped', async () => {
      const service = Object.create(EmailService.prototype) as EmailService;

      const rosterService = {
        getTeamRosterMembers: vi.fn().mockResolvedValue({
          rosterMembers: [
            {
              player: {
                contact: {
                  id: '301',
                  firstName: 'Bounced',
                  lastName: 'User',
                  email: 'bounced@example.com',
                },
              },
            },
            {
              player: {
                contact: {
                  id: '302',
                  firstName: 'Active',
                  lastName: 'User',
                  email: 'active@example.com',
                },
              },
            },
          ],
        }),
      };

      const teamService = {
        getTeamsByLeagueSeasonId: vi.fn().mockResolvedValue([{ id: '100' }]),
      };

      const teamManagerService = {
        listManagers: vi.fn(),
      };

      const emailRepository = {
        findBouncedContactIds: vi.fn().mockResolvedValue([BigInt(301)]),
      };

      Object.assign(service as any, {
        rosterService,
        teamService,
        teamManagerService,
        emailRepository,
      });

      const result = await (service as any).resolveRecipients(BigInt(1), BigInt(65), {
        seasonSelection: { leagues: ['264'] },
      });

      expect(result.active).toHaveLength(1);
      expect(result.active[0].emailAddress).toBe('active@example.com');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].emailAddress).toBe('bounced@example.com');
    });
  });
});
