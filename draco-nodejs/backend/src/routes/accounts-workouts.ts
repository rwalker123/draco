import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
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
const service = ServiceFactory.getWorkoutService();

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
 * Workouts API routes for account-specific workout management and registrations.
 */

/**
 * GET /api/accounts/:accountId/workouts
 * Public endpoint that lists workouts with optional status and pagination filters.
 */
router.get(
  '/:accountId/workouts',
  optionalAuth,
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
 * GET /api/accounts/{accountId}/workouts/sources
 * Get the allowed where-heard options for a workout
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
 * PUT /api/accounts/{accountId}/workouts/sources
 * Update the allowed where-heard options for a workout
 */
router.put(
  '/:accountId/workouts/sources',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    await service.putSources(accountId.toString(), req.body);
    res.json({ success: true });
  }),
);

/**
 * POST /api/accounts/{accountId}/workouts/sources
 * Add a single where-heard option to the allowed options
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
 * GET /api/accounts/:accountId/workouts/:workoutId
 * Retrieves a single workout for public consumption, returning 404 when absent.
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
 * POST /api/accounts/{accountId}/workouts/:workoutId/registrations
 * Create a registration for a workout
 */
router.post(
  '/:accountId/workouts/:workoutId/registrations',
  registrationLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const r = await service.createRegistration(accountId, workoutId, req.body);
    res.status(201).json({ success: true, data: { registration: r } });
  }),
);

/**
 * PUT /api/accounts/{accountId}/workouts/:workoutId/registrations/:registrationId
 * Update a registration for a workout
 */
router.put(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const { registrationId } = extractBigIntParams(req.params, 'registrationId');
    const r = await service.updateRegistration(accountId, workoutId, registrationId, req.body);
    res.json({ success: true, data: { registration: r } });
  }),
);

/**
 * DELETE /api/accounts/{accountId}/workouts/:workoutId/registrations/:registrationId
 * Delete a registration for a workout
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
 * POST /api/accounts/{accountId}/workouts
 * Create a workout
 */
router.post(
  '/:accountId/workouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const w = await service.createWorkout(accountId, req.body);
    res.status(201).json({ success: true, data: { workout: w } });
  }),
);

/**
 * PUT /api/accounts/{accountId}/workouts/:workoutId
 * Update a workout
 */
router.put(
  '/:accountId/workouts/:workoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const w = await service.updateWorkout(accountId, workoutId, req.body);
    res.json({ success: true, data: { workout: w } });
  }),
);

/**
 * DELETE /api/accounts/:accountId/workouts/:workoutId
 * Deletes a workout when the caller has the workout.manage permission.
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
 * GET /api/accounts/:accountId/workouts/:workoutId/registrations
 * Lists registrations for a workout (requires workout.manage permission).
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
