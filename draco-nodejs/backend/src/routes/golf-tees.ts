import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateGolfCourseTeeSchema, UpdateGolfCourseTeeSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });
const golfTeeService = ServiceFactory.getGolfTeeService();
const routeProtection = ServiceFactory.getRouteProtection();

const TeePrioritiesSchema = z.array(
  z.object({
    id: z.string(),
    priority: z.number().int(),
  }),
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const tees = await golfTeeService.getTeesByCourse(courseId);
    res.json(tees);
  }),
);

router.get(
  '/:teeId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teeId } = extractBigIntParams(req.params, 'teeId');
    const tee = await golfTeeService.getTeeById(teeId);
    res.json(tee);
  }),
);

router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const teeData = CreateGolfCourseTeeSchema.parse(req.body);
    const tee = await golfTeeService.createTee(courseId, teeData);
    res.status(201).json(tee);
  }),
);

router.put(
  '/:teeId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teeId } = extractBigIntParams(req.params, 'teeId');
    const teeData = UpdateGolfCourseTeeSchema.parse(req.body);
    const tee = await golfTeeService.updateTee(teeId, teeData);
    res.json(tee);
  }),
);

router.delete(
  '/:teeId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teeId } = extractBigIntParams(req.params, 'teeId');
    await golfTeeService.deleteTee(teeId);
    res.status(204).send();
  }),
);

router.put(
  '/priorities',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = extractBigIntParams(req.params, 'courseId');
    const teePriorities = TeePrioritiesSchema.parse(req.body);
    await golfTeeService.updateTeePriorities(courseId, teePriorities);
    res.status(204).send();
  }),
);

export default router;
