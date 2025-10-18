import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import { PhotoSubmissionNotificationService } from '../photoSubmissionNotificationService.js';

const createDetail = (
  overrides: Partial<PhotoSubmissionDetailType> = {},
): PhotoSubmissionDetailType => ({
  id: '10',
  accountId: '1',
  teamId: null,
  albumId: null,
  submitterContactId: '5',
  moderatedByContactId: null,
  approvedPhotoId: null,
  title: 'Summer Tournament',
  caption: 'Winning shot',
  originalFileName: 'photo.jpg',
  originalFilePath: 'Uploads/Accounts/1/PhotoSubmissions/key/original.jpg',
  primaryImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/primary.jpg',
  thumbnailImagePath: 'Uploads/Accounts/1/PhotoSubmissions/key/thumbnail.jpg',
  status: 'Pending',
  denialReason: null,
  submittedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
  moderatedAt: null,
  accountName: 'Example Account',
  album: { id: '2', title: 'Main Album', teamId: null },
  approvedPhoto: null,
  submitter: { id: '5', firstName: 'Sam', lastName: 'Submitter', email: 'sam@example.com' },
  moderator: null,
  ...overrides,
});

describe('PhotoSubmissionNotificationService', () => {
  const sendEmailMock = vi.fn();
  const providerMock = {
    sendEmail: sendEmailMock,
    testConnection: vi.fn(),
  };

  const getProvider = vi.fn(async () => providerMock);
  const getEmailSettings = vi.fn(() => ({
    provider: 'ethereal' as const,
    fromEmail: 'noreply@example.com',
    fromName: 'Draco Sports Manager',
    replyTo: 'support@example.com',
  }));
  const getBaseUrl = vi.fn(() => 'http://localhost:3000');

  let service: PhotoSubmissionNotificationService;

  beforeEach(() => {
    sendEmailMock.mockReset().mockResolvedValue({ success: true });
    getProvider.mockClear();
    getEmailSettings.mockClear();
    getBaseUrl.mockClear();
    service = new PhotoSubmissionNotificationService(getProvider, getEmailSettings, getBaseUrl);
  });

  it('sends submission received email with gallery link', async () => {
    const detail = createDetail();

    await service.sendSubmissionReceivedNotification(detail);

    expect(getProvider).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();
    const options = sendEmailMock.mock.calls[0][0];
    expect(options.subject).toContain('pending review');
    expect(options.html).toContain('Summer Tournament');
    expect(options.html).toContain('Example Account');
    expect(options.html).toContain('View gallery');
    expect(options.text).toContain('View gallery: http://localhost:3000/account/1/photos');
  });

  it('sends approval email including moderator details', async () => {
    const moderatedDetail = createDetail({
      status: 'Approved',
      moderatedAt: new Date('2024-01-01T13:00:00Z').toISOString(),
      moderator: { id: '7', firstName: 'Mia', lastName: 'Moderator', email: 'mia@example.com' },
    });

    await service.sendSubmissionApprovedNotification(moderatedDetail);

    expect(sendEmailMock).toHaveBeenCalled();
    const options = sendEmailMock.mock.calls[0][0];
    expect(options.subject).toContain('was approved');
    expect(options.html).toContain('Mia Moderator');
    expect(options.text).toContain('Great news! Your photo submission is now live');
  });

  it('sends denial email with provided reason', async () => {
    const deniedDetail = createDetail({
      status: 'Denied',
      moderatedAt: new Date('2024-01-02T09:30:00Z').toISOString(),
      denialReason: 'Photo is blurry',
      moderator: { id: '7', firstName: 'Mia', lastName: 'Moderator', email: 'mia@example.com' },
    });

    await service.sendSubmissionDeniedNotification(deniedDetail);

    expect(sendEmailMock).toHaveBeenCalled();
    const options = sendEmailMock.mock.calls[0][0];
    expect(options.subject).toContain('was denied');
    expect(options.html).toContain('Photo is blurry');
    expect(options.text).toContain('Reason provided: Photo is blurry');
  });

  it('skips sending when submitter email is missing', async () => {
    const detail = createDetail({
      submitter: { id: '5', firstName: 'Sam', lastName: 'Submitter', email: null },
    });

    await service.sendSubmissionReceivedNotification(detail);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
