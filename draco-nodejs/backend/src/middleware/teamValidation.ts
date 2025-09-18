/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, teamsseason } from '@prisma/client';
import {
  validateTeamSeasonAccess,
  validateTeamSeasonWithTeamDetails,
  validateTeamSeasonWithDivision,
  validateTeamSeasonBasic,
  TeamValidationOptions,
} from '../utils/teamValidation.js';
import { extractTeamParams } from '../utils/paramExtraction.js';
import { asyncHandler } from '../routes/utils/asyncHandler.js';

// Extend Express Request interface to include validated team season
declare global {
  namespace Express {
    interface Request {
      teamSeason?: teamsseason & Record<string, any>;
    }
  }
}

/**
 * Express middleware that validates team season access and attaches the result to req.teamSeason
 * Throws appropriate errors if validation fails
 */
export function requireValidTeamSeason(prisma: PrismaClient, options: TeamValidationOptions = {}) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const teamSeason = await validateTeamSeasonAccess(
      prisma,
      teamSeasonId,
      seasonId,
      accountId,
      options,
    );

    // Attach the validated team season to the request for use in route handlers
    req.teamSeason = teamSeason;

    next();
  });
}

/**
 * Middleware variant that includes team details
 */
export function requireValidTeamSeasonWithTeamDetails(prisma: PrismaClient) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const teamSeason = await validateTeamSeasonWithTeamDetails(
      prisma,
      teamSeasonId,
      seasonId,
      accountId,
    );

    req.teamSeason = teamSeason;
    next();
  });
}

/**
 * Middleware variant that includes division information
 */
export function requireValidTeamSeasonWithDivision(prisma: PrismaClient) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const teamSeason = await validateTeamSeasonWithDivision(
      prisma,
      teamSeasonId,
      seasonId,
      accountId,
    );

    req.teamSeason = teamSeason;
    next();
  });
}

/**
 * Basic middleware variant without additional includes - fastest option
 */
export function requireValidTeamSeasonBasic(prisma: PrismaClient) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    const teamSeason = await validateTeamSeasonBasic(prisma, teamSeasonId, seasonId, accountId);

    req.teamSeason = teamSeason;
    next();
  });
}
