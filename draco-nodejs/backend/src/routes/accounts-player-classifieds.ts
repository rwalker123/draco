// Player Classified Routes
// Implements the layered architecture contract using shared schemas for validation

import { Router, Request, Response, NextFunction } from 'express';
import {
  ContactPlayersWantedCreatorSchema,
  UpsertPlayersWantedClassifiedSchema,
  UpsertTeamsWantedClassifiedSchema,
  PlayerClassifiedSearchQuerySchema,
  TeamsWantedAccessCodeSchema,
  TeamsWantedContactQuerySchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { teamsWantedRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractAccountParams,
  extractBigIntParams,
  ParamsObject,
} from '../utils/paramExtraction.js';
import { AuthorizationError, ValidationError } from '../utils/customErrors.js';
import { BASEBALL_POSITIONS, EXPERIENCE_LEVELS } from '../interfaces/playerClassifiedConstants.js';
import { getCleanupConfig } from '../config/cleanup.js';

const router = Router({ mergeParams: true });
const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
const routeProtection = ServiceFactory.getRouteProtection();

const extractClassifiedParams = (params: ParamsObject) => {
  const { accountId } = extractAccountParams(params);
  const { classifiedId } = extractBigIntParams(params, 'classifiedId');

  return { accountId, classifiedId };
};

const parseAccessCodeValue = (value: unknown): string => {
  const parseResult = TeamsWantedAccessCodeSchema.safeParse({ accessCode: value });

  if (!parseResult.success) {
    const [firstIssue] = parseResult.error.issues;
    throw new ValidationError(
      firstIssue?.message ?? 'Access code is required and must be between 10 and 1000 characters',
    );
  }

  return parseResult.data.accessCode;
};

const getBodyAccessCode = (req: Request): unknown => {
  if (req.body && typeof req.body === 'object') {
    return (req.body as Record<string, unknown>).accessCode;
  }

  return undefined;
};

const requireAccessCodeForRequest = (req: Request): string => {
  const candidate = req.query?.accessCode ?? getBodyAccessCode(req);

  return parseAccessCodeValue(candidate);
};

const createTeamsWantedAuthMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const hasToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');

    const fallbackToAccessCode = () => {
      try {
        requireAccessCodeForRequest(req);
        next();
      } catch (error) {
        next(error);
      }
    };

    if (!hasToken) {
      fallbackToAccessCode();
      return;
    }

    authenticateToken(req, res, (authError?: unknown) => {
      if (!authError) {
        routeProtection.enforceAccountBoundary()(req, res, (boundaryError?: unknown) => {
          if (!boundaryError) {
            routeProtection.requirePermission('player-classified.manage')(
              req,
              res,
              (permissionError?: unknown) => {
                if (!permissionError) {
                  next();
                  return;
                }

                fallbackToAccessCode();
              },
            );
            return;
          }

          fallbackToAccessCode();
        });
        return;
      }

      fallbackToAccessCode();
    });
  };
};

/**
 * POST /api/accounts/:accountId/player-classifieds/players-wanted
 * Create a new players wanted classified
 * Requires authentication and 'player-classified.create-players-wanted' permission
 */
router.post(
  '/players-wanted',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const contactId = req.accountBoundary!.contactId;
    const createRequest = UpsertPlayersWantedClassifiedSchema.omit({ id: true }).parse(req.body);

    const classified = await playerClassifiedService.createPlayersWanted(
      accountId,
      contactId,
      createRequest,
    );

    res.status(201).json(classified);
  }),
);

/**
 * POST /api/accounts/:accountId/player-classifieds/teams-wanted
 * Create a new teams wanted classified
 * Requires authentication and 'player-classified.create-teams-wanted' permission
 */
router.post(
  '/teams-wanted',
  teamsWantedRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const createRequest = UpsertTeamsWantedClassifiedSchema.omit({ accessCode: true }).parse(
      req.body,
    );

    const classified = await playerClassifiedService.createTeamsWanted(accountId, createRequest);

    res.status(201).json(classified);
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/players-wanted
 * Search for players wanted classifieds within the account
 * Publicly accessible
 */
router.get(
  '/players-wanted',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const searchQuery = PlayerClassifiedSearchQuerySchema.parse(req.query);

    const searchParams: Parameters<typeof playerClassifiedService.getPlayersWanted>[1] = {
      page: searchQuery.page,
      limit: searchQuery.limit,
      sortBy: searchQuery.sortBy,
      sortOrder: searchQuery.sortOrder,
      searchQuery: searchQuery.searchQuery,
    };

    const result = await playerClassifiedService.getPlayersWanted(accountId, searchParams);

    res.json(result);
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/teams-wanted
 * Search for teams wanted classifieds within the account
 * Publicly accessible
 */
router.get(
  '/teams-wanted',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const searchQuery = PlayerClassifiedSearchQuerySchema.parse(req.query);

    const searchParams: Parameters<typeof playerClassifiedService.getTeamsWanted>[1] = {
      page: searchQuery.page,
      limit: searchQuery.limit,
      sortBy: searchQuery.sortBy,
      sortOrder: searchQuery.sortOrder,
      searchQuery: searchQuery.searchQuery,
    };

    const result = await playerClassifiedService.getTeamsWanted(accountId, searchParams);

    res.json(result);
  }),
);

/**
 *
 * POST /api/accounts/:accountId/player-classifieds/teams-wanted/:classifiedId/verify
 * Verify access code for a teams wanted classified
 * Publicly accessible, rate limited
 */
router.post(
  '/teams-wanted/:classifiedId/verify',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = TeamsWantedAccessCodeSchema.parse(req.body ?? {});

    const classified = await playerClassifiedService.verifyTeamsWantedAccess(
      classifiedId,
      accessCode,
      accountId,
    );

    res.json(classified);
  }),
);

/**
 *
 * POST /api/accounts/:accountId/player-classifieds/teams-wanted/access-code
 * Lookup a teams wanted classified by access code
 * Publicly accessible, rate limited
 */
router.post(
  '/teams-wanted/access-code',
  teamsWantedRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { accessCode } = TeamsWantedAccessCodeSchema.parse(req.body ?? {});

    const classified = await playerClassifiedService.findTeamsWantedByAccessCode(
      accountId,
      accessCode,
    );

    res.json(classified);
  }),
);

/**
 *
 * PUT /api/accounts/:accountId/player-classifieds/teams-wanted/:classifiedId
 * Update an existing teams wanted classified
 * Requires either authentication with 'player-classified.manage' permission
 * or a valid access code for the classified
 */
router.put(
  '/teams-wanted/:classifiedId',
  createTeamsWantedAuthMiddleware(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode, ...updateRequest } = UpsertTeamsWantedClassifiedSchema.parse(
      req.body ?? {},
    );

    if (!req.user && !accessCode) {
      throw new ValidationError('Access code is required for unauthenticated requests');
    }

    const effectiveAccessCode = req.user ? '' : (accessCode ?? '');

    const classified = await playerClassifiedService.updateTeamsWanted(
      classifiedId,
      effectiveAccessCode,
      updateRequest,
      accountId,
    );

    res.json(classified);
  }),
);

/**
 *
 * PUT /api/accounts/:accountId/player-classifieds/players-wanted/:classifiedId
 * Update an existing players wanted classified
 * Requires authentication and either ownership of the classified or
 * 'player-classified.manage' permission within the account boundary
 */
router.put(
  '/players-wanted/:classifiedId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const userId = req.user!.id;
    const contactId = req.accountBoundary!.contactId;
    const updateRequest = UpsertPlayersWantedClassifiedSchema.parse(req.body ?? {});

    const canEdit = await playerClassifiedService.canEditPlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );

    if (!canEdit) {
      throw new AuthorizationError('Insufficient permissions to edit this classified');
    }

    const classified = await playerClassifiedService.updatePlayersWanted(
      classifiedId,
      accountId,
      userId,
      contactId,
      updateRequest,
    );

    res.json(classified);
  }),
);

