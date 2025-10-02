import { Router, Request, Response, NextFunction } from 'express';
import { createStorageService } from '../services/storageService.js';
import { validateLogoFile, getLogoUrl } from '../config/logo.js';
import { validateTeamSeasonWithTeamDetails } from '../utils/teamValidation.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
const storageService = createStorageService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/logo
 * Get team logo from S3 or local storage
 */
router.get(
  '/:teamSeasonId/logo',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const accountId = req.params.accountId;
    const seasonId = req.params.seasonId;
    const teamSeasonId = req.params.teamSeasonId;

    // First, get the team season to find the teamId
    const teamSeason = await validateTeamSeasonWithTeamDetails(
      prisma,
      BigInt(teamSeasonId),
      BigInt(seasonId),
      BigInt(accountId),
    );

    const teamId = teamSeason.teamid.toString();

    // Get the logo from storage service using teamId
    const logoBuffer = await storageService.getLogo(accountId, teamId);

    if (!logoBuffer) {
      res.status(404).json({
        success: false,
        message: 'Logo not found',
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', logoBuffer.length.toString());

    // Send the image buffer
    res.send(logoBuffer);
  }),
);

/**
 * GET /api/accounts/:accountId/teams/:teamId/logo
 * Get team logo from S3 or local storage using direct team ID
 */
router.get(
  '/:teamId/logo',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const accountId = req.params.accountId;
    const teamId = req.params.teamId;

    // Get the logo from storage service
    const logoBuffer = await storageService.getLogo(accountId, teamId);

    if (!logoBuffer) {
      res.status(404).json({
        success: false,
        message: 'Logo not found',
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', logoBuffer.length.toString());

    // Send the image buffer
    res.send(logoBuffer);
  }),
);

/**
 * Helper function to handle logo upload for team update route
 * This will be used by the main teams.ts file
 */
export const handleLogoUpload = async (
  req: Request,
  accountId: bigint,
  teamId: bigint,
): Promise<string | null> => {
  if (!req.file) {
    return null;
  }

  // Validate the uploaded file
  const validationError = validateLogoFile(req.file);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    // Save the logo using the storage service
    await storageService.saveLogo(accountId.toString(), teamId.toString(), req.file.buffer);

    // Generate the public logo URL for the response
    return getLogoUrl(accountId.toString(), teamId.toString());
  } catch (error) {
    console.error('Error saving logo:', error);
    throw new Error('Failed to save logo');
  }
};

export default router;
