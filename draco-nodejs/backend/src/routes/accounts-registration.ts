import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authRateLimit } from '../middleware/rateLimitMiddleware.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { RegistrationService } from '../services/registrationService.js';
import { logRegistrationEvent } from '../utils/auditLogger.js';

const router = Router({ mergeParams: true });
const registrationService = new RegistrationService();

/**
 * @swagger
 * /api/accounts/{accountId}/registration:
 *   post:
 *     summary: Combined login + account registration
 *     description: For users not logged in. Supports creating a new user or logging in an existing user and registering them to the account.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - properties:
 *                   mode:
 *                     type: string
 *                     enum: [newUser]
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   middleName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                 required: [mode, email, password, firstName, lastName]
 *               - properties:
 *                   mode:
 *                     type: string
 *                     enum: [existingUser]
 *                   usernameOrEmail:
 *                     type: string
 *                   password:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   middleName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                 required: [mode, usernameOrEmail, password, firstName]
 *     responses:
 *       201:
 *         description: Registered to account and token issued
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       409:
 *         description: Already registered
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

    if (mode === 'newUser') {
      const { email, password, firstName, middleName, lastName } = req.body;
      const result = await registrationService.registerAndCreateContactNewUser({
        email,
        password,
        firstName,
        middleName,
        lastName,
        accountId,
      });
      if (!result.success) {
        logRegistrationEvent(req, 'registration_newUser', 'validation_error', {
          accountId,
          timingMs: Date.now() - start,
        });
        res.status(result.statusCode || 400).json({ success: false, message: result.message });
        return;
      }
      logRegistrationEvent(req, 'registration_newUser', 'success', {
        accountId,
        timingMs: Date.now() - start,
      });
      res.status(201).json({ success: true, ...result.payload });
      return;
    }

    // existingUser
    const { usernameOrEmail, password, firstName, middleName, lastName } = req.body;
    const result = await registrationService.loginAndCreateContactExistingUser({
      usernameOrEmail,
      password,
      firstName,
      middleName,
      lastName,
      accountId,
    });
    if (!result.success) {
      logRegistrationEvent(req, 'registration_existingUser', 'auth_error', {
        accountId,
        timingMs: Date.now() - start,
      });
      res.status(result.statusCode || 400).json({ success: false, message: result.message });
      return;
    }
    logRegistrationEvent(req, 'registration_existingUser', 'success', {
      accountId,
      timingMs: Date.now() - start,
    });
    res.status(201).json({ success: true, ...result.payload });
  }),
);

export default router;
