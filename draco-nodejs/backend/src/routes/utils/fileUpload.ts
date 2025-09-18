import { Request } from 'express';
import { validateContactPhotoFile, getContactPhotoUrl } from '../../config/logo.js';
import { createStorageService } from '../../services/storageService.js';

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

  const storageService = createStorageService();

  // Save the photo using the storage service
  await storageService.saveContactPhoto(
    accountId.toString(),
    contactId.toString(),
    req.file.buffer,
  );

  // Generate the public photo URL for the response
  return getContactPhotoUrl(accountId.toString(), contactId.toString());
};
