import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { AdminUserListQuerySchema } from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';
import { getStringParam } from '../utils/paramExtraction.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const adminUserService = ServiceFactory.getAdminUserService();

/**
 * GET /api/admin/users
 * List aspnetusers rows for global Administrator login management.
 */
router.get(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const query = AdminUserListQuerySchema.parse(req.query);
    const result = await adminUserService.listUsers(query);
    res.json(result);
  }),
);

/**
 * DELETE /api/admin/users/:userId
 * Delete an aspnetusers row. Refused with 409 when contacts.userid still
 * references the user.
 */
router.delete(
  '/:userId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getStringParam(req.params.userId)?.trim();
    if (!userId) {
      throw new ValidationError('userId is required');
    }
    await adminUserService.deleteUser(userId);
    res.status(204).send();
  }),
);

export default router;
