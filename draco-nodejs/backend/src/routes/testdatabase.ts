import { Router } from 'express';
import { PrismaClient } from '../../src/generated/prisma';

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

export default testDatabaseRouter; 