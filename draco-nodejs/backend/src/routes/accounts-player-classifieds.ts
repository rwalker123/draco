// PlayerClassifieds Routes for Draco Sports Manager
// Handles all classified-related operations including CRUD, matching, and notifications

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { teamsWantedRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../lib/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedSearchParams,
  IPlayersWantedUpdateRequest,
} from '../interfaces/playerClassifiedInterfaces.js';
import {
  validatePlayersWantedCreate,
  validateTeamsWantedCreate,
  validateTeamsWantedVerification,
  validatePlayersWantedDeletion,
  validateSearchParams,
  validateAccountId,
  validateClassifiedId,
} from '../middleware/validation/playerClassifiedValidation.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();

// Helper function to extract classifiedId from params
const extractClassifiedParams = (params: Record<string, string | undefined>) => {
  const { accountId } = extractAccountParams(params);
  const classifiedId = params.classifiedId;

  if (!classifiedId) {
    throw new Error('Missing required parameter: classifiedId');
  }

  try {
    return { accountId, classifiedId: BigInt(classifiedId) };
  } catch (_error) {
    throw new ValidationError(`Invalid classified ID format: ${classifiedId}`);
  }
};

// Helper function to validate sortBy parameter
const validateSortBy = (sortBy: string): 'dateCreated' | 'relevance' => {
  const validSortFields: Array<'dateCreated' | 'relevance'> = ['dateCreated', 'relevance'];

  if (validSortFields.includes(sortBy as 'dateCreated' | 'relevance')) {
    return sortBy as 'dateCreated' | 'relevance';
  }

  return 'dateCreated';
};

// Helper function for Teams Wanted conditional authentication middleware
const createTeamsWantedAuthMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');

    // Helper function to validate access code
    const validateAccessCode = () => {
      const { body } = req;
      const { accessCode } = body;

      if (
        !accessCode ||
        typeof accessCode !== 'string' ||
        accessCode.trim().length < 10 ||
        accessCode.trim().length > 1000
      ) {
        res.status(400).json({
          success: false,
          message: 'Access code is required and must be between 10 and 1000 characters',
        });
        return false;
      }
      return true;
    };

    if (hasToken) {
      // Try JWT authentication first
      authenticateToken(req, res, (authErr: Error | string | undefined) => {
        if (!authErr) {
          // JWT authentication successful, now check permissions
          routeProtection.enforceAccountBoundary()(
            req,
            res,
            (boundaryErr: Error | string | undefined) => {
              if (!boundaryErr) {
                // Account boundary check passed, now check manage permissions
                routeProtection.requirePermission('player-classified.manage')(
                  req,
                  res,
                  (permissionErr: Error | string | undefined) => {
                    if (!permissionErr) {
                      // Full authentication successful
                      next();
                    } else {
                      // Permission check failed, fall back to access code
                      if (validateAccessCode()) {
                        next();
                      }
                      // If access code validation fails, response is already sent
                    }
                  },
                );
              } else {
                // Account boundary check failed, fall back to access code
                if (validateAccessCode()) {
                  next();
                }
                // If access code validation fails, response is already sent
              }
            },
          );
        } else {
          // JWT authentication failed, fall back to access code
          if (validateAccessCode()) {
            next();
          }
          // If access code validation fails, response is already sent
        }
      });
    } else {
      // No token provided, validate access code
      if (validateAccessCode()) {
        next();
      }
      // If access code validation fails, response is already sent
    }
  };
};

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/createPlayersWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L434 OpenAPI Source}
 */
