import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  CreateGolfCourseSchema,
  UpdateGolfCourseSchema,
  CreateGolfCourseTeeSchema,
  UpdateGolfCourseTeeSchema,
  PagingSchema,
} from '@draco/shared-schemas';
import { extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const golfCourseService = ServiceFactory.getGolfCourseService();
const golfTeeService = ServiceFactory.getGolfTeeService();

const AdminCourseQuerySchema = PagingSchema.extend({
  search: z.string().optional(),
});

router.get(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search } = AdminCourseQuerySchema.parse(req.query);
    const result = await golfCourseService.getAllCoursesPaginated({
      page,
      limit,
      search,
    });
    res.json(result);
  }),
);

router.get(
  '/count',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const count = await golfCourseService.getTotalCourseCount();
    res.json({ count });
  }),
);

router.get(
  '/:courseId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const course = await golfCourseService.getCourseWithTees(courseId);
    res.json(course);
  }),
);

router.post(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const courseData = CreateGolfCourseSchema.parse(req.body);
    const course = await golfCourseService.createCourse(courseData);
    res.status(201).json(course);
  }),
);

router.put(
  '/:courseId',
  authenticateToken,
  routeProtection.requireAdministrator(),
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
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    await golfCourseService.deleteCourse(courseId);
    res.status(204).send();
  }),
);

router.post(
  '/:courseId/tees',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const teeData = CreateGolfCourseTeeSchema.parse(req.body);
    const tee = await golfTeeService.createTee(courseId, teeData);
    res.status(201).json(tee);
  }),
);

router.put(
  '/:courseId/tees/:teeId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teeId } = extractBigIntParams(req.params, 'teeId');
    const teeData = UpdateGolfCourseTeeSchema.parse(req.body);
    const tee = await golfTeeService.updateTee(teeId, teeData);
    res.json(tee);
  }),
);

router.delete(
  '/:courseId/tees/:teeId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teeId } = extractBigIntParams(req.params, 'teeId');
    await golfTeeService.deleteTee(teeId);
    res.status(204).send();
  }),
);

export default router;
