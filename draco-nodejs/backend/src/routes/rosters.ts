import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Get all roster members for a team season
 */
router.get('/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parameters from the merged params (due to nested routing)
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      console.log('Roster route params:', { seasonId: seasonId.toString(), accountId: accountId.toString(), teamSeasonId: teamSeasonId.toString() });

      // Verify the team season exists and belongs to this account and season
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId
            }
          }
        }
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Get all roster members for this team season
      const rosterMembers = await prisma.rosterseason.findMany({
        where: {
          teamseasonid: teamSeasonId
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  middlename: true,
                  email: true,
                  phone1: true,
                  phone2: true,
                  phone3: true,
                  streetaddress: true,
                  city: true,
                  state: true,
                  zip: true,
                  dateofbirth: true
                }
              }
            }
          }
        },
        orderBy: [
          { inactive: 'asc' },
          { playernumber: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: {
          teamSeason: {
            id: teamSeason.id,
            name: teamSeason.name
          },
          rosterMembers: rosterMembers.map(member => ({
            id: member.id,
            playerNumber: member.playernumber,
            inactive: member.inactive,
            submittedWaiver: member.submittedwaiver,
            dateAdded: member.dateadded ? member.dateadded.toISOString() : null,
            player: {
              id: member.roster.id,
              contactId: member.roster.contactid,
              submittedDriversLicense: member.roster.submitteddriverslicense,
              firstYear: member.roster.firstyear,
              contact: {
                ...member.roster.contacts,
                phones: [
                  ...(member.roster.contacts.phone1 ? [{ type: 'home', number: member.roster.contacts.phone1 }] : []),
                  ...(member.roster.contacts.phone2 ? [{ type: 'work', number: member.roster.contacts.phone2 }] : []),
                  ...(member.roster.contacts.phone3 ? [{ type: 'cell', number: member.roster.contacts.phone3 }] : [])
                ]
              }
            }
          }))
        }
      });
    } catch (error) {
      console.error('Roster route error:', error);
      next(error);
    }
  }
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/available-players
 * Get all available players (not on any team in this season) for adding to roster
 */
