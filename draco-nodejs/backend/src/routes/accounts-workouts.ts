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
  WorkoutRegistrationAccessCodeSchema,
} from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const service = ServiceFactory.getWorkoutService();

const rateLimitHandler: NonNullable<Parameters<typeof rateLimit>[0]>['handler'] = (req, res) => {
  const rateLimitInfo = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit;
  const retryMs =
    typeof rateLimitInfo?.resetTime?.getTime === 'function'
      ? Math.max(rateLimitInfo.resetTime.getTime() - Date.now(), 0)
      : undefined;
  const retrySeconds = retryMs ? Math.ceil(retryMs / 1000) : undefined;
  res.status(429).json({
    message: retrySeconds
      ? `Too many requests. Please try again in ${retrySeconds} seconds.`
      : 'Too many requests. Please try again later.',
  });
};

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

const accessCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

const parseAccessCodeValue = (value: unknown): string => {
  const result = WorkoutRegistrationAccessCodeSchema.safeParse({ accessCode: value });

  if (!result.success) {
    const [firstIssue] = result.error.issues;
    throw new ValidationError(
      firstIssue?.message || 'Access code is required and must be between 10 and 1000 characters',
    );
  }

  return result.data.accessCode;
};

const getBodyAccessCode = (req: Request): unknown => {
  if (req.body && typeof req.body === 'object') {
    return (req.body as Record<string, unknown>).accessCode;
  }

  return undefined;
};

const requireAccessCodeForRequest = (req: Request): string => {
  const candidate = (req.query?.accessCode as unknown) ?? getBodyAccessCode(req);
  return parseAccessCodeValue(candidate);
};

const createRegistrationAuthMiddleware = () => {
  return (req: Request, res: Response, next: (err?: unknown) => void): void => {
    const authHeader = req.headers.authorization;
    const hasToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');

    const fallbackToAccessCode = () => {
      try {
        // Clear any partially authenticated user to avoid bypassing access-code checks
        // when bearer auth failed account boundary/permission requirements.
        // Access-code flows must behave as fully unauthenticated.
        (req as Request & { user?: unknown }).user = undefined;
        requireAccessCodeForRequest(req);
        next();
      } catch (error) {
        next(error);
      }
    };

    if (!hasToken) {
      fallbackToAccessCode();
      return;
    }

    authenticateToken(req, res, (authError?: unknown) => {
      if (!authError) {
        routeProtection.enforceAccountBoundary()(req, res, (boundaryError?: unknown) => {
          if (!boundaryError) {
            routeProtection.requirePermission('workout.manage')(
              req,
              res,
              (permissionError?: unknown) => {
                if (!permissionError) {
                  next();
                  return;
                }

                fallbackToAccessCode();
              },
            );
            return;
          }

          fallbackToAccessCode();
        });
        return;
      }

      fallbackToAccessCode();
    });
  };
};

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
    const { accessCode: _ignored, ...payload } = UpsertWorkoutRegistrationSchema.parse(req.body);
    return service.createRegistration(accountId, workoutId, payload).then((registration) => {
      res.status(201).json(registration);
    });
  }),
);

router.post(
  '/:accountId/workouts/:workoutId/registrations/:registrationId/verify',
  accessCodeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId, registrationId } = extractBigIntParams(
      req.params,
      'workoutId',
      'registrationId',
    );
    const { accessCode } = WorkoutRegistrationAccessCodeSchema.parse(req.body);

    const registration = await service.verifyRegistrationAccess(
      accountId,
      workoutId,
      registrationId,
      accessCode,
    );

    res.json(registration);
  }),
);

router.post(
  '/:accountId/workouts/:workoutId/registrations/access-code',
  accessCodeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId } = extractBigIntParams(req.params, 'workoutId');
    const { accessCode } = WorkoutRegistrationAccessCodeSchema.parse(req.body);

    const registration = await service.findRegistrationByAccessCode(
      accountId,
      workoutId,
      accessCode,
    );

    res.json(registration);
  }),
);

router.put(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  createRegistrationAuthMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId, registrationId } = extractBigIntParams(
      req.params,
      'workoutId',
      'registrationId',
    );
    const payload = UpsertWorkoutRegistrationSchema.parse(req.body);

    if (!req.user && (!payload.accessCode || !payload.accessCode.trim())) {
      throw new ValidationError('Access code is required for unauthenticated requests');
    }

    const effectiveAccessCode = req.user ? '' : (payload.accessCode?.trim() ?? '');
    return service
      .updateRegistration(accountId, workoutId, registrationId, payload, effectiveAccessCode)
      .then((registration) => {
        res.json(registration);
      });
  }),
);

router.delete(
  '/:accountId/workouts/:workoutId/registrations/:registrationId',
  createRegistrationAuthMiddleware(),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);
    const { workoutId, registrationId } = extractBigIntParams(
      req.params,
      'workoutId',
      'registrationId',
    );
    const accessCode = req.user ? '' : parseAccessCodeValue(getBodyAccessCode(req));

    await service.deleteRegistration(accountId, workoutId, registrationId, accessCode);

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
