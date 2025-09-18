import { Router, Request, Response, NextFunction } from 'express';
import { createStorageService } from '../services/storageService.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const storageService = createStorageService();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/:accountId/contacts/:contactId/photo
 * Get contact photo from S3 or local storage
 */
router.get(
  '/:contactId/photo',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, contactId } = req.params;

    // Verify the contact exists and belongs to this account
    const contactSecurityService = ServiceFactory.getContactSecurityService();
    const isValidContact = await contactSecurityService.isContactInAccount(
      BigInt(contactId),
      BigInt(accountId),
    );

    if (!isValidContact) {
      throw new NotFoundError('Contact not found');
    }

    // Get the photo from storage service
    const photoBuffer = await storageService.getContactPhoto(accountId, contactId);

    if (!photoBuffer) {
      throw new NotFoundError('Photo not found');
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', photoBuffer.length.toString());

    // Send the image buffer
    res.send(photoBuffer);
  },
);

/**
 * DELETE /api/accounts/:accountId/contacts/:contactId/photo
 * Delete contact photo
 */
router.delete(
  '/:contactId/photo',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, contactId } = req.params;

    // Verify the contact exists and belongs to this account
    const contactSecurityService = ServiceFactory.getContactSecurityService();
    const contact = await contactSecurityService.getValidatedContact(
      BigInt(contactId),
      BigInt(accountId),
      {
        id: true,
        firstname: true,
        lastname: true,
      },
    );

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Delete the photo from storage service
    await storageService.deleteContactPhoto(accountId, contactId);

    res.json(`Photo deleted for ${contact.firstname} ${contact.lastname}`);
  },
);

export default router;
