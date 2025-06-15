import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const testDatabaseRouter = Router();
const prisma = new PrismaClient();

testDatabaseRouter.get('/', async (req, res, next) => {
  try {
    const accounts = await prisma.accounts.findMany({
      take: 5
    });
    
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
});

testDatabaseRouter.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.aspnetusers.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        passwordhash: true
      },
      take: 10
    });
    
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

export default testDatabaseRouter; 