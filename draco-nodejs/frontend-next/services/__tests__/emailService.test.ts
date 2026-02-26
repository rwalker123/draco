import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  composeAccountEmail as apiComposeAccountEmail,
  listAccountEmails as apiListAccountEmails,
  getAccountEmail as apiGetAccountEmail,
  createEmailTemplate as apiCreateEmailTemplate,
  listEmailTemplates as apiListEmailTemplates,
  getEmailTemplate as apiGetEmailTemplate,
  updateEmailTemplate as apiUpdateEmailTemplate,
  deleteEmailTemplate as apiDeleteEmailTemplate,
  previewEmailTemplate as apiPreviewEmailTemplate,
  listEmailAttachments as apiListEmailAttachments,
  deleteEmailAttachment as apiDeleteEmailAttachment,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { EmailService } from '../emailService';

vi.mock('@draco/shared-api-client', () => ({
  composeAccountEmail: vi.fn(),
  listAccountEmails: vi.fn(),
  getAccountEmail: vi.fn(),
  createEmailTemplate: vi.fn(),
  listEmailTemplates: vi.fn(),
  getEmailTemplate: vi.fn(),
  updateEmailTemplate: vi.fn(),
  deleteEmailTemplate: vi.fn(),
  previewEmailTemplate: vi.fn(),
  uploadEmailAttachments: vi.fn(),
  listEmailAttachments: vi.fn(),
  downloadEmailAttachment: vi.fn(),
  deleteEmailAttachment: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('@draco/shared-api-client/generated/client', () => ({
  formDataBodySerializer: {},
}));

vi.mock('@draco/shared-schemas', () => ({
  EmailSendSchema: {
    parse: vi.fn((v) => v),
  },
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode, isRetryable: false },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-1';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailService(undefined, {} as never);
  });

  describe('composeEmail', () => {
    it('sends email and returns the emailId', async () => {
      vi.mocked(apiComposeAccountEmail).mockResolvedValue(
        makeOk({ emailId: 'email-99', status: 'sending' }),
      );

      const result = await service.composeEmail(ACCOUNT_ID, {
        recipients: { contacts: ['c-1'] },
        subject: 'Hello',
        body: '<p>Hello</p>',
      });

      expect(apiComposeAccountEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          client: expect.anything(),
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect(result).toBe('email-99');
    });

    it('marks email as scheduled when scheduledSend is provided', async () => {
      vi.mocked(apiComposeAccountEmail).mockResolvedValue(
        makeOk({ emailId: 'email-100', status: 'scheduled' }),
      );

      const scheduledDate = new Date('2026-03-01T10:00:00Z');
      await service.composeEmail(ACCOUNT_ID, {
        recipients: { contacts: [] },
        subject: 'Scheduled',
        body: '<p>Later</p>',
        scheduledSend: scheduledDate,
      });

      const callBody = vi.mocked(apiComposeAccountEmail).mock.calls[0][0].body;
      expect(callBody!.status).toBe('scheduled');
      expect(callBody!.scheduledSend).toBe(scheduledDate.toISOString());
    });

    it('throws ApiClientError when compose fails', async () => {
      vi.mocked(apiComposeAccountEmail).mockResolvedValue(makeError('Send failed'));

      await expect(
        service.composeEmail(ACCOUNT_ID, {
          recipients: { contacts: [] },
          subject: 'Fail',
          body: '',
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listEmails', () => {
    it('returns mapped email list with pagination', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiListAccountEmails).mockResolvedValue(
        makeOk({
          emails: [
            {
              id: 'e-1',
              subject: 'Test',
              status: 'sent',
              createdAt: now,
              sentAt: now,
              totalRecipients: 10,
              successfulDeliveries: 9,
              failedDeliveries: 1,
              openCount: 5,
              clickCount: 2,
            },
          ],
          pagination: { total: 1, page: 1, limit: 25 },
        }),
      );

      const result = await service.listEmails(ACCOUNT_ID);

      expect(apiListAccountEmails).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          query: { page: 1, limit: 25, status: undefined },
          throwOnError: false,
        }),
      );
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].id).toBe('e-1');
      expect(result.emails[0].subject).toBe('Test');
      expect(result.emails[0].accountId).toBe(ACCOUNT_ID);
      expect(result.emails[0].bodyHtml).toBe('');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('calculates totalPages correctly for multiple pages', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiListAccountEmails).mockResolvedValue(
        makeOk({
          emails: [
            {
              id: 'e-2',
              subject: 'Batch',
              status: 'sent',
              createdAt: now,
              totalRecipients: 0,
              successfulDeliveries: 0,
              failedDeliveries: 0,
              openCount: 0,
              clickCount: 0,
            },
          ],
          pagination: { total: 50, page: 1, limit: 10 },
        }),
      );

      const result = await service.listEmails(ACCOUNT_ID, 1, 10);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('throws when the API returns an error', async () => {
      vi.mocked(apiListAccountEmails).mockResolvedValue(makeError('Unauthorized', 401));
      await expect(service.listEmails(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getEmail', () => {
    it('returns a fully mapped email detail', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiGetAccountEmail).mockResolvedValue(
        makeOk({
          id: 'e-10',
          subject: 'Detail',
          status: 'sent',
          bodyHtml: '<p>Body</p>',
          createdAt: now,
          totalRecipients: 2,
          successfulDeliveries: 2,
          failedDeliveries: 0,
          bounceCount: 0,
          openCount: 1,
          clickCount: 0,
          recipients: [],
          attachments: [],
        }),
      );

      const result = await service.getEmail(ACCOUNT_ID, 'e-10');

      expect(apiGetAccountEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, emailId: 'e-10' },
          throwOnError: false,
        }),
      );
      expect(result.id).toBe('e-10');
      expect(result.subject).toBe('Detail');
      expect(result.bodyHtml).toBe('<p>Body</p>');
      expect(result.recipients).toEqual([]);
      expect(result.attachments).toEqual([]);
    });

    it('passes the AbortSignal through', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiGetAccountEmail).mockResolvedValue(
        makeOk({
          id: 'e-11',
          subject: 'S',
          status: 'sent',
          createdAt: now,
          totalRecipients: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          openCount: 0,
          clickCount: 0,
          recipients: [],
          attachments: [],
        }),
      );

      const controller = new AbortController();
      await service.getEmail(ACCOUNT_ID, 'e-11', controller.signal);

      expect(vi.mocked(apiGetAccountEmail).mock.calls[0][0].signal).toBe(controller.signal);
    });
  });

  describe('createTemplate', () => {
    it('creates a template and maps the response', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiCreateEmailTemplate).mockResolvedValue(
        makeOk({
          id: 't-1',
          accountId: ACCOUNT_ID,
          name: 'Welcome',
          bodyTemplate: '<p>Hi</p>',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }),
      );

      const result = await service.createTemplate(ACCOUNT_ID, {
        name: 'Welcome',
        bodyTemplate: '<p>Hi</p>',
      });

      expect(apiCreateEmailTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: { name: 'Welcome', bodyTemplate: '<p>Hi</p>' },
          throwOnError: false,
        }),
      );
      expect(result.id).toBe('t-1');
      expect(result.name).toBe('Welcome');
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('listTemplates', () => {
    it('returns an array of mapped templates', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiListEmailTemplates).mockResolvedValue(
        makeOk({
          templates: [
            {
              id: 't-2',
              accountId: ACCOUNT_ID,
              name: 'Newsletter',
              bodyTemplate: '<p>News</p>',
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }),
      );

      const result = await service.listTemplates(ACCOUNT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t-2');
      expect(result[0].name).toBe('Newsletter');
    });

    it('throws when template list call errors', async () => {
      vi.mocked(apiListEmailTemplates).mockResolvedValue(makeError('Server error', 500));
      await expect(service.listTemplates(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getTemplate', () => {
    it('retrieves and maps a single template', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiGetEmailTemplate).mockResolvedValue(
        makeOk({
          id: 't-3',
          accountId: ACCOUNT_ID,
          name: 'Promo',
          description: 'Promotional email',
          bodyTemplate: '<p>Deal</p>',
          subjectTemplate: 'Big Deal',
          isActive: false,
          createdAt: now,
          updatedAt: now,
        }),
      );

      const result = await service.getTemplate(ACCOUNT_ID, 't-3');

      expect(result.description).toBe('Promotional email');
      expect(result.subjectTemplate).toBe('Big Deal');
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateTemplate', () => {
    it('updates a template and returns the updated version', async () => {
      const now = new Date().toISOString();
      vi.mocked(apiUpdateEmailTemplate).mockResolvedValue(
        makeOk({
          id: 't-4',
          accountId: ACCOUNT_ID,
          name: 'Updated',
          bodyTemplate: '<p>New body</p>',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }),
      );

      const result = await service.updateTemplate(ACCOUNT_ID, 't-4', { name: 'Updated' });

      expect(apiUpdateEmailTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, templateId: 't-4' },
          body: { name: 'Updated' },
          throwOnError: false,
        }),
      );
      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteTemplate', () => {
    it('resolves without error on successful delete', async () => {
      vi.mocked(apiDeleteEmailTemplate).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(service.deleteTemplate(ACCOUNT_ID, 't-5')).resolves.toBeUndefined();
      expect(apiDeleteEmailTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, templateId: 't-5' },
          throwOnError: false,
        }),
      );
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(apiDeleteEmailTemplate).mockResolvedValue(makeError('Not found', 404));
      await expect(service.deleteTemplate(ACCOUNT_ID, 't-5')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('previewTemplate', () => {
    it('returns subject and body for a template preview', async () => {
      vi.mocked(apiPreviewEmailTemplate).mockResolvedValue(
        makeOk({ subject: 'Hi Alice', body: '<p>Hello Alice</p>' }),
      );

      const result = await service.previewTemplate(ACCOUNT_ID, 't-6', { name: 'Alice' });

      expect(apiPreviewEmailTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, templateId: 't-6' },
          body: { variables: { name: 'Alice' } },
          throwOnError: false,
        }),
      );
      expect(result.subject).toBe('Hi Alice');
      expect(result.body).toBe('<p>Hello Alice</p>');
    });
  });

  describe('listAttachments', () => {
    it('returns mapped attachments', async () => {
      vi.mocked(apiListEmailAttachments).mockResolvedValue(
        makeOk([
          {
            id: 'att-1',
            filename: 'report.pdf',
            originalName: 'Annual Report.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
          },
        ]),
      );

      const result = await service.listAttachments(ACCOUNT_ID, 'e-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('att-1');
      expect(result[0].filename).toBe('report.pdf');
      expect(result[0].mimeType).toBe('application/pdf');
    });
  });

  describe('deleteAttachment', () => {
    it('resolves without error on successful delete', async () => {
      vi.mocked(apiDeleteEmailAttachment).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(service.deleteAttachment(ACCOUNT_ID, 'e-1', 'att-1')).resolves.toBeUndefined();
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(apiDeleteEmailAttachment).mockResolvedValue(makeError('Forbidden', 403));
      await expect(service.deleteAttachment(ACCOUNT_ID, 'e-1', 'att-1')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
