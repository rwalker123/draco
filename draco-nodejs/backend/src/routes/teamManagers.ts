import { Router, Request, Response } from 'express';
import { TeamManagerService } from '../services/teamManagerService';
import prisma from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, ConflictError } from '../utils/customErrors';

/**
 * @swagger
 * tags:
 *   - name: TeamManagers
 *     description: Team manager assignment endpoints
 */

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers:
 *   get:
 *     summary: List all managers for a team season
 *     tags: [TeamManagers]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: teamSeasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of managers
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       teamseasonid:
 *                         type: string
 *                       contactid:
 *                         type: string
 *                       contacts:
 *                         type: object
 *                         description: Contact info
 *       500:
 *         $ref: '#/components/responses/Error'
 *   post:
 *     summary: Add a manager to a team season
 *     tags: [TeamManagers]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: teamSeasonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactId]
 *             properties:
 *               contactId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Manager added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/Error'
 *       409:
 *         $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/Error'
 */

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers/{managerId}:
 *   delete:
 *     summary: Remove a manager from a team season
 *     tags: [TeamManagers]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: teamSeasonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         $ref: '#/components/responses/Error'
 */

const router = Router({ mergeParams: true });
const teamManagerService = new TeamManagerService(prisma);

// GET: List all managers for a team season
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    console.log('GET /managers req.params:', req.params);
    const teamSeasonId = BigInt(req.params.teamSeasonId);
    const managers = await teamManagerService.listManagers(teamSeasonId);
    res.json({ success: true, data: managers });
  }),
);

// POST: Add a manager to a team season
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const teamSeasonId = BigInt(req.params.teamSeasonId);
    const { contactId } = req.body;

    if (!contactId) {
      throw new ValidationError('contactId is required');
    }

    // Prevent duplicate
    const existing = await teamManagerService.findManager(teamSeasonId, BigInt(contactId));
    if (existing) {
      throw new ConflictError('Manager already exists for this team');
    }

    const manager = await teamManagerService.addManager(teamSeasonId, BigInt(contactId));
    res.json({ success: true, data: manager });
  }),
);

// DELETE: Remove a manager by manager id
router.delete(
  '/:managerId',
  asyncHandler(async (req: Request, res: Response) => {
    const managerId = BigInt(req.params.managerId);
    await teamManagerService.removeManager(managerId);
    res.json({ success: true });
  }),
);

export default router;
