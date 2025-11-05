import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpsertLeagueFaqSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const leagueFaqService = ServiceFactory.getLeagueFaqService();

router.get(
  '/:accountId/league-faq',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const faqs = await leagueFaqService.listAccountFaqs(accountId);

    res.json(faqs);
  }),
);

router.get(
  '/:accountId/league-faq/:faqId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { faqId } = extractBigIntParams(req.params, 'faqId');

    const faq = await leagueFaqService.getAccountFaq(accountId, faqId);

    res.json(faq);
  }),
);

router.post(
  '/:accountId/league-faq',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('league.faq.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = UpsertLeagueFaqSchema.parse(req.body);

    const faq = await leagueFaqService.createAccountFaq(accountId, payload);

    res.status(201).json(faq);
  }),
);

router.put(
  '/:accountId/league-faq/:faqId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('league.faq.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { faqId } = extractBigIntParams(req.params, 'faqId');
    const payload = UpsertLeagueFaqSchema.parse(req.body);

    const faq = await leagueFaqService.updateAccountFaq(accountId, faqId, payload);

    res.json(faq);
  }),
);

router.delete(
  '/:accountId/league-faq/:faqId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('league.faq.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { faqId } = extractBigIntParams(req.params, 'faqId');

    await leagueFaqService.deleteAccountFaq(accountId, faqId);

    res.status(204).send();
  }),
);

export default router;
