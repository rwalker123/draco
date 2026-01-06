import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  ExternalCourseSearchQuerySchema,
  ExternalCourseSearchResultType,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const externalCourseSearchService = ServiceFactory.getExternalCourseSearchService();
const golfCourseService = ServiceFactory.getGolfCourseService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/search',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const searchParams = ExternalCourseSearchQuerySchema.parse(req.query);

    const [customCourses, externalResults] = await Promise.all([
      golfCourseService.searchCustomCourses(
        searchParams.query,
        searchParams.excludeLeague ? accountId : undefined,
      ),
      externalCourseSearchService.searchCourses(searchParams),
    ]);

    const results: ExternalCourseSearchResultType[] = [...customCourses, ...externalResults];

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
