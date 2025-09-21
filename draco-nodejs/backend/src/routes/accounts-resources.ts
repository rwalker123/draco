// Account Resources Management Routes for Draco Sports Manager
// Handles teams, leagues, fields, and umpires for accounts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { PaginationHelper } from '../utils/pagination.js';
import prisma from '../lib/prisma.js';
import { getLogoUrl } from '../config/logo.js';
import { AccountLeague, AccountField, AccountUmpire } from '../interfaces/accountInterfaces.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();

/**
 * GET /api/accounts/:accountId/user-teams
 * Get teams that the current user is a member of for this account
 */
router.get(
  '/:accountId/user-teams',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Get the user's contact record for this account
    const userContact = await contactService.getContactByUserId(userId, accountId);

    if (!userContact) {
      // User doesn't have a contact record for this account, return empty teams
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    // Get current season for this account
    const currentSeasonRecord = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (!currentSeasonRecord) {
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    const currentSeason = await prisma.season.findUnique({
      where: {
        id: currentSeasonRecord.seasonid,
      },
    });

    if (!currentSeason) {
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    // Get teams where the user is a roster member
    const userTeams = await prisma.rosterseason.findMany({
      where: {
        roster: {
          contactid: BigInt(userContact.id),
        },
        teamsseason: {
          leagueseason: {
            seasonid: currentSeason.id,
          },
        },
        inactive: false,
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                accountid: true,
              },
            },
          },
        },
      },
    });

    // Get teams where the user is a manager
    const managedTeams = await prisma.teamseasonmanager.findMany({
      where: {
        contactid: BigInt(userContact.id),
        teamsseason: {
          leagueseason: {
            seasonid: currentSeason.id,
          },
        },
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                accountid: true,
              },
            },
          },
        },
      },
    });

    // Combine and deduplicate teams
    const allTeams = [...userTeams, ...managedTeams];
    const uniqueTeams = new Map();

    for (const team of allTeams) {
      const teamSeason = team.teamsseason;
      // Defensive: fetch league.accountid if not already included
      // We'll need to fetch the team base record to get its accountid
      let teamAccountId: string | undefined = undefined;
      if (teamSeason.teams && teamSeason.teams.accountid) {
        teamAccountId = teamSeason.teams.accountid.toString();
      } else {
        // Fallback: fetch from DB (shouldn't happen if include is set up right)
        const teamBase = await prisma.teams.findUnique({
          where: { id: teamSeason.teamid },
          select: { accountid: true },
        });
        if (teamBase) teamAccountId = teamBase.accountid.toString();
      }
      // Only include if the team's accountId matches the route accountId
      if (teamAccountId === accountId.toString()) {
        const teamId = teamSeason.id.toString();
        if (!uniqueTeams.has(teamId)) {
          uniqueTeams.set(teamId, {
            id: teamId,
            name: teamSeason.name,
            leagueName: teamSeason.leagueseason.league.name,
            logoUrl: getLogoUrl(teamAccountId, teamSeason.teamid.toString()),
            // TODO: Add more team data like record, standing, next game
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        teams: Array.from(uniqueTeams.values()),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/leagues
 * Get all leagues for this account
 */
router.get(
  '/:accountId/leagues',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Get current season for this account
    const currentSeasonRecord = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (!currentSeasonRecord) {
      res.json({
        success: true,
        data: {
          leagues: [],
        },
      });
      return;
    }

    const currentSeason = await prisma.season.findUnique({
      where: {
        id: currentSeasonRecord.seasonid,
      },
    });

    if (!currentSeason) {
      res.json({
        success: true,
        data: {
          leagues: [],
        },
      });
      return;
    }

    // Get leagues with team counts
    const leagues = await prisma.leagueseason.findMany({
      where: {
        seasonid: currentSeason.id,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            teamsseason: true,
          },
        },
      },
    });

    const leagueData: AccountLeague[] = leagues.map((league) => ({
      id: league.league.id.toString(),
      name: league.league.name,
      teamCount: league._count.teamsseason,
    }));

    res.json({
      success: true,
      data: {
        leagues: leagueData,
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/fields
 * Get all fields for an account (public endpoint) - with pagination
 */
router.get(
  '/:accountId/fields',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Parse pagination parameters
    const paginationParams = PaginationHelper.parseParams(req.query);
    const allowedSortFields = ['name', 'address', 'id'];
    const sortBy = PaginationHelper.validateSortField(paginationParams.sortBy, allowedSortFields);

    // Get total count
    const totalCount = await prisma.availablefields.count({
      where: {
        accountid: accountId,
      },
    });

    const fields = await prisma.availablefields.findMany({
      where: {
        accountid: accountId,
      },
      orderBy: sortBy
        ? PaginationHelper.getPrismaOrderBy(sortBy, paginationParams.sortOrder)
        : { name: 'asc' },
      skip: paginationParams.skip,
      take: paginationParams.limit,
    });

    const fieldData: AccountField[] = fields.map((field) => ({
      id: field.id.toString(),
      name: field.name,
      address: field.address,
      accountId: field.accountid.toString(),
    }));

    // Format paginated response
    const response = PaginationHelper.formatResponse(
      fieldData,
      paginationParams.page,
      paginationParams.limit,
      totalCount,
    );

    res.json({
      ...response,
      data: {
        fields: response.data,
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/fields
 * Create a new field for an account
 */
router.post(
  '/:accountId/fields',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { name, address } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Field name is required');
    }

    // Check if field with same name already exists for this account
    const existingField = await prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name: name.trim(),
      },
    });

    if (existingField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const newField = await prisma.availablefields.create({
      data: {
        name: name.trim(),
        shortname: name.trim().substring(0, 5), // Use first 5 chars of name
        comment: '', // Empty string for comment
        address: address?.trim() || '',
        city: '', // Empty string for city
        state: '', // Empty string for state
        zipcode: '', // Empty string for zipcode
        directions: '', // Empty string for directions
        rainoutnumber: '', // Empty string for rainout number
        latitude: '', // Empty string for latitude
        longitude: '', // Empty string for longitude
        accountid: accountId,
      },
    });

    const fieldResponse: AccountField = {
      id: newField.id.toString(),
      name: newField.name,
      address: newField.address,
      accountId: newField.accountid.toString(),
    };

    res.status(201).json({
      success: true,
      data: {
        field: fieldResponse,
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/fields/:fieldId
 * Update a field
 */
router.put(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');
    const { name, address } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Field name is required');
    }

    // Check if field exists and belongs to this account
    const existingField = await prisma.availablefields.findFirst({
      where: {
        id: fieldId,
        accountid: accountId,
      },
    });

    if (!existingField) {
      throw new NotFoundError('Field not found');
    }

    // Check if another field with the same name already exists for this account
    const duplicateField = await prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name: name.trim(),
        id: { not: fieldId },
      },
    });

    if (duplicateField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const updatedField = await prisma.availablefields.update({
      where: {
        id: fieldId,
      },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
      },
    });

    const fieldResponse: AccountField = {
      id: updatedField.id.toString(),
      name: updatedField.name,
      address: updatedField.address,
      accountId: updatedField.accountid.toString(),
    };

    res.json({
      success: true,
      data: {
        field: fieldResponse,
      },
    });
  }),
);

/**
 * DELETE /api/accounts/:accountId/fields/:fieldId
 * Delete a field
 */
router.delete(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');

    // Check if field exists and belongs to this account
    const field = await prisma.availablefields.findFirst({
      where: {
        id: fieldId,
        accountid: accountId,
      },
    });

    if (!field) {
      throw new NotFoundError('Field not found');
    }

    // Check if field is being used in any games
    const gamesUsingField = await prisma.leagueschedule.findFirst({
      where: {
        fieldid: fieldId,
      },
    });

    if (gamesUsingField) {
      throw new ValidationError('Cannot delete field because it is being used in scheduled games');
    }

    await prisma.availablefields.delete({
      where: {
        id: fieldId,
      },
    });

    res.json({
      success: true,
      data: {
        message: `Field "${field.name}" has been deleted`,
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/umpires
 * Get all umpires for an account - with pagination
 */
router.get(
  '/:accountId/umpires',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.umpires.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Parse pagination parameters
    const paginationParams = PaginationHelper.parseParams(req.query);
    const allowedSortFields = ['contacts.firstname', 'contacts.lastname', 'contacts.email', 'id'];
    const sortBy = PaginationHelper.validateSortField(paginationParams.sortBy, allowedSortFields);

    // Get total count
    const totalCount = await prisma.leagueumpires.count({
      where: {
        accountid: accountId,
      },
    });

    const umpires = await prisma.leagueumpires.findMany({
      where: {
        accountid: accountId,
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: sortBy
        ? PaginationHelper.getPrismaOrderBy(sortBy, paginationParams.sortOrder)
        : {
            contacts: {
              lastname: 'asc',
            },
          },
      skip: paginationParams.skip,
      take: paginationParams.limit,
    });

    const umpireData: AccountUmpire[] = umpires.map((umpire) => ({
      id: umpire.id.toString(),
      contactId: umpire.contactid.toString(),
      firstName: umpire.contacts.firstname,
      lastName: umpire.contacts.lastname,
      email: umpire.contacts.email,
      displayName: `${umpire.contacts.firstname} ${umpire.contacts.lastname}`.trim(),
    }));

    // Format paginated response
    const response = PaginationHelper.formatResponse(
      umpireData,
      paginationParams.page,
      paginationParams.limit,
      totalCount,
    );

    res.json({
      ...response,
      data: {
        umpires: response.data,
      },
    });
  }),
);

export default router;
