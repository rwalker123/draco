import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  CreateGolfCourseSchema,
  UpdateGolfCourseSchema,
  AddLeagueCourseSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfCourseService = ServiceFactory.getGolfCourseService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/league-courses',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const leagueCourses = await golfCourseService.getLeagueCourses(accountId);
    res.json(leagueCourses);
  }),
);

router.get(
  '/:courseId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const course = await golfCourseService.getCourseWithTees(courseId);
    res.json(course);
  }),
);

router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const courseData = CreateGolfCourseSchema.parse(req.body);
    const course = await golfCourseService.createCourse(courseData);
    res.status(201).json(course);
  }),
);

router.put(
  '/:courseId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const courseData = UpdateGolfCourseSchema.parse(req.body);
    const course = await golfCourseService.updateCourse(courseId, courseData);
    res.json(course);
  }),
);

router.delete(
  '/:courseId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    await golfCourseService.deleteCourse(courseId);
    res.status(204).send();
  }),
);

router.post(
  '/league-courses',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const leagueCourseData = AddLeagueCourseSchema.parse(req.body);
    await golfCourseService.addLeagueCourse(accountId, leagueCourseData);
    res.status(201).send();
  }),
);

router.delete(
  '/league-courses/:courseId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    await golfCourseService.removeLeagueCourse(accountId, courseId);
    res.status(204).send();
  }),
);

export default router;
