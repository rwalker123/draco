import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  CreatePlayerSurveyCategorySchema,
  CreatePlayerSurveyCategoryType,
  UpdatePlayerSurveyCategorySchema,
  UpdatePlayerSurveyCategoryType,
  CreatePlayerSurveyQuestionSchema,
  CreatePlayerSurveyQuestionType,
  UpdatePlayerSurveyQuestionSchema,
  UpdatePlayerSurveyQuestionType,
  PlayerSurveyListQuerySchema,
  PlayerSurveyAnswerUpsertSchema,
  PlayerSurveyAnswerUpsertType,
} from '@draco/shared-schemas';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import { ROLE_IDS } from '../config/roles.js';
import { RoleNamesType } from '../types/roles.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const playerSurveyService = ServiceFactory.getPlayerSurveyService();

const buildAnswerActorContext = (req: Request) => {
  const contactId = req.accountBoundary?.contactId;
  if (!contactId) {
    throw new ValidationError('Contact context is required');
  }

  const isAccountAdmin =
    req.userRoles?.contactRoles?.some(
      (role) => role.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN],
    ) ?? false;

  return {
    contactId,
    isAccountAdmin,
  };
};

router.get(
  '/:accountId/surveys/categories',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.id) {
      const enforceBoundary = routeProtection.enforceAccountBoundary();
      try {
        await new Promise<void>((resolve, reject) => {
          enforceBoundary(req, res, (err?: unknown) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      } catch (error) {
        next(error);
        return;
      }
    }

    const { accountId } = extractAccountParams(req.params);
    const categories = await playerSurveyService.listCategories(accountId);
    res.json(categories);
  }),
);

router.post(
  '/:accountId/surveys/categories',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: CreatePlayerSurveyCategoryType = CreatePlayerSurveyCategorySchema.parse(
      req.body,
    );
    const category = await playerSurveyService.createCategory(accountId, payload);
    res.status(201).json(category);
  }),
);

router.put(
  '/:accountId/surveys/categories/:categoryId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, categoryId } = extractBigIntParams(req.params, 'accountId', 'categoryId');
    const payload: UpdatePlayerSurveyCategoryType = UpdatePlayerSurveyCategorySchema.parse(
      req.body,
    );
    const category = await playerSurveyService.updateCategory(accountId, categoryId, payload);
    res.json(category);
  }),
);

router.delete(
  '/:accountId/surveys/categories/:categoryId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, categoryId } = extractBigIntParams(req.params, 'accountId', 'categoryId');
    await playerSurveyService.deleteCategory(accountId, categoryId);
    res.status(204).send();
  }),
);

router.post(
  '/:accountId/surveys/categories/:categoryId/questions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: CreatePlayerSurveyQuestionType = CreatePlayerSurveyQuestionSchema.parse({
      ...req.body,
      categoryId: req.params.categoryId,
    });
    const question = await playerSurveyService.createQuestion(accountId, payload);
    res.status(201).json(question);
  }),
);

router.put(
  '/:accountId/surveys/questions/:questionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, questionId } = extractBigIntParams(req.params, 'accountId', 'questionId');
    const payload: UpdatePlayerSurveyQuestionType = UpdatePlayerSurveyQuestionSchema.parse(
      req.body,
    );
    const question = await playerSurveyService.updateQuestion(accountId, questionId, payload);
    res.json(question);
  }),
);

router.delete(
  '/:accountId/surveys/questions/:questionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.player-surveys.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, questionId } = extractBigIntParams(req.params, 'accountId', 'questionId');
    await playerSurveyService.deleteQuestion(accountId, questionId);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/surveys/answers',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = PlayerSurveyListQuerySchema.parse({
      page: req.query.page,
      pageSize: req.query.pageSize,
      search: req.query.search,
    });
    const surveys = await playerSurveyService.listPlayerSurveys(accountId, query);
    res.json(surveys);
  }),
);

router.get(
  '/:accountId/surveys/answers/:playerId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.id) {
      const enforceBoundary = routeProtection.enforceAccountBoundary();
      try {
        await new Promise<void>((resolve, reject) => {
          enforceBoundary(req, res, (err?: unknown) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      } catch (error) {
        next(error);
        return;
      }
    }

    const { accountId, playerId } = extractBigIntParams(req.params, 'accountId', 'playerId');
    const survey = await playerSurveyService.getPlayerSurvey(accountId, playerId);
    res.json(survey);
  }),
);

router.put(
  '/:accountId/surveys/answers/:playerId/questions/:questionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, playerId, questionId } = extractBigIntParams(
      req.params,
      'accountId',
      'playerId',
      'questionId',
    );
    const payload: PlayerSurveyAnswerUpsertType = PlayerSurveyAnswerUpsertSchema.parse(req.body);
    const actor = buildAnswerActorContext(req);
    const answer = await playerSurveyService.upsertAnswer(
      accountId,
      playerId,
      questionId,
      payload,
      actor,
    );
    res.json(answer);
  }),
);

router.delete(
  '/:accountId/surveys/answers/:playerId/questions/:questionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, playerId, questionId } = extractBigIntParams(
      req.params,
      'accountId',
      'playerId',
      'questionId',
    );
    const actor = buildAnswerActorContext(req);
    await playerSurveyService.deleteAnswer(accountId, playerId, questionId, actor);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/surveys/spotlight',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const spotlight = await playerSurveyService.getAccountSpotlight(accountId);
    if (!spotlight) {
      res.status(404).send();
      return;
    }
    res.json(spotlight);
  }),
);

router.get(
  '/:accountId/surveys/teams/:teamSeasonId/spotlight',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'teamSeasonId',
    );
    const spotlight = await playerSurveyService.getTeamSpotlight(accountId, teamSeasonId);
    if (!spotlight) {
      res.status(404).send();
      return;
    }
    res.json(spotlight);
  }),
);

export default router;
