// Division Definitions Management Routes for Draco Sports Manager
// Handles CRUD operations for division definitions (divisiondefs)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { PrismaClient } from '@prisma/client';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/:accountId/divisions
 * Get all division definitions for an account
 */
router.get('/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const divisions = await prisma.divisiondefs.findMany({
        where: {
          accountid: accountId
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: {
          divisions: divisions.map((division: any) => ({
            id: division.id.toString(),
            name: division.name,
            accountId: division.accountid.toString()
          }))
        }
      });
    } catch (error) {
      console.error('Error getting divisions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/divisions/:divisionId
 * Get specific division definition
 */
router.get('/:divisionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const divisionId = BigInt(req.params.divisionId);

      const division = await prisma.divisiondefs.findFirst({
        where: {
          id: divisionId,
          accountid: accountId
        }
      });

      if (!division) {
        res.status(404).json({
          success: false,
          message: 'Division not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          division: {
            id: division.id.toString(),
            name: division.name,
            accountId: division.accountid.toString()
          }
        }
      });
    } catch (error) {
      console.error('Error getting division:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/divisions
 * Create a new division definition
 */
router.post('/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { name } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Division name is required'
        });
        return;
      }

      // Check if division with this name already exists for this account
      const existingDivision = await prisma.divisiondefs.findFirst({
        where: {
          accountid: accountId,
          name: name.trim()
        }
      });

      if (existingDivision) {
        res.status(409).json({
          success: false,
          message: 'A division with this name already exists'
        });
        return;
      }

      const newDivision = await prisma.divisiondefs.create({
        data: {
          accountid: accountId,
          name: name.trim()
        }
      });

      res.status(201).json({
        success: true,
        data: {
          division: {
            id: newDivision.id.toString(),
            name: newDivision.name,
            accountId: newDivision.accountid.toString()
          },
          message: `Division "${newDivision.name}" has been created`
        }
      });
    } catch (error: any) {
      console.error('Error creating division:', error);
      
      // Check if it's a unique constraint violation
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          message: 'A division with this name already exists'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/accounts/:accountId/divisions/:divisionId
 * Update a division definition
 */
router.put('/:divisionId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const divisionId = BigInt(req.params.divisionId);
      const { name } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Division name is required'
        });
        return;
      }

      // Verify the division exists and belongs to this account
      const existingDivision = await prisma.divisiondefs.findFirst({
        where: {
          id: divisionId,
          accountid: accountId
        }
      });

      if (!existingDivision) {
        res.status(404).json({
          success: false,
          message: 'Division not found'
        });
        return;
      }

      // Check if another division with this name already exists for this account
      const duplicateDivision = await prisma.divisiondefs.findFirst({
        where: {
          accountid: accountId,
          name: name.trim(),
          id: {
            not: divisionId
          }
        }
      });

      if (duplicateDivision) {
        res.status(409).json({
          success: false,
          message: 'A division with this name already exists'
        });
        return;
      }

      const updatedDivision = await prisma.divisiondefs.update({
        where: {
          id: divisionId
        },
        data: {
          name: name.trim()
        }
      });

      res.json({
        success: true,
        data: {
          division: {
            id: updatedDivision.id.toString(),
            name: updatedDivision.name,
            accountId: updatedDivision.accountid.toString()
          },
          message: `Division has been updated to "${updatedDivision.name}"`
        }
      });
    } catch (error: any) {
      console.error('Error updating division:', error);
      
      // Check if it's a unique constraint violation
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          message: 'A division with this name already exists'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/divisions/:divisionId
 * Delete a division definition
 */
router.delete('/:divisionId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const divisionId = BigInt(req.params.divisionId);

      // Verify the division exists and belongs to this account
      const division = await prisma.divisiondefs.findFirst({
        where: {
          id: divisionId,
          accountid: accountId
        }
      });

      if (!division) {
        res.status(404).json({
          success: false,
          message: 'Division not found'
        });
        return;
      }

      // Check if this division is being used in any league seasons
      const divisionSeasons = await prisma.divisionseason.findMany({
        where: {
          divisionid: divisionId
        }
      });

      if (divisionSeasons.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete division because it is being used in league seasons. Remove it from all league seasons first.'
        });
        return;
      }

      await prisma.divisiondefs.delete({
        where: {
          id: divisionId
        }
      });

      res.json({
        success: true,
        data: {
          message: `Division "${division.name}" has been deleted`
        }
      });
    } catch (error: any) {
      console.error('Error deleting division:', error);
      
      // Check if it's a foreign key constraint error
      if (error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete division because it is being used in league seasons. Remove it from all league seasons first.'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router; 