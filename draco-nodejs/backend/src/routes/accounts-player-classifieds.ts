// PlayerClassifieds Routes for Draco Sports Manager
// Handles all classified-related operations including CRUD, matching, and notifications

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { teamsWantedRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../lib/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedSearchParams,
} from '../interfaces/playerClassifiedInterfaces.js';
import {
  validatePlayersWantedCreate,
  validateTeamsWantedCreate,
  validateTeamsWantedUpdateEndpoint,
  validateTeamsWantedVerification,
  validateTeamsWantedDeletion,
  validatePlayersWantedDeletion,
  validateSearchParams,
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

  return { accountId, classifiedId: BigInt(classifiedId) };
};

// Helper function to validate sortBy parameter
const validateSortBy = (sortBy: string): 'dateCreated' | 'relevance' => {
  const validSortFields: Array<'dateCreated' | 'relevance'> = ['dateCreated', 'relevance'];

  if (validSortFields.includes(sortBy as 'dateCreated' | 'relevance')) {
    return sortBy as 'dateCreated' | 'relevance';
  }

  return 'dateCreated';
};

/**
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/players-wanted:
 *   post:
 *     summary: Create a new Players Wanted classified
 *     description: Allows team admins to post "Players Wanted" ads
 *     tags: [PlayerClassifieds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamEventName
 *               - description
 *               - positionsNeeded
 *             properties:
 *               teamEventName:
 *                 type: string
 *                 maxLength: 50
 *                 description: Name of the team event or team
 *               description:
 *                 type: string
 *                 description: Detailed description of what's needed
 *               positionsNeeded:
 *                 type: string
 *                 maxLength: 50
 *                 description: Comma-separated list of position IDs needed
 *     responses:
 *       201:
 *         description: Players Wanted classified created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IPlayersWantedResponse'
 *       400:
 *         description: Validation error or invalid input
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       429:
 *         description: Rate limit exceeded
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/teams-wanted:
 *   post:
 *     summary: Create a new Teams Wanted classified
 *     description: Allows players to post "Teams Wanted" ads (public endpoint)
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - experience
 *               - positionsPlayed
 *               - birthDate

 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Player's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Player's email address
 *               phone:
 *                 type: string
 *                 description: Player's phone number
 *               experience:
 *                 type: string
 *                 description: Description of player's experience
 *               positionsPlayed:
 *                 type: string
 *                 maxLength: 50
 *                 description: Comma-separated list of position IDs played
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Player's birth date (must be 13-80 years old)

 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 description: Optional expiration date (max 120 days)
 *     responses:
 *       201:
 *         description: Teams Wanted classified created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ITeamsWantedOwnerResponse'
 *                 message:
 *                   type: string
 *                   description: Instructions for accessing the classified
 *       400:
 *         description: Validation error or invalid input
 *       429:
 *         description: Rate limit exceeded
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/players-wanted:
 *   get:
 *     summary: Get Players Wanted classifieds
 *     description: Retrieve Players Wanted classifieds with pagination and filtering
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [dateCreated]
 *           default: dateCreated
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search query for filtering
 *     responses:
 *       200:
 *         description: Players Wanted classifieds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPlayersWantedResponse'
 *                 total:
 *                   type: integer
 *                 pagination:
 *                   $ref: '#/components/schemas/IPaginationMeta'
 *                 filters:
 *                   $ref: '#/components/schemas/IClassifiedSearchFilters'
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/teams-wanted:
 *   get:
 *     summary: Get Teams Wanted classifieds (public)
 *     description: Retrieve Teams Wanted classifieds for public viewing
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [dateCreated]
 *           default: dateCreated
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search query for filtering
 *     responses:
 *       200:
 *         description: Teams Wanted classifieds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ITeamsWantedResponse'
 *                 total:
 *                   type: integer
 *                 pagination:
 *                   $ref: '#/components/schemas/IPaginationMeta'
 *                 filters:
 *                   $ref: '#/components/schemas/IClassifiedSearchFilters'
 */
router.get(
  '/teams-wanted',
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/verify:
 *   post:
 *     summary: Verify Teams Wanted classified access
 *     description: Verify access code to manage a Teams Wanted classified
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: classifiedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Classified ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessCode
 *             properties:
 *               accessCode:
 *                 type: string
 *                 description: Access code received via email
 *     responses:
 *       200:
 *         description: Access verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ITeamsWantedOwnerResponse'
 *       400:
 *         description: Invalid access code
 *       404:
 *         description: Classified not found
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}:
 *   put:
 *     summary: Update Teams Wanted classified
 *     description: Update a Teams Wanted classified using access code
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: classifiedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Classified ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessCode
 *             properties:
 *               accessCode:
 *                 type: string
 *                 description: Access code for verification
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Player's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Player's email address
 *               phone:
 *                 type: string
 *                 description: Player's phone number
 *               experience:
 *                 type: string
 *                 description: Description of player's experience
 *               positionsPlayed:
 *                 type: string
 *                 maxLength: 50
 *                 description: Comma-separated list of position IDs played
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Player's birth date
 *     responses:
 *       200:
 *         description: Teams Wanted classified updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ITeamsWantedOwnerResponse'
 *       400:
 *         description: Validation error or invalid access code
 *       404:
 *         description: Classified not found
 */
router.put(
  '/teams-wanted/:classifiedId',
  ...validateTeamsWantedUpdateEndpoint,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode, ...updateData } = req.body;

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
    const result = await playerClassifiedService.updateTeamsWanted(
      classifiedId,
      accessCode,
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}:
 *   delete:
 *     summary: Delete Teams Wanted classified
 *     description: Delete a Teams Wanted classified using access code
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: classifiedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Classified ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessCode
 *             properties:
 *               accessCode:
 *                 type: string
 *                 description: Access code for verification
 *     responses:
 *       200:
 *         description: Teams Wanted classified deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid access code
 *       404:
 *         description: Classified not found
 */
router.delete(
  '/teams-wanted/:classifiedId',
  ...validateTeamsWantedDeletion,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, classifiedId } = extractClassifiedParams(req.params);
    const { accessCode } = req.body;

    const playerClassifiedService = ServiceFactory.getPlayerClassifiedService();
    await playerClassifiedService.deleteTeamsWanted(classifiedId, accessCode, accountId);

    res.json({
      success: true,
      message: 'Teams Wanted classified deleted successfully',
    });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}:
 *   delete:
 *     summary: Delete Players Wanted classified
 *     description: Delete a Players Wanted classified (requires account management permission)
 *     tags: [PlayerClassifieds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: path
 *         name: classifiedId
 *         required: true
 *         schema:
 *           type: string
 *         description: Classified ID
 *     responses:
 *       200:
 *         description: Players Wanted classified deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Classified not found
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
    await playerClassifiedService.deletePlayersWanted(classifiedId, accountId, contactId);

    res.json({
      success: true,
      message: 'Players Wanted classified deleted successfully',
    });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/positions:
 *   get:
 *     summary: Get available baseball positions
 *     description: Retrieve list of available baseball positions for classifieds
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Baseball positions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IBaseballPosition'
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
 * @swagger
 * /api/accounts/{accountId}/player-classifieds/experience-levels:
 *   get:
 *     summary: Get available experience levels
 *     description: Retrieve list of available experience levels for classifieds
 *     tags: [PlayerClassifieds]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Experience levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IExperienceLevel'
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
