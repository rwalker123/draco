import { Router, Request, Response, NextFunction } from 'express';
import { createStorageService } from '../services/storageService';
import { validateContactPhotoFile, getContactPhotoUrl } from '../config/logo';
import * as multer from 'multer';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
const storageService = createStorageService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * GET /api/accounts/:accountId/contacts/:contactId/photo
 * Get contact photo from S3 or local storage
 */
router.get(
  '/:contactId/photo',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const accountId = req.params.accountId;
      const contactId = req.params.contactId;

      // Verify the contact exists and belongs to this account
      const contact = await prisma.contacts.findFirst({
        where: {
          id: BigInt(contactId),
          creatoraccountid: BigInt(accountId),
        },
        select: {
          id: true,
        },
      });

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      // Get the photo from storage service
      const photoBuffer = await storageService.getContactPhoto(accountId, contactId);

      if (!photoBuffer) {
        res.status(404).json({
          success: false,
          message: 'Photo not found',
        });
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Content-Length', photoBuffer.length.toString());

      // Send the image buffer
      res.send(photoBuffer);
    } catch (error) {
      console.error('Error serving contact photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to serve photo',
      });
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/contacts/:contactId/photo
 * Delete contact photo
 */
router.delete(
  '/:contactId/photo',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const accountId = req.params.accountId;
      const contactId = req.params.contactId;

      // Verify the contact exists and belongs to this account
      const contact = await prisma.contacts.findFirst({
        where: {
          id: BigInt(contactId),
          creatoraccountid: BigInt(accountId),
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
        },
      });

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      // Delete the photo from storage service
      await storageService.deleteContactPhoto(accountId, contactId);

      res.json({
        success: true,
        message: `Photo deleted for ${contact.firstname} ${contact.lastname}`,
      });
    } catch (error) {
      console.error('Error deleting contact photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete photo',
      });
    }
  },
);

/**
 * Helper function to handle contact photo upload for contact update route
 * This will be used by the main contact routes file
 */
export const handleContactPhotoUpload = async (
  req: Request,
  accountId: bigint,
  contactId: bigint,
): Promise<string | null> => {
  if (!req.file) {
    return null;
  }

  // Validate the uploaded file
  const validationError = validateContactPhotoFile(req.file);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    // Save the photo using the storage service
    await storageService.saveContactPhoto(
      accountId.toString(),
      contactId.toString(),
      req.file.buffer,
    );

    // Generate the public photo URL for the response
    return getContactPhotoUrl(accountId.toString(), contactId.toString());
  } catch (error) {
    console.error('Error saving contact photo:', error);
    throw new Error('Failed to save contact photo');
  }
};

export { upload };
export default router;
