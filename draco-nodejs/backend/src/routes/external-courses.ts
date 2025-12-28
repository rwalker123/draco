import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { ExternalCourseSearchQuerySchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const externalCourseSearchService = ServiceFactory.getExternalCourseSearchService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/search',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const searchParams = ExternalCourseSearchQuerySchema.parse(req.query);
    const results = await externalCourseSearchService.searchCourses(searchParams);
    res.json(results);
  }),
);

router.get(
  '/:externalId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { externalId } = req.params;
    const course = await externalCourseSearchService.getCourseDetails(externalId);
    res.json(course);
  }),
);

export default router;
