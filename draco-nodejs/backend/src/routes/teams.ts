import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { createStorageService } from '../services/storageService';
import { validateLogoFile, getLogoUrl } from '../config/logo';
import * as multer from 'multer';
import { leagueschedule, availablefields } from '@prisma/client';
import { getGameStatusText, getGameStatusShortText } from '../utils/gameStatus';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);
const storageService = createStorageService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams
 * Get all teams for a season
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const seasonId = BigInt(req.params.seasonId);
    const accountId = BigInt(req.params.accountId);

    // Get all teams for this season across all leagues
    const teams = await prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        teams: {
          select: {
            id: true,
            webaddress: true,
            youtubeuserid: true,
            defaultvideo: true,
            autoplayvideo: true,
          },
        },
        leagueseason: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ leagueseason: { league: { name: 'asc' } } }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: {
        teams: teams.map((team) => ({
          id: team.id.toString(),
          name: team.name,
          teamId: team.teamid.toString(),
          league: {
            id: team.leagueseason.league.id.toString(),
            name: team.leagueseason.league.name,
          },
          webAddress: team.teams.webaddress,
          youtubeUserId: team.teams.youtubeuserid,
          defaultVideo: team.teams.defaultvideo,
          autoPlayVideo: team.teams.autoplayvideo,
        })),
      },
    });
  } catch (error) {
    console.error('Teams route error:', error);
    next(error);
  }
});

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Get all roster members for a team season
 */
