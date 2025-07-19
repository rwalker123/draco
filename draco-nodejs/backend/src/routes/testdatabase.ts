import { Router } from 'express';
import prisma from '../lib/prisma';

const testDatabaseRouter = Router();
testDatabaseRouter.get('/', async (req, res, _next) => {
  try {
    const accounts = await prisma.accounts.findMany({
      take: 5,
    });

    res.json({ success: true, data: accounts });
  } catch (err) {
    _next(err);
  }
});

testDatabaseRouter.get('/users', async (req, res, _next) => {
  try {
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
  } catch (err) {
    _next(err);
  }
});

testDatabaseRouter.get('/leagueschedule', async (req, res, _next) => {
  try {
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
        gamedate: game.gamedate ? game.gamedate.toISOString() : null,
        hteamid: game.hteamid.toString(),
        vteamid: game.vteamid.toString(),
        hscore: game.hscore,
        vscore: game.vscore,
        gamestatus: game.gamestatus,
      })),
    });
  } catch (err) {
    _next(err);
  }
});

export default testDatabaseRouter;
