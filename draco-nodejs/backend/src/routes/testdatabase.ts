import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { DateUtils } from '../utils/dateUtils.js';

const testDatabaseRouter = Router();
testDatabaseRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await prisma.accounts.findMany({
      take: 5,
    });

    res.json({ success: true, data: accounts });
  }),
);

testDatabaseRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await prisma.aspnetusers.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        passwordhash: true,
      },
      take: 10,
    });

    res.json({ success: true, data: users });
  }),
);

testDatabaseRouter.get(
  '/leagueschedule',
  asyncHandler(async (req, res) => {
    const games = await prisma.leagueschedule.findMany({
      select: {
        id: true,
        gamedate: true,
        hteamid: true,
        vteamid: true,
        hscore: true,
        vscore: true,
        gamestatus: true,
      },
      take: 5,
    });

    res.json({
      success: true,
      data: games.map((game) => ({
        id: game.id.toString(),
        gamedate: game.gamedate ? DateUtils.formatDateTimeForResponse(game.gamedate) : null,
        hteamid: game.hteamid.toString(),
        vteamid: game.vteamid.toString(),
        hscore: game.hscore,
        vscore: game.vscore,
        gamestatus: game.gamestatus,
      })),
    });
  }),
);

export default testDatabaseRouter;