/**
 * DELETE /api/accounts/:accountId/player-classifieds/teams-wanted/:classifiedId
 * Delete an existing teams wanted classified
 * Requires either authentication with 'player-classified.manage' permission
 * or a valid access code for the classified
 */
router.delete(
  '/teams-wanted/:classifiedId',
  createTeamsWantedAuthMiddleware(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = TeamsWantedAccessCodeSchema.partial().parse(req.body ?? {});

    if (!req.user && !accessCode) {
      throw new ValidationError('Access code is required for unauthenticated requests');
    }

    const effectiveAccessCode = req.user ? '' : (accessCode ?? '');

    await playerClassifiedService.deleteTeamsWanted(classifiedId, effectiveAccessCode, accountId);

    res.status(204).send();
  }),
);

/**
 *
 *  DELETE /api/accounts/:accountId/player-classifieds/players-wanted/:classifiedId
 * Delete an existing players wanted classified
 * Requires authentication and either ownership of the classified or
 * 'player-classified.manage' permission within the account boundary
 */
router.delete(
  '/players-wanted/:classifiedId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const userId = req.user!.id;
    const contactId = req.accountBoundary!.contactId;

    const canDelete = await playerClassifiedService.canDeletePlayersWanted(
      classifiedId,
      userId,
      contactId,
      accountId,
    );

    if (!canDelete) {
      throw new AuthorizationError('Insufficient permissions to delete this classified');
    }

    await playerClassifiedService.deletePlayersWanted(classifiedId, accountId, userId, contactId);

    res.status(204).send();
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/positions
 * Returns the list of standard baseball positions
 * Publicly accessible
 */
router.get(
  '/positions',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(BASEBALL_POSITIONS);
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/teams-wanted/:classifiedId/contact
 * Retrieve the contact information for a teams wanted classified
 * Requires either authentication with 'player-classified.manage' permission
 * or a valid access code for the classified
 */
router.get(
  '/teams-wanted/:classifiedId/contact',
  createTeamsWantedAuthMiddleware(),
  teamsWantedRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = TeamsWantedContactQuerySchema.parse(req.query);

    if (req.user) {
      const contactInfo = await playerClassifiedService.getTeamsWantedContactInfo(
        classifiedId,
        accountId,
      );
      res.json(contactInfo);
      return;
    }

    if (!accessCode) {
      throw new ValidationError('Access code is required for unauthenticated requests');
    }

    await playerClassifiedService.verifyTeamsWantedAccess(classifiedId, accessCode, accountId);
    const contactInfo = await playerClassifiedService.getTeamsWantedContactInfo(
      classifiedId,
      accountId,
    );

    res.json(contactInfo);
  }),
);

/**
 *
 * POST /api/accounts/:accountId/player-classifieds/players-wanted/:classifiedId/contact
 * Contact the creator of a players wanted classified
 * Publicly accessible, rate limited
 */
router.post(
  '/players-wanted/:classifiedId/contact',
  teamsWantedRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const contactRequest = ContactPlayersWantedCreatorSchema.parse(req.body ?? {});

    await playerClassifiedService.contactPlayersWantedCreator(
      accountId,
      classifiedId,
      contactRequest,
    );

    res.status(204).send();
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/experience-levels
 * Returns the list of standard experience levels
 * Publicly accessible
 */
router.get(
  '/experience-levels',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(EXPERIENCE_LEVELS);
  }),
);

/**
 *
 * GET /api/accounts/:accountId/player-classifieds/config
 * Returns public configuration for player classifieds
 * Publicly accessible
 */
router.get(
  '/config',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const { expirationDays } = getCleanupConfig();
    res.json({ expirationDays });
  }),
);

export default router;