router.post(
  '/players-wanted',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('player-classified.create-players-wanted'),
  validatePlayersWantedCreate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const contactId = BigInt(req.user!.id);

    const request: IPlayersWantedCreateRequest = req.body;
    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    const result = await playerClassifiedService.createPlayersWanted(accountId, contactId, request);

    res.status(201).json({
      success: true,
      data: result,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/createTeamsWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L560 OpenAPI Source}
 */
router.post(
  '/teams-wanted',
  teamsWantedRateLimit, // Add IP-based rate limiting for anonymous submissions
  validateTeamsWantedCreate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const request: ITeamsWantedCreateRequest = req.body;
    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    const result = await playerClassifiedService.createTeamsWanted(accountId, request);

    res.status(201).json({
      success: true,
      data: result,
      message:
        'Teams Wanted classified created successfully. Check your email for access instructions.',
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/getPlayersWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L434 OpenAPI Source}
 */
router.get(
  '/players-wanted',
  validateSearchParams,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Parse query parameters
    const searchParams: IClassifiedSearchParams = {
      accountId,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      sortBy: validateSortBy(req.query.sortBy as string),
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      searchQuery: (req.query.searchQuery as string) || undefined,
    };

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
    const result = await playerClassifiedService.getPlayersWanted(accountId, searchParams);

    res.json({
      success: true,
      ...result,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/getTeamsWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L434 OpenAPI Source}
 */
router.get(
  '/teams-wanted',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  validateSearchParams,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Parse query parameters
    const searchParams: IClassifiedSearchParams = {
      accountId,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      sortBy: validateSortBy(req.query.sortBy as string),
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      searchQuery: (req.query.searchQuery as string) || undefined,
    };

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
    const result = await playerClassifiedService.getTeamsWanted(accountId, searchParams);

    res.json({
      success: true,
      ...result,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/verifyTeamsWantedAccess API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L701 OpenAPI Source}
 */
router.post(
  '/teams-wanted/:classifiedId/verify',
  ...validateTeamsWantedVerification,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = req.body;

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
    const result = await playerClassifiedService.verifyTeamsWantedAccess(
      classifiedId,
      accessCode,
      accountId,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * Get Teams Wanted data for users with valid access codes (unauthenticated, rate-limited)
 * This endpoint allows users to view their own Teams Wanted ad using an access code
 */
router.post(
  '/teams-wanted/access-code',
  teamsWantedRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { accessCode } = req.body;

    if (!accessCode) {
      res.status(400).json({
        success: false,
        message: 'Access code is required',
      });
      return;
    }

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    try {
      // Find the Teams Wanted entry by access code
      const result = await playerClassifiedService.findTeamsWantedByAccessCode(
        accountId,
        accessCode,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (_error) {
      res.status(404).json({
        success: false,
        message: 'Invalid access code or Teams Wanted ad not found',
      });
    }
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/updateTeamsWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-nodejs/backend/openapi.yaml#L748 OpenAPI Source}
 */
router.put(
  '/teams-wanted/:classifiedId',
  // Validate path parameters for all requests
  ...validateAccountId,
  ...validateClassifiedId,
  // Custom middleware to conditionally apply authentication or access code validation
  createTeamsWantedAuthMiddleware(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode, ...updateData } = req.body;

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    // Determine access code based on authentication status
    const isAuthenticated = !!req.user;
    const effectiveAccessCode = isAuthenticated ? '' : accessCode || '';

    const result = await playerClassifiedService.updateTeamsWanted(
      classifiedId,
      effectiveAccessCode,
      updateData,
      accountId,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/updatePlayersWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-nodejs/backend/openapi.yaml#L863 OpenAPI Source}
 */
router.put(
  '/players-wanted/:classifiedId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const contactId = BigInt(req.user!.id);

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    // Check if user can edit this classified (creator or AccountAdmin)
    const canEdit = await playerClassifiedService.canEditPlayersWanted(
      classifiedId,
      contactId,
      accountId,
    );

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: 'Forbidden - insufficient permissions to edit this classified',
      });
      return;
    }

    const updateData: IPlayersWantedUpdateRequest = req.body;
    const result = await playerClassifiedService.updatePlayersWanted(
      classifiedId,
      accountId,
      contactId,
      updateData,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/deleteTeamsWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-nodejs/backend/openapi.yaml#L748 OpenAPI Source}
 */
router.delete(
  '/teams-wanted/:classifiedId',
  // Validate path parameters for all requests
  ...validateAccountId,
  ...validateClassifiedId,
  // Custom middleware to conditionally apply authentication or access code validation
  createTeamsWantedAuthMiddleware(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = req.body;

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    // Determine access code based on authentication status
    const isAuthenticated = !!req.user;
    const effectiveAccessCode = isAuthenticated ? '' : accessCode || '';

    await playerClassifiedService.deleteTeamsWanted(classifiedId, effectiveAccessCode, accountId);

    res.json({
      success: true,
      message: 'Teams Wanted classified deleted successfully',
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/deletePlayersWanted API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L863 OpenAPI Source}
 */
router.delete(
  '/players-wanted/:classifiedId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('player-classified.manage'),
  ...validatePlayersWantedDeletion,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const contactId = BigInt(req.user!.id);

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();

    // Check if user can delete this classified (creator or AccountAdmin)
    const canDelete = await playerClassifiedService.canDeletePlayersWanted(
      classifiedId,
      contactId,
      accountId,
    );

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Forbidden - insufficient permissions to delete this classified',
      });
      return;
    }

    await playerClassifiedService.deletePlayersWanted(classifiedId, accountId, contactId);

    res.json({
      success: true,
      message: 'Players Wanted classified deleted successfully',
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/getBaseballPositions API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-playerclassified/draco-nodejs/backend/openapi.yaml#L960 OpenAPI Source}
 */
router.get(
  '/positions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { BASEBALL_POSITIONS } = await import('../interfaces/playerClassifiedConstants.js');

    res.json({
      success: true,
      data: BASEBALL_POSITIONS,
    });
  }),
);

/**
 * @see {@link https://localhost:3001/apidocs#/PlayerClassifieds/getExperienceLevels API Documentation}
 * @see {@link file:///Users/raywalker/source/draco-nodejs/backend/openapi.yaml#L987 OpenAPI Source}
 */
router.get(
  '/experience-levels',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { EXPERIENCE_LEVELS } = await import('../interfaces/playerClassifiedConstants.js');

    res.json({
      success: true,
      data: EXPERIENCE_LEVELS,
    });
  }),
);

export default router;
