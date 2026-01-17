import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams, getStringParam } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { BatchCourseHandicapRequestSchema } from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const golfHandicapService = ServiceFactory.getGolfHandicapService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/player/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId } = extractBigIntParams(req.params, 'contactId');
    const includeDetails = req.query.details === 'true';
    const handicap = await golfHandicapService.getPlayerHandicap(contactId, includeDetails);
    res.json(handicap);
  }),
);

router.get(
  '/player/:contactId/course-handicap',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId } = extractBigIntParams(req.params, 'contactId');
    const slopeRating = parseInt(req.query.slope as string, 10) || 113;
    const courseRating = parseFloat(req.query.rating as string) || 72;
    const par = parseInt(req.query.par as string, 10) || 72;

    const handicapIndex = await golfHandicapService.calculateHandicapIndex(contactId);
    if (handicapIndex === null) {
      res.json({
        handicapIndex: null,
        courseRating,
        slopeRating,
        par,
        courseHandicap: null,
      });
      return;
    }

    const courseHandicap = golfHandicapService.calculateCourseHandicap(
      handicapIndex,
      slopeRating,
      courseRating,
      par,
    );
    res.json(courseHandicap);
  }),
);

router.get(
  '/esc/:courseHandicap',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const courseHandicap = parseInt(getStringParam(req.params.courseHandicap) || '', 10);
    const maxScore = golfHandicapService.calculateESCMaxScore(courseHandicap);
    res.json({ courseHandicap, maxScore });
  }),
);

router.post(
  '/batch-course-handicaps',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = BatchCourseHandicapRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.issues[0]?.message || 'Invalid request body');
    }

    const { golferIds, teeId, holesPlayed } = parseResult.data;
    const golferIdsBigInt = golferIds.map((id) => BigInt(id));
    const teeIdBigInt = BigInt(teeId);

    const result = await golfHandicapService.calculateBatchCourseHandicaps(
      golferIdsBigInt,
      teeIdBigInt,
      holesPlayed,
    );
    res.json(result);
  }),
);

export default router;