router.get('/:teamSeasonId/available-players',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Verify the team season exists and belongs to this account and season
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId
            }
          }
        }
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Get all roster players for this account
      const allRosterPlayers = await prisma.roster.findMany({
        where: {
          contacts: {
            creatoraccountid: accountId
          }
        },
        include: {
          contacts: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              middlename: true,
              email: true,
              phone1: true,
              phone2: true,
              phone3: true,
              streetaddress: true,
              city: true,
              state: true,
              zip: true,
              dateofbirth: true
            }
          }
        }
      });

      // Get all players already on teams in this season
      const assignedPlayers = await prisma.rosterseason.findMany({
        where: {
          teamsseason: {
            leagueseason: {
              seasonid: seasonId
            }
          }
        },
        select: {
          playerid: true
        }
      });

      const assignedPlayerIds = new Set(assignedPlayers.map(p => p.playerid));

      // Filter out players already assigned to teams in this season
      const availablePlayers = allRosterPlayers.filter(player => !assignedPlayerIds.has(player.id));

      res.json({
        success: true,
        data: {
          availablePlayers: availablePlayers.map(player => ({
            id: player.id,
            contactId: player.contactid,
            submittedDriversLicense: player.submitteddriverslicense,
            firstYear: player.firstyear,
            contact: {
              ...player.contacts,
              phones: [
                ...(player.contacts.phone1 ? [{ type: 'home', number: player.contacts.phone1 }] : []),
                ...(player.contacts.phone2 ? [{ type: 'work', number: player.contacts.phone2 }] : []),
                ...(player.contacts.phone3 ? [{ type: 'cell', number: player.contacts.phone3 }] : [])
              ]
            }
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Add a player to the team roster
 */
router.post('/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const { playerId, playerNumber } = req.body;

      if (!playerId) {
        res.status(400).json({
          success: false,
          message: 'PlayerId is required'
        });
        return;
      }

      // Verify the team season exists and belongs to this account and season
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId
            }
          }
        }
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Verify the player exists and belongs to this account
      const player = await prisma.roster.findFirst({
        where: {
          id: BigInt(playerId),
          contacts: {
            creatoraccountid: accountId
          }
        },
        include: {
          contacts: {
            select: {
              firstname: true,
              lastname: true
            }
          }
        }
      });

      if (!player) {
        res.status(404).json({ success: false, message: 'Player not found' });
        return;
      }

      // Check if player is already on a team in this season
      const existingRosterMember = await prisma.rosterseason.findFirst({
        where: {
          playerid: BigInt(playerId),
          teamsseason: {
            leagueseason: {
              seasonid: seasonId
            }
          }
        }
      });

      if (existingRosterMember) {
        res.status(400).json({
          success: false,
          message: 'Player is already on a team in this season'
        });
        return;
      }

      // Add player to roster
      const newRosterMember = await prisma.rosterseason.create({
        data: {
          playerid: BigInt(playerId),
          teamseasonid: teamSeasonId,
          playernumber: playerNumber || 0,
          inactive: false,
          submittedwaiver: false,
          dateadded: new Date()
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: {
          message: `Player "${player.contacts.firstname} ${player.contacts.lastname}" added to team roster`,
          rosterMember: {
            id: newRosterMember.id,
            playerNumber: newRosterMember.playernumber,
            inactive: newRosterMember.inactive,
            submittedWaiver: newRosterMember.submittedwaiver,
            dateAdded: newRosterMember.dateadded ? newRosterMember.dateadded.toISOString() : null,
            player: {
              id: newRosterMember.roster.id,
              contactId: newRosterMember.roster.contactid,
              contact: newRosterMember.roster.contacts
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/release
 * Release a player from the team (set inactive = true)
 */
router.put('/:teamSeasonId/roster/:rosterMemberId/release',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const rosterMemberId = BigInt(req.params.rosterMemberId);

      // Verify the roster member exists and belongs to this team season
      const rosterMember = await prisma.rosterseason.findFirst({
        where: {
          id: rosterMemberId,
          teamseasonid: teamSeasonId,
          teamsseason: {
            leagueseason: {
              seasonid: seasonId,
              league: {
                accountid: accountId
              }
            }
          }
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      if (rosterMember.inactive) {
        res.status(400).json({
          success: false,
          message: 'Player is already released'
        });
        return;
      }

      // Release the player
      const updatedRosterMember = await prisma.rosterseason.update({
        where: { id: rosterMemberId },
        data: { inactive: true },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          message: `Player "${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}" has been released from the team`,
          rosterMember: {
            id: updatedRosterMember.id,
            playerNumber: updatedRosterMember.playernumber,
            inactive: updatedRosterMember.inactive,
            submittedWaiver: updatedRosterMember.submittedwaiver,
            dateAdded: updatedRosterMember.dateadded ? updatedRosterMember.dateadded.toISOString() : null,
            player: {
              id: updatedRosterMember.roster.id,
              contactId: updatedRosterMember.roster.contactid,
              contact: updatedRosterMember.roster.contacts
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/activate
 * Reactivate a released player (set inactive = false)
 */
router.put('/:teamSeasonId/roster/:rosterMemberId/activate',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const rosterMemberId = BigInt(req.params.rosterMemberId);

      // Verify the roster member exists and belongs to this team season
      const rosterMember = await prisma.rosterseason.findFirst({
        where: {
          id: rosterMemberId,
          teamseasonid: teamSeasonId,
          teamsseason: {
            leagueseason: {
              seasonid: seasonId,
              league: {
                accountid: accountId
              }
            }
          }
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      if (!rosterMember.inactive) {
        res.status(400).json({
          success: false,
          message: 'Player is already active'
        });
        return;
      }

      // Activate the player
      const updatedRosterMember = await prisma.rosterseason.update({
        where: { id: rosterMemberId },
        data: { inactive: false },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          message: `Player "${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}" has been reactivated`,
          rosterMember: {
            id: updatedRosterMember.id,
            playerNumber: updatedRosterMember.playernumber,
            inactive: updatedRosterMember.inactive,
            submittedWaiver: updatedRosterMember.submittedwaiver,
            dateAdded: updatedRosterMember.dateadded ? updatedRosterMember.dateadded.toISOString() : null,
            player: {
              id: updatedRosterMember.roster.id,
              contactId: updatedRosterMember.roster.contactid,
              contact: updatedRosterMember.roster.contacts
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Permanently delete a player from the roster (with warning)
 */
router.delete('/:teamSeasonId/roster/:rosterMemberId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const rosterMemberId = BigInt(req.params.rosterMemberId);

      // Verify the roster member exists and belongs to this team season
      const rosterMember = await prisma.rosterseason.findFirst({
        where: {
          id: rosterMemberId,
          teamseasonid: teamSeasonId,
          teamsseason: {
            leagueseason: {
              seasonid: seasonId,
              league: {
                accountid: accountId
              }
            }
          }
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true
                }
              }
            }
          }
        }
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      // Permanently delete the roster member
      await prisma.rosterseason.delete({
        where: { id: rosterMemberId }
      });

      res.json({
        success: true,
        data: {
          message: `Player "${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}" has been permanently removed from the roster`
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 