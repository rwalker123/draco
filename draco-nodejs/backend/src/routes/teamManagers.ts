import { Router, Request, Response } from 'express';
import { TeamManagerService } from '../services/teamManagerService.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const teamManagerService = new TeamManagerService(prisma);

// GET: List all managers for a team season
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const managers = await teamManagerService.listManagers(teamSeasonId);
    res.json(managers);
  }),
);

// POST: Add a manager to a team season
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const { contactId } = req.body;

    if (!contactId) {
      throw new ValidationError('contactId is required');
    }

    const response = await teamManagerService.addManager(teamSeasonId, BigInt(contactId));
    res.json(response);
  }),
);

// DELETE: Remove a manager by manager id
router.delete(
  '/:managerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { managerId } = extractBigIntParams(req.params, 'managerId');
    await teamManagerService.removeManager(managerId);
    res.json();
  }),
);

export default router;
