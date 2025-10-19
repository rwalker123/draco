import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import type { Express, Request, Response, NextFunction } from 'express';
import type { PhotoSubmissionDetailType, PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { PhotoSubmissionNotificationError } from '../../utils/customErrors.js';

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'user-1', username: 'tester' };
    next();
  },
  optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

let accountBoundaryContactId: bigint = 2n;

const createRouteProtectionMock = () => {
  const passThrough = () => (_req: Request, _res: Response, next: NextFunction) => next();

  const enforceAccountBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    const accountParam = req.params.accountId ? BigInt(req.params.accountId) : 1n;
    req.accountBoundary = {
      accountId: accountParam,
      contactId: accountBoundaryContactId,
      enforced: true,
    };
    req.user = req.user ?? { id: 'user-1', username: 'tester' };
    next();
  };

  const enforceTeamBoundary = () => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.accountBoundary) {
      req.accountBoundary = { accountId: 1n, contactId: 2n, enforced: true };
    }
    next();
  };

  return {
    enforceAccountBoundary,
    enforceAccountOwner: passThrough,
    requirePermission: () => passThrough(),
    requireAdministrator: passThrough,
    requireAccountAdmin: passThrough,
    requireAccountPhotoAdmin: passThrough,
    requireTeamAdmin: passThrough,
    requireTeamPhotoAdmin: passThrough,
    requireLeagueAdmin: passThrough,
    enforceTeamBoundary,
    enforceLeagueBoundary: passThrough,
    requireRole: () => passThrough(),
    requireAuth: passThrough,
    requirePollManagerAccess: passThrough,
  };
};

