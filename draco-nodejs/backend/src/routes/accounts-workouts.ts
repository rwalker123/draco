import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  WorkoutListQuerySchema,
  WorkoutRegistrationsQuerySchema,
  UpsertWorkoutSchema,
  UpsertWorkoutRegistrationSchema,
  WorkoutSourcesSchema,
  WorkoutSourceOptionPayloadSchema,
  WorkoutRegistrationsEmailRequestSchema,
} from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const service = ServiceFactory.getWorkoutService();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  '/:accountId/workouts',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const filters = WorkoutListQuerySchema.parse(req.query);
    return service.listWorkouts(accountId, filters).then((workouts) => {
      res.json(workouts);
    });
  }),
);

router.get(
  '/:accountId/workouts/sources',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    return service.getSources(accountId.toString()).then((sources) => {
      res.json(sources);
    });
  }),
);

router.put(
  '/:accountId/workouts/sources',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const payload = WorkoutSourcesSchema.parse(req.body);
    return service.putSources(accountId.toString(), payload).then((updated) => {
      res.json(updated);
    });
  }),
);

router.post(
  '/:accountId/workouts/sources',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const payload = WorkoutSourceOptionPayloadSchema.parse(req.body);
    return service.appendSourceOption(accountId.toString(), payload.option).then((updated) => {
      res.json(updated);
    });
  }),
);

router.get(
  '/:accountId/workouts/:workoutId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    return service.getWorkout(accountId, workoutId).then((workout) => {
      res.json(workout);
    });
  }),
);

router.post(
  '/:accountId/workouts/:workoutId/registrations',
  registrationLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const payload = UpsertWorkoutRegistrationSchema.parse(req.body);
    return service.createRegistration(accountId, workoutId, payload).then((registration) => {
      res.status(201).json(registration);
    });
  }),
);

router.put(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId, registrationId } = extractBigIntParams(
      req.params,
      'workoutId',
      'registrationId',
    );
    const payload = UpsertWorkoutRegistrationSchema.parse(req.body);
    return service
      .updateRegistration(accountId, workoutId, registrationId, payload)
      .then((registration) => {
        res.json(registration);
      });
  }),
);

router.delete(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId, registrationId } = extractBigIntParams(
      req.params,
      'workoutId',
      'registrationId',
    );
    await service.deleteRegistration(accountId, workoutId, registrationId);

    res.status(204).send();
  }),
);

router.post(
  '/:accountId/workouts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const payload = UpsertWorkoutSchema.parse(req.body);
    return service.createWorkout(accountId, payload).then((workout) => {
      res.status(201).json(workout);
    });
  }),
);

router.put(
  '/:accountId/workouts/:workoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const payload = UpsertWorkoutSchema.parse(req.body);
    return service.updateWorkout(accountId, workoutId, payload).then((workout) => {
      res.json(workout);
    });
  }),
);

router.delete(
  '/:accountId/workouts/:workoutId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    await service.deleteWorkout(accountId, workoutId);

    res.status(204).send();
  }),
);

router.get(
  '/:accountId/workouts/:workoutId/registrations',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const query = WorkoutRegistrationsQuerySchema.parse(req.query);
    return service.listRegistrations(accountId, workoutId, query.limit).then((registrations) => {
      res.json(registrations);
    });
  }),
);

router.post(
  '/:accountId/workouts/:workoutId/registrations/email',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('workout.manage'),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const payload = WorkoutRegistrationsEmailRequestSchema.parse(req.body);

    await service.emailRegistrants(accountId, workoutId, payload);

    res.status(202).json({ status: 'queued' });
  }),
);

export default router;