router.get(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parameters from the merged params (due to nested routing)
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
              accountid: accountId,
            },
          },
        },
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Get all roster members for this team season
      const rosterMembers = await prisma.rosterseason.findMany({
        where: {
          teamseasonid: teamSeasonId,
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
                  dateofbirth: true,
                },
              },
            },
          },
        },
        orderBy: [{ inactive: 'asc' }, { playernumber: 'asc' }],
      });

      res.json({
        success: true,
        data: {
          teamSeason: {
            id: teamSeason.id,
            name: teamSeason.name,
          },
          rosterMembers: rosterMembers.map((member) => ({
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
                dateofbirth: member.roster.contacts.dateofbirth
                  ? member.roster.contacts.dateofbirth.toISOString()
                  : null,
                phones: [
                  ...(member.roster.contacts.phone1
                    ? [{ type: 'home', number: member.roster.contacts.phone1 }]
                    : []),
                  ...(member.roster.contacts.phone2
                    ? [{ type: 'work', number: member.roster.contacts.phone2 }]
                    : []),
                  ...(member.roster.contacts.phone3
                    ? [{ type: 'cell', number: member.roster.contacts.phone3 }]
                    : []),
                ],
              },
            },
          })),
        },
      });
    } catch (error) {
      console.error('Roster route error:', error);
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/league
 * Get league information for a team season
 */
router.get(
  '/:teamSeasonId/league',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Get the team season with league information
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: teamSeason.leagueseason.league.id,
          name: teamSeason.leagueseason.league.name,
        },
      });
    } catch (error) {
      console.error('League route error:', error);
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/available-players
 * Get all available players (not on any team in this season) for adding to roster
 */
router.get(
  '/:teamSeasonId/available-players',
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
              accountid: accountId,
            },
          },
        },
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Get the leagueseasonid for this team
      const leagueSeasonId = teamSeason.leagueseasonid;

      // Get all roster players for this account
      const allRosterPlayers = await prisma.roster.findMany({
        where: {
          contacts: {
            creatoraccountid: accountId,
          },
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
              dateofbirth: true,
            },
          },
        },
        orderBy: [
          { contacts: { lastname: 'asc' } },
          { contacts: { firstname: 'asc' } },
          { contacts: { middlename: 'asc' } },
        ],
      });

      // Get all players already on teams in this league season
      const assignedPlayers = await prisma.rosterseason.findMany({
        where: {
          teamsseason: {
            leagueseasonid: leagueSeasonId,
          },
        },
        select: {
          playerid: true,
        },
      });

      const assignedPlayerIds = new Set(assignedPlayers.map((p) => p.playerid));

      // Filter out players already assigned to teams in this league season
      const availablePlayers = allRosterPlayers.filter(
        (player) => !assignedPlayerIds.has(player.id),
      );

      // Check for ?full=1 query parameter
      const returnFull = req.query.full === '1' || req.query.full === 'true';

      // Sort availablePlayers by lastname, firstname, middlename
      let playersResponse;
      if (returnFull) {
        playersResponse = availablePlayers.map((player) => ({
          id: player.id,
          contactId: player.contactid,
          firstYear: player.firstyear,
          submittedDriversLicense: player.submitteddriverslicense,
          contact: {
            id: player.contacts.id,
            firstname: player.contacts.firstname,
            lastname: player.contacts.lastname,
            middlename: player.contacts.middlename,
          },
        }));
      } else {
        playersResponse = availablePlayers.map((player) => ({
          id: player.id,
          contactId: player.contactid,
          firstYear: player.firstyear,
          submittedDriversLicense: player.submitteddriverslicense,
          contact: {
            id: player.contacts.id,
            firstname: player.contacts.firstname,
            lastname: player.contacts.lastname,
            middlename: player.contacts.middlename,
          },
        }));
      }

      res.json({
        success: true,
        data: {
          availablePlayers: playersResponse,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster
 * Add a player to the team roster
 */
router.post(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const { playerId, playerNumber, submittedWaiver, submittedDriversLicense, firstYear } =
        req.body;

      if (!playerId) {
        res.status(400).json({
          success: false,
          message: 'PlayerId is required',
        });
        return;
      }

      // Validate player number
      if (playerNumber !== undefined && playerNumber < 0) {
        res.status(400).json({
          success: false,
          message: 'Player number must be 0 or greater',
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
              accountid: accountId,
            },
          },
        },
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
            creatoraccountid: accountId,
          },
        },
        include: {
          contacts: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      if (!player) {
        res.status(404).json({ success: false, message: 'Player not found' });
        return;
      }

      // Get the leagueseasonid for this team
      const leagueSeasonId = teamSeason.leagueseasonid;

      // Check if player is already on a team in this league season
      const existingRosterMember = await prisma.rosterseason.findFirst({
        where: {
          playerid: BigInt(playerId),
          teamsseason: {
            leagueseasonid: leagueSeasonId,
          },
        },
      });

      if (existingRosterMember) {
        res.status(400).json({
          success: false,
          message: 'Player is already on a team in this season',
        });
        return;
      }

      // Update player's roster information if provided
      if (submittedDriversLicense !== undefined || firstYear !== undefined) {
        await prisma.roster.update({
          where: { id: BigInt(playerId) },
          data: {
            submitteddriverslicense:
              submittedDriversLicense !== undefined
                ? submittedDriversLicense
                : player.submitteddriverslicense,
            firstyear: firstYear !== undefined ? firstYear : player.firstyear,
          },
        });
      }

      // Add player to roster
      const newRosterMember = await prisma.rosterseason.create({
        data: {
          playerid: BigInt(playerId),
          teamseasonid: teamSeasonId,
          playernumber: playerNumber || 0,
          inactive: false,
          submittedwaiver: submittedWaiver || false,
          dateadded: new Date(),
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: `Player "${player.contacts.firstname} ${player.contacts.lastname}" signed to team roster`,
          rosterMember: {
            id: newRosterMember.id,
            playerNumber: newRosterMember.playernumber,
            inactive: newRosterMember.inactive,
            submittedWaiver: newRosterMember.submittedwaiver,
            dateAdded: newRosterMember.dateadded ? newRosterMember.dateadded.toISOString() : null,
            player: {
              id: newRosterMember.roster.id,
              contactId: newRosterMember.roster.contactid,
              contact: newRosterMember.roster.contacts,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/update
 * Update roster member information (player number, waiver status, driver's license, first year)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/update',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const rosterMemberId = BigInt(req.params.rosterMemberId);

      const { playerNumber, submittedWaiver, submittedDriversLicense, firstYear } = req.body;

      // Validate player number
      if (playerNumber !== undefined && playerNumber < 0) {
        res.status(400).json({
          success: false,
          message: 'Player number must be 0 or greater',
        });
        return;
      }

      // Verify the roster member exists and belongs to this team season
      const rosterMember = await prisma.rosterseason.findFirst({
        where: {
          id: rosterMemberId,
          teamseasonid: teamSeasonId,
          teamsseason: {
            leagueseason: {
              seasonid: seasonId,
              league: {
                accountid: accountId,
              },
            },
          },
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      // Update roster season data
      const updatedRosterMember = await prisma.rosterseason.update({
        where: { id: rosterMemberId },
        data: {
          playernumber: playerNumber !== undefined ? playerNumber : rosterMember.playernumber,
          submittedwaiver:
            submittedWaiver !== undefined ? submittedWaiver : rosterMember.submittedwaiver,
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      // Update roster data (player-specific data)
      const updatedRoster = await prisma.roster.update({
        where: { id: rosterMember.playerid },
        data: {
          submitteddriverslicense:
            submittedDriversLicense !== undefined
              ? submittedDriversLicense
              : rosterMember.roster.submitteddriverslicense,
          firstyear: firstYear !== undefined ? firstYear : rosterMember.roster.firstyear,
        },
      });

      res.json({
        success: true,
        data: {
          message: `Roster information updated for "${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}"`,
          rosterMember: {
            id: updatedRosterMember.id,
            playerNumber: updatedRosterMember.playernumber,
            inactive: updatedRosterMember.inactive,
            submittedWaiver: updatedRosterMember.submittedwaiver,
            dateAdded: updatedRosterMember.dateadded
              ? updatedRosterMember.dateadded.toISOString()
              : null,
            player: {
              id: updatedRosterMember.roster.id,
              contactId: updatedRosterMember.roster.contactid,
              submittedDriversLicense: updatedRoster.submitteddriverslicense,
              firstYear: updatedRoster.firstyear,
              contact: updatedRosterMember.roster.contacts,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/release
 * Release a player from the team (set inactive = true)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/release',
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
                accountid: accountId,
              },
            },
          },
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      if (rosterMember.inactive) {
        res.status(400).json({
          success: false,
          message: 'Player is already released',
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
                  lastname: true,
                },
              },
            },
          },
        },
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
            dateAdded: updatedRosterMember.dateadded
              ? updatedRosterMember.dateadded.toISOString()
              : null,
            player: {
              id: updatedRosterMember.roster.id,
              contactId: updatedRosterMember.roster.contactid,
              contact: updatedRosterMember.roster.contacts,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId/activate
 * Reactivate a released player (set inactive = false)
 */
router.put(
  '/:teamSeasonId/roster/:rosterMemberId/activate',
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
                accountid: accountId,
              },
            },
          },
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      if (!rosterMember.inactive) {
        res.status(400).json({
          success: false,
          message: 'Player is already active',
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
                  lastname: true,
                },
              },
            },
          },
        },
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
            dateAdded: updatedRosterMember.dateadded
              ? updatedRosterMember.dateadded.toISOString()
              : null,
            player: {
              id: updatedRosterMember.roster.id,
              contactId: updatedRosterMember.roster.contactid,
              contact: updatedRosterMember.roster.contacts,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/roster/:rosterMemberId
 * Permanently delete a player from the roster (with warning)
 */
router.delete(
  '/:teamSeasonId/roster/:rosterMemberId',
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
                accountid: accountId,
              },
            },
          },
        },
        include: {
          roster: {
            include: {
              contacts: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      if (!rosterMember) {
        res.status(404).json({ success: false, message: 'Roster member not found' });
        return;
      }

      // Permanently delete the roster member
      await prisma.rosterseason.delete({
        where: { id: rosterMemberId },
      });

      res.json({
        success: true,
        data: {
          message: `Player "${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}" has been permanently removed from the roster`,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Get a single team season's info
 */
router.get(
  '/:teamSeasonId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Find the team season
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          teams: true,
        },
      });

      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          teamSeason: {
            id: teamSeason.id.toString(),
            name: teamSeason.name,
            webAddress: teamSeason.teams.webaddress,
            youtubeUserId: teamSeason.teams.youtubeuserid,
            defaultVideo: teamSeason.teams.defaultvideo,
            autoPlayVideo: teamSeason.teams.autoplayvideo,
            logoUrl: getLogoUrl(accountId.toString(), teamSeason.teamid.toString()),
            // Add more fields as needed
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Update team information (name and logo)
 */
router.put(
  '/:teamSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('logo')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(400).json({
          success: false,
          message: message,
        });
      } else {
        next();
      }
    });
  },
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const { name } = req.body;

      // Validate team name
      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Team name is required',
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
              accountid: accountId,
            },
          },
        },
        include: {
          teams: true,
        },
      });

      if (!teamSeason) {
        res.status(404).json({
          success: false,
          message: 'Team season not found',
        });
        return;
      }

      // Check if team name already exists in this league season
      const existingTeam = await prisma.teamsseason.findFirst({
        where: {
          leagueseasonid: teamSeason.leagueseasonid,
          name: name.trim(),
          id: { not: teamSeasonId },
        },
      });

      if (existingTeam) {
        res.status(409).json({
          success: false,
          message: 'A team with this name already exists in this league',
        });
        return;
      }

      // Handle logo upload if provided
      let logoUrl = null;
      if (req.file) {
        // Validate the uploaded file
        const validationError = validateLogoFile(req.file);
        if (validationError) {
          res.status(400).json({
            success: false,
            message: validationError,
          });
          return;
        }

        try {
          // Save the logo using the storage service
          await storageService.saveLogo(
            accountId.toString(),
            teamSeason.teamid.toString(),
            req.file.buffer,
          );

          // Generate the public logo URL for the response
          logoUrl = getLogoUrl(accountId.toString(), teamSeason.teamid.toString());
        } catch (error) {
          console.error('Error saving logo:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to save logo',
          });
          return;
        }
      }

      // Update team season name
      const updatedTeamSeason = await prisma.teamsseason.update({
        where: {
          id: teamSeasonId,
        },
        data: {
          name: name.trim(),
        },
        include: {
          teams: {
            select: {
              id: true,
              webaddress: true,
              youtubeuserid: true,
              defaultvideo: true,
              autoplayvideo: true,
            },
          },
          leagueseason: {
            include: {
              league: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          team: {
            id: updatedTeamSeason.id.toString(),
            name: updatedTeamSeason.name,
            teamId: updatedTeamSeason.teamid.toString(),
            league: {
              id: updatedTeamSeason.leagueseason.league.id.toString(),
              name: updatedTeamSeason.leagueseason.league.name,
            },
            webAddress: updatedTeamSeason.teams.webaddress,
            youtubeUserId: updatedTeamSeason.teams.youtubeuserid,
            defaultVideo: updatedTeamSeason.teams.defaultvideo,
            autoPlayVideo: updatedTeamSeason.teams.autoplayvideo,
            logoUrl: logoUrl,
          },
        },
        message: `Team "${updatedTeamSeason.name}" has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/logo
 * Get team logo from S3 or local storage
 */
router.get(
  '/:teamSeasonId/logo',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const accountId = req.params.accountId;
      const seasonId = req.params.seasonId;
      const teamSeasonId = req.params.teamSeasonId;

      // First, get the team season to find the teamId
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: BigInt(teamSeasonId),
          leagueseason: {
            seasonid: BigInt(seasonId),
            league: {
              accountid: BigInt(accountId),
            },
          },
        },
        include: {
          teams: true,
        },
      });

      if (!teamSeason) {
        res.status(404).json({
          success: false,
          message: 'Team season not found',
        });
        return;
      }

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
    } catch (error) {
      console.error('Error serving team logo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to serve logo',
      });
    }
  },
);

/**
 * GET /api/accounts/:accountId/teams/:teamId/logo
 * Get team logo from S3 or local storage
 */
router.get(
  '/:teamId/logo',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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
    } catch (error) {
      console.error('Error serving team logo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to serve logo',
      });
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/record
 * Get win/loss/tie record for a team season
 */
router.get(
  '/:teamSeasonId/record',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Fetch all games for this team in this league season where status is 1, 4, or 5
      const games = await prisma.leagueschedule.findMany({
        where: {
          OR: [{ hteamid: teamSeasonId }, { vteamid: teamSeasonId }],
          gamestatus: { in: [1, 4, 5] },
        },
        select: {
          hteamid: true,
          vteamid: true,
          hscore: true,
          vscore: true,
          gamestatus: true,
        },
      });

      // Calculate record
      let wins = 0,
        losses = 0,
        ties = 0;
      for (const game of games) {
        const isHome = game.hteamid === teamSeasonId;
        const ourScore = isHome ? game.hscore : game.vscore;
        const oppScore = isHome ? game.vscore : game.hscore;
        const status = game.gamestatus;

        if (status === 5) {
          // Did not report
          losses++;
        } else if (ourScore > oppScore) {
          wins++;
        } else if (ourScore < oppScore) {
          losses++;
        } else if (status === 4) {
          // Forfeit, if tie score, then both teams get a loss (double forfeit)
          losses++;
        } else {
          ties++;
        }
      }

      res.json({
        success: true,
        data: {
          teamSeasonId: teamSeasonId.toString(),
          record: { wins, losses, ties },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/games
 * Get upcoming and/or recent games for a team season
 */
router.get(
  '/:teamSeasonId/games',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const { upcoming, recent, limit } = req.query;
      const limitNum = Number(limit) > 0 ? Number(limit) : 5;
      const includeUpcoming = upcoming === 'true' || (!upcoming && !recent);
      const includeRecent = recent === 'true' || (!upcoming && !recent);

      // Validate team/season/account relationship
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          leagueseason: {
            include: {
              league: true,
            },
          },
        },
      });
      if (!teamSeason) {
        res.status(404).json({ success: false, message: 'Team season not found' });
        return;
      }

      // Helper to map game to API shape
      const getTeamNames = async (homeTeamId: bigint, awayTeamId: bigint) => {
        const teams = await prisma.teamsseason.findMany({
          where: {
            id: { in: [homeTeamId, awayTeamId] },
          },
          select: { id: true, name: true },
        });
        const homeTeam = teams.find((t) => t.id === homeTeamId);
        const awayTeam = teams.find((t) => t.id === awayTeamId);
        return {
          homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
          awayTeamName: awayTeam?.name || `Team ${awayTeamId}`,
        };
      };

      const mapGame = async (
        game: leagueschedule & { availablefields?: availablefields | null },
      ) => {
        const teamNames = await getTeamNames(game.hteamid, game.vteamid);
        // Check if any gamerecap exists for this game
        const recapCount = await prisma.gamerecap.count({
          where: { gameid: game.id },
        });
        return {
          id: game.id.toString(),
          date: game.gamedate ? game.gamedate.toISOString() : null,
          homeTeamId: game.hteamid ? game.hteamid.toString() : null,
          awayTeamId: game.vteamid ? game.vteamid.toString() : null,
          homeTeamName: teamNames.homeTeamName,
          awayTeamName: teamNames.awayTeamName,
          homeScore: game.hscore,
          awayScore: game.vscore,
          gameStatus: game.gamestatus,
          gameStatusText: getGameStatusText(game.gamestatus),
          gameStatusShortText: getGameStatusShortText(game.gamestatus),
          leagueName: teamSeason.leagueseason.league.name,
          fieldId: game.fieldid ? game.fieldid.toString() : null,
          fieldName: game.availablefields ? game.availablefields.name : null,
          fieldShortName: game.availablefields ? game.availablefields.shortname : null,
          hasGameRecap: recapCount > 0,
        };
      };

      const now = new Date();
      let upcomingGames: (leagueschedule & { availablefields?: availablefields | null })[] = [];
      let recentGames: (leagueschedule & { availablefields?: availablefields | null })[] = [];

      if (includeUpcoming) {
        // Upcoming: games in the future, order by soonest
        upcomingGames = await prisma.leagueschedule.findMany({
          where: {
            gamedate: { gte: now },
            leagueseason: {
              seasonid: seasonId,
            },
            OR: [{ hteamid: teamSeason.id }, { vteamid: teamSeason.id }],
          },
          include: { availablefields: true },
          orderBy: { gamedate: 'asc' },
          take: limitNum,
        });
      }
      if (includeRecent) {
        // Recent: games in the past, order by most recent
        recentGames = await prisma.leagueschedule.findMany({
          where: {
            gamedate: { lt: now },
            leagueseason: {
              seasonid: seasonId,
            },
            OR: [{ hteamid: teamSeason.id }, { vteamid: teamSeason.id }],
          },
          include: { availablefields: true },
          orderBy: { gamedate: 'desc' },
          take: limitNum,
        });
      }

      // Map games with team names (async)
      const mappedUpcoming = includeUpcoming
        ? await Promise.all(upcomingGames.map(mapGame))
        : undefined;
      const mappedRecent = includeRecent ? await Promise.all(recentGames.map(mapGame)) : undefined;

      res.json({
        success: true,
        data: {
          ...(includeUpcoming ? { upcoming: mappedUpcoming } : {}),
          ...(includeRecent ? { recent: mappedRecent } : {}),
        },
      });
    } catch (error) {
      console.error('Team games route error:', error);
      next(error);
    }
  },
);

export default router;
