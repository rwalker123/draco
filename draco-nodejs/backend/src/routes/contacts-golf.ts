import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const golferService = ServiceFactory.getGolferService();

router.get(
  '/individual/player-scores',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId } = extractBigIntParams(req.params, 'contactId');
    const result = await golferService.getIndividualGolfAccountForContact(contactId);
    res.json(result);
  }),
);

export default router;
