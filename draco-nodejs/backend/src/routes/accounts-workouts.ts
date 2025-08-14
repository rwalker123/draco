import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../lib/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  validateListWorkouts,
  validateWorkoutCreate,
  validateWorkoutUpdate,
  validateRegistrationCreate,
  validateSourcesUpdate,
  validateRegistrationUpdate,
} from '../middleware/validation/workoutValidation.js';
import { WorkoutService } from '../services/workoutService.js';
import { WORKOUT_CONSTANTS } from '../utils/workoutMappers.js';
import { ListWorkoutsFilter } from '../interfaces/workoutInterfaces.js';

// Type for query parameters
interface WorkoutQueryParams {
  status?: 'upcoming' | 'past' | 'all';
  limit?: string;
  after?: string;
  before?: string;
  includeRegistrationCounts?: string;
}

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const service = new WorkoutService();

// Rate limiting for public registration endpoint
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 registration attempts per window
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   - name: Workouts
 *     description: Account workouts and registrations
 */

/**
 * @swagger
 * /api/accounts/{accountId}/workouts:
 *   get:
 *     summary: List workouts
 *     description: Public endpoint to list workouts for an account
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, past, all]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of workouts
 */
router.get(
  '/:accountId/workouts',
  optionalAuth,
  validateListWorkouts,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const includeRegistrationCounts = req.query.includeRegistrationCounts === 'true';
    const queryParams = req.query as WorkoutQueryParams;
    const filter: ListWorkoutsFilter = {
      status: queryParams.status,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      after: queryParams.after,
      before: queryParams.before,
    };
    const items = await service.listWorkouts(accountId, filter, includeRegistrationCounts);
    res.json({ success: true, data: { workouts: items } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/sources:
 *   get:
 *     summary: Get where-heard options
 *     description: Public endpoint returning the configured options for registrations
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Options
 */
router.get(
  '/:accountId/workouts/sources',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const data = await service.getSources(accountId.toString());
    res.json({ success: true, data });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/sources:
 *   put:
 *     summary: Replace where-heard options
 *     description: Admin endpoint to upsert the allowed where-heard options array
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Saved
 */
router.put(
  '/:accountId/workouts/sources',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  validateSourcesUpdate,
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    await service.putSources(accountId.toString(), req.body);
    res.json({ success: true });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/sources:
 *   post:
 *     summary: Add a single where-heard option
 *     description: Admin endpoint to append a new option to the where-heard list
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               option:
 *                 type: string
 *                 maxLength: 25
 *     responses:
 *       200:
 *         description: Option added
 *       400:
 *         description: Invalid input
 */
router.post(
  '/:accountId/workouts/sources',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { option } = req.body;
    if (!option || typeof option !== 'string' || option.trim().length === 0 || option.length > 25) {
      res.status(400).json({ success: false, message: 'Invalid option' });
      return;
    }
    const updated = await service.appendSourceOption(accountId.toString(), option);
    res.json({ success: true, data: updated });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}:
 *   get:
 *     summary: Get workout details
 *     description: Public endpoint to get a workout
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout details
 *       404:
 *         description: Workout not found
 */
router.get(
  '/:accountId/workouts/:workoutId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const w = await service.getWorkout(accountId, workoutId);
    if (!w) {
      res.status(404).json({ success: false, message: 'Workout not found' });
      return;
    }
    res.json({ success: true, data: { workout: w } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}/registrations:
 *   post:
 *     summary: Register for a workout
 *     description: Public endpoint to create a workout registration (no authentication required)
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Registration created
 */
router.post(
  '/:accountId/workouts/:workoutId/registrations',
  registrationLimiter,
  validateRegistrationCreate,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const r = await service.createRegistration(accountId, workoutId, req.body);
    res.status(201).json({ success: true, data: { registration: r } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}:
 *   put:
 *     summary: Update a registration
 *     description: Admin endpoint to update a workout registration
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutRegistrationUpdateDTO'
 *     responses:
 *       200:
 *         description: Updated registration
 */
router.put(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  validateRegistrationUpdate,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const { registrationId } = extractBigIntParams(req.params, 'registrationId');
    const r = await service.updateRegistration(accountId, workoutId, registrationId, req.body);
    res.json({ success: true, data: { registration: r } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}:
 *   delete:
 *     summary: Delete a registration
 *     description: Admin endpoint to delete a workout registration
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const { registrationId } = extractBigIntParams(req.params, 'registrationId');
    await service.deleteRegistration(accountId, workoutId, registrationId);
    res.json({ success: true });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts:
 *   post:
 *     summary: Create a workout
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Workout created
 */
router.post(
  '/:accountId/workouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  validateWorkoutCreate,
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const w = await service.createWorkout(accountId, req.body);
    res.status(201).json({ success: true, data: { workout: w } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}:
 *   put:
 *     summary: Update a workout
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/:accountId/workouts/:workoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  validateWorkoutUpdate,
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const w = await service.updateWorkout(accountId, workoutId, req.body);
    res.json({ success: true, data: { workout: w } });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}:
 *   delete:
 *     summary: Delete a workout
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete(
  '/:accountId/workouts/:workoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    await service.deleteWorkout(accountId, workoutId);
    res.json({ success: true });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/workouts/{workoutId}/registrations:
 *   get:
 *     summary: List registrations for a workout
 *     security:
 *       - bearerAuth: []
 *     tags: [Workouts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registrations
 */
router.get(
  '/:accountId/workouts/:workoutId/registrations',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    // Pass a high limit to get all registrations, or add pagination support later
    const list = await service.listRegistrations(
      accountId,
      workoutId,
      WORKOUT_CONSTANTS.MAX_REGISTRATIONS_EXPORT,
    );
    res.json({ success: true, data: list });
  }),
);

export default router;
