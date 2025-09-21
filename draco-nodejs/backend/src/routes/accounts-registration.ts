import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authRateLimit } from '../middleware/rateLimitMiddleware.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { RegistrationService } from '../services/registrationService.js';
import { logRegistrationEvent } from '../utils/auditLogger.js';
import { ContactValidationWithSignInSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const registrationService = new RegistrationService();

/**
 * POST /api/accounts/:accountId/registration
 * Register a new user or existing user
 */
router.post(
  '/:accountId/registration',
  authRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { mode } = req.body || {};
    const start = Date.now();

    if (mode !== 'newUser' && mode !== 'existingUser') {
      logRegistrationEvent(req, 'registration_newUser', 'validation_error', {
        accountId,
        mode,
        timingMs: Date.now() - start,
      });
      res.status(400).json({ success: false, message: 'Invalid mode' });
      return;
    }

    const input = ContactValidationWithSignInSchema.parse(req.body);

    if (mode === 'newUser') {
      const result = await registrationService.registerAndCreateContactNewUser(accountId, input);

      res.status(201).json({ success: true, data: result });
      return;
    }

    const result = await registrationService.loginAndCreateContactExistingUser(accountId, input);

    res.status(201).json({ success: true, data: result });
  }),
);

export default router;
