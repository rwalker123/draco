import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import type { TeamManagerType } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const teamManagerService = ServiceFactory.getTeamManagerService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET: List all managers for a team season
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const managers = await teamManagerService.listManagers(teamSeasonId);
    const includeContactInfo = await routeProtection.hasPermissionForAccount(
      req,
      accountId,
      'team.managers.manage',
    );
    const response = includeContactInfo ? managers : sanitizeManagerContacts(managers);
    res.json(response);
  }),
);

// POST: Add a manager to a team season
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.managers.manage'),
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
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('team.managers.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const { managerId } = extractBigIntParams(req.params, 'managerId');
    await teamManagerService.removeManager(managerId);
    res.status(204).send();
  }),
);

const sanitizeManagerContacts = (managers: TeamManagerType[]): TeamManagerType[] => {
  return managers.map((manager) => ({
    ...manager,
    contact: {
      id: manager.contact.id,
      firstName: manager.contact.firstName,
      lastName: manager.contact.lastName,
      middleName: manager.contact.middleName,
      photoUrl: manager.contact.photoUrl,
    },
  }));
};

export default router;
