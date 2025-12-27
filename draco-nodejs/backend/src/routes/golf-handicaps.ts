import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfHandicapService = ServiceFactory.getGolfHandicapService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const handicaps = await golfHandicapService.getLeagueHandicaps(flightId);
    res.json(handicaps);
  }),
);

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
    const courseHandicap = parseInt(req.params.courseHandicap, 10);
    const maxScore = golfHandicapService.calculateESCMaxScore(courseHandicap);
    res.json({ courseHandicap, maxScore });
  }),
);

export default router;
