import { Router, Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractContactParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();

/**
 * GET /api/accounts/:accountId/contacts/:contactId/photo
 * Get contact photo from S3 or local storage
 */
router.get(
  '/:contactId/photo',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    // Verify the contact exists and belongs to this account
    await contactService.getContact(accountId, contactId);

    // Get the photo from storage service
    const photoBuffer = await ServiceFactory.getStorageService().getContactPhoto(
      accountId.toString(),
      contactId.toString(),
    );

    if (!photoBuffer) {
      throw new NotFoundError('Photo not found');
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', photoBuffer.length.toString());

    // Send the image buffer
    res.send(photoBuffer);
  }),
);

/**
 * DELETE /api/accounts/:accountId/contacts/:contactId/photo
 * Delete contact photo
 */
router.delete(
  '/:contactId/photo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.photos.manage'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    // Verify the contact exists and belongs to this account
    const contact = await contactService.getContact(accountId, contactId);

    // Delete the photo from storage service
    await ServiceFactory.getStorageService().deleteContactPhoto(
      accountId.toString(),
      contactId.toString(),
    );

    res.json(`Photo deleted for ${contact.firstName} ${contact.lastName}`);
  }),
);

export default router;