describe('Photo submission routes', () => {
  let app: Express;
  const createSubmissionMock = vi.fn();
  const deleteSubmissionMock = vi.fn();
  const getSubmissionDetailMock = vi.fn();
  const stageAssetsMock = vi.fn();
  const ensureContactIsOnTeamMock = vi.fn();
  const cleanupServiceMock = { start: vi.fn() };
  const moderationServiceMock = {
    listAccountPending: vi.fn(),
    listTeamPending: vi.fn(),
    approveSubmission: vi.fn(),
    denySubmission: vi.fn(),
  };
  const notificationServiceMock = {
    sendSubmissionReceivedNotification: vi.fn(),
  };

  const createSubmissionRecord = (
    overrides: Partial<PhotoSubmissionRecordType> = {},
  ): PhotoSubmissionRecordType => ({
    id: '10',
    accountId: '1',
    teamId: overrides.teamId ?? null,
    albumId: overrides.albumId ?? '5',
    submitterContactId: '2',
    moderatedByContactId: null,
    approvedPhotoId: null,
    title: 'Test Photo',
    caption: overrides.caption ?? 'Caption',
    originalFileName: 'photo.jpg',
    originalFilePath: '1/photo-submissions/key/original.jpg',
    primaryImagePath: '1/photo-submissions/key/primary.jpg',
    thumbnailImagePath: '1/photo-submissions/key/thumbnail.jpg',
    status: 'Pending',
    denialReason: null,
    submittedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    moderatedAt: null,
    ...overrides,
  });

  const createSubmissionDetail = (
    overrides: Partial<PhotoSubmissionDetailType> = {},
  ): PhotoSubmissionDetailType => ({
    ...createSubmissionRecord(),
    accountName: 'Demo Account',
    album: { id: '5', title: 'Album', teamId: null },
    approvedPhoto: null,
    submitter: { id: '2', firstName: 'Test', lastName: 'User', email: 'test@example.com' },
    moderator: null,
    ...overrides,
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = 'jwt-key-placeholder'; // pragma: allowlist secret
    process.env.FRONTEND_URL = 'http://localhost:3000';

    vi.spyOn(ServiceFactory, 'getCleanupService').mockReturnValue(cleanupServiceMock as never);
    vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue(
      createRouteProtectionMock() as never,
    );
    vi.spyOn(ServiceFactory, 'getPhotoSubmissionService').mockReturnValue({
      createSubmission: createSubmissionMock,
      deleteSubmission: deleteSubmissionMock,
      getSubmissionDetail: getSubmissionDetailMock,
    } as never);
    vi.spyOn(ServiceFactory, 'getPhotoSubmissionAssetService').mockReturnValue({
      stageSubmissionAssets: stageAssetsMock,
    } as never);
    vi.spyOn(ServiceFactory, 'getTeamService').mockReturnValue({
      ensureContactIsOnTeam: ensureContactIsOnTeamMock,
    } as never);
    vi.spyOn(ServiceFactory, 'getPhotoSubmissionModerationService').mockReturnValue(
      moderationServiceMock as never,
    );
    vi.spyOn(ServiceFactory, 'getPhotoSubmissionNotificationService').mockReturnValue(
      notificationServiceMock as never,
    );

    const module = await import('../../app.js');
    app = module.default;
  });

  beforeEach(() => {
    accountBoundaryContactId = 2n;
    createSubmissionMock.mockReset();
    deleteSubmissionMock.mockReset();
    getSubmissionDetailMock.mockReset();
    stageAssetsMock.mockReset();
    ensureContactIsOnTeamMock.mockReset();
    moderationServiceMock.listAccountPending.mockReset();
    moderationServiceMock.listTeamPending.mockReset();
    moderationServiceMock.approveSubmission.mockReset();
    moderationServiceMock.denySubmission.mockReset();
    notificationServiceMock.sendSubmissionReceivedNotification.mockReset();
    notificationServiceMock.sendSubmissionReceivedNotification.mockResolvedValue(true);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('creates an account photo submission', async () => {
    const record = createSubmissionRecord();
    createSubmissionMock.mockResolvedValue(record);
    stageAssetsMock.mockResolvedValue(undefined);
    const detail = createSubmissionDetail();
    getSubmissionDetailMock.mockResolvedValue(detail);
    notificationServiceMock.sendSubmissionReceivedNotification.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions')
      .field('title', 'Tournament Win')
      .field('caption', 'Great shot')
      .field('albumId', '5')
      .attach('photo', Buffer.from([1, 2, 3, 4]), 'photo.jpg');

    expect(response.status).toBe(201);
    expect(createSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: '1',
        submitterContactId: '2',
        albumId: '5',
        teamId: null,
        originalFileName: 'photo.jpg',
      }),
    );
    expect(stageAssetsMock).toHaveBeenCalledWith(record, expect.any(Buffer));
    expect(deleteSubmissionMock).not.toHaveBeenCalled();
    expect(getSubmissionDetailMock).toHaveBeenCalledWith(1n, 10n);
    expect(notificationServiceMock.sendSubmissionReceivedNotification).toHaveBeenCalledWith(detail);
    expect(response.body.id).toBe('10');
    expect(response.body.accountId).toBe('1');
  });

  it('creates a team photo submission', async () => {
    const record = createSubmissionRecord({ teamId: '2', albumId: '9' });
    createSubmissionMock.mockResolvedValue(record);
    stageAssetsMock.mockResolvedValue(undefined);
    const teamDetail = createSubmissionDetail({
      teamId: '2',
      album: { id: '9', title: 'Album', teamId: '2' },
    });
    getSubmissionDetailMock.mockResolvedValue(teamDetail);
    notificationServiceMock.sendSubmissionReceivedNotification.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/accounts/1/teams/2/photo-submissions')
      .field('title', 'Championship Banner')
      .field('albumId', '9')
      .attach('photo', Buffer.from([5, 6, 7, 8]), 'banner.png');

    expect(response.status).toBe(201);
    expect(ensureContactIsOnTeamMock).toHaveBeenCalledWith(1n, 2n, 2n);
    expect(createSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: '1',
        submitterContactId: '2',
        teamId: '2',
        albumId: '9',
        originalFileName: 'banner.png',
      }),
    );
    expect(getSubmissionDetailMock).toHaveBeenCalledWith(1n, 10n);
    expect(notificationServiceMock.sendSubmissionReceivedNotification).toHaveBeenCalledWith(
      teamDetail,
    );
  });

  it('returns team approval detail with warning header when notification email fails', async () => {
    const detail = createSubmissionDetail({ teamId: '2' });
    moderationServiceMock.approveSubmission.mockRejectedValue(
      new PhotoSubmissionNotificationError('moderation-approved', undefined, detail),
    );

    const response = await request(app)
      .post('/api/accounts/1/teams/2/photo-submissions/10/approve')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.headers['x-photo-email-warning']).toBe('moderation-approved');
    expect(response.body.id).toBe(detail.id);
  });

  it('returns team denial detail with warning header when notification email fails', async () => {
    const detail = createSubmissionDetail({ teamId: '2' });
    moderationServiceMock.denySubmission.mockRejectedValue(
      new PhotoSubmissionNotificationError('moderation-denied', undefined, detail),
    );

    const response = await request(app)
      .post('/api/accounts/1/teams/2/photo-submissions/10/deny')
      .send({ denialReason: 'Not appropriate' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.headers['x-photo-email-warning']).toBe('moderation-denied');
    expect(response.body.id).toBe(detail.id);
  });

  it('sets email warning header when confirmation email fails', async () => {
    const record = createSubmissionRecord();
    createSubmissionMock.mockResolvedValue(record);
    stageAssetsMock.mockResolvedValue(undefined);
    const detail = createSubmissionDetail();
    getSubmissionDetailMock.mockResolvedValue(detail);
    notificationServiceMock.sendSubmissionReceivedNotification.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions')
      .field('title', 'Tournament Win')
      .attach('photo', Buffer.from([1, 2, 3, 4]), 'photo.jpg');

    expect(response.status).toBe(201);
    expect(response.headers['x-photo-email-warning']).toBe('submission-received');
  });

  it('cleans up submissions when asset staging fails', async () => {
    const record = createSubmissionRecord();
    createSubmissionMock.mockResolvedValue(record);
    stageAssetsMock.mockRejectedValue(new Error('Storage failed'));
    getSubmissionDetailMock.mockResolvedValue(createSubmissionDetail());

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions')
      .field('title', 'Broken upload')
      .field('albumId', '5')
      .attach('photo', Buffer.from([9, 10, 11]), 'photo.jpg');

    expect(response.status).toBe(500);
    expect(deleteSubmissionMock).toHaveBeenCalledWith(1n, 10n);
    expect(getSubmissionDetailMock).not.toHaveBeenCalled();
    expect(notificationServiceMock.sendSubmissionReceivedNotification).not.toHaveBeenCalled();
  });

  it('rejects submission creation when submitter contact is missing', async () => {
    accountBoundaryContactId = 0n;
    const response = await request(app)
      .post('/api/accounts/1/photo-submissions')
      .field('title', 'Tournament Win')
      .attach('photo', Buffer.from([1, 2, 3, 4]), 'photo.jpg');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Authenticated contact is required to submit photos');
    expect(createSubmissionMock).not.toHaveBeenCalled();
  });

  it('lists pending account submissions', async () => {
    moderationServiceMock.listAccountPending.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/accounts/1/photo-submissions/pending')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.submissions).toEqual([]);
    expect(moderationServiceMock.listAccountPending).toHaveBeenCalledWith(1n);
  });

  it('approves a submission through the moderation endpoint', async () => {
    const detail = createSubmissionDetail();
    moderationServiceMock.approveSubmission.mockResolvedValue(detail);

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/approve')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(moderationServiceMock.approveSubmission).toHaveBeenCalledWith(1n, 10n, 2n);
  });

  it('returns approval detail with warning header when notification email fails', async () => {
    const detail = createSubmissionDetail();
    moderationServiceMock.approveSubmission.mockRejectedValue(
      new PhotoSubmissionNotificationError('moderation-approved', undefined, detail),
    );

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/approve')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.headers['x-photo-email-warning']).toBe('moderation-approved');
    expect(response.body.id).toBe(detail.id);
  });

  it('returns validation error when approval fails', async () => {
    const validationError = Object.assign(
      new Error('Album has reached the maximum number of photos'),
      { name: 'ValidationError' },
    );
    moderationServiceMock.approveSubmission.mockRejectedValue(validationError);

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/approve')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Album has reached the maximum number of photos');
  });

  it('returns validation error when moderator contact is missing on approval', async () => {
    accountBoundaryContactId = 0n;

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/approve')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Authenticated moderator contact is required for this action',
    );
    expect(moderationServiceMock.approveSubmission).not.toHaveBeenCalled();
  });

  it('denies a submission through the moderation endpoint', async () => {
    const detail = createSubmissionDetail();
    moderationServiceMock.denySubmission.mockResolvedValue(detail);

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/deny')
      .send({ denialReason: 'Not appropriate' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(moderationServiceMock.denySubmission).toHaveBeenCalledWith(
      1n,
      10n,
      2n,
      'Not appropriate',
    );
  });

  it('returns denial detail with warning header when notification email fails', async () => {
    const detail = createSubmissionDetail();
    moderationServiceMock.denySubmission.mockRejectedValue(
      new PhotoSubmissionNotificationError('moderation-denied', undefined, detail),
    );

    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/deny')
      .send({ denialReason: 'Not appropriate' })
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.headers['x-photo-email-warning']).toBe('moderation-denied');
    expect(response.body.id).toBe(detail.id);
  });

  it('returns validation error when denial reason is missing', async () => {
    const response = await request(app)
      .post('/api/accounts/1/photo-submissions/10/deny')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Denial reason is required');
    expect(moderationServiceMock.denySubmission).not.toHaveBeenCalled();
  });
});
