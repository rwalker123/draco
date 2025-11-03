import {
  CreatePlayerSurveyCategoryType,
  UpdatePlayerSurveyCategoryType,
  CreatePlayerSurveyQuestionType,
  UpdatePlayerSurveyQuestionType,
  PlayerSurveyCategoryType,
  PlayerSurveyQuestionType,
  PlayerSurveyListQueryType,
  PlayerSurveySummaryListResponseType,
  PlayerSurveyDetailType,
  PlayerSurveyAnswerUpsertType,
  PlayerSurveyAnswerType,
  PlayerSurveySpotlightType,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IPlayerSurveyRepository,
  ISeasonsRepository,
} from '../repositories/index.js';
import { PlayerSurveyResponseFormatter } from '../responseFormatters/playerSurveyResponseFormatter.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/customErrors.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { getContactPhotoUrl } from '../config/logo.js';
import { ServiceFactory } from './serviceFactory.js';
import { ROLE_IDS } from '../config/roles.js';
import { RoleNamesType } from '../types/roles.js';

interface ViewerContext {
  contactId?: bigint;
  isAccountAdmin?: boolean;
}

interface AnswerActorContext {
  contactId: bigint;
  isAccountAdmin: boolean;
}

export class PlayerSurveyService {
  private readonly surveyRepository: IPlayerSurveyRepository;
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly contactRepository: IContactRepository;
  private readonly roleService = ServiceFactory.getRoleService();

  constructor() {
    this.surveyRepository = RepositoryFactory.getPlayerSurveyRepository();
    this.seasonsRepository = RepositoryFactory.getSeasonsRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
  }

  async listCategories(accountId: bigint): Promise<PlayerSurveyCategoryType[]> {
    const categories = await this.surveyRepository.listCategories(accountId);
    return PlayerSurveyResponseFormatter.formatCategories(accountId, categories);
  }

  async createCategory(
    accountId: bigint,
    payload: CreatePlayerSurveyCategoryType,
  ): Promise<PlayerSurveyCategoryType> {
    const categoryName = payload.categoryName.trim();
    if (!categoryName) {
      throw new ValidationError('Category name is required');
    }

    const created = await this.surveyRepository.createCategory(accountId, {
      categoryName,
      priority: payload.priority ?? 0,
    });

    return PlayerSurveyResponseFormatter.formatCategory(accountId, created);
  }

  async updateCategory(
    accountId: bigint,
    categoryId: bigint,
    payload: UpdatePlayerSurveyCategoryType,
  ): Promise<PlayerSurveyCategoryType> {
    const updateData: Partial<{ categoryName: string; priority: number }> = {};

    if (payload.categoryName !== undefined) {
      const trimmed = payload.categoryName.trim();
      if (!trimmed) {
        throw new ValidationError('Category name cannot be empty');
      }
      updateData.categoryName = trimmed;
    }

    if (payload.priority !== undefined) {
      updateData.priority = payload.priority;
    }

    const updated = await this.surveyRepository.updateCategory(accountId, categoryId, updateData);
    if (!updated) {
      throw new NotFoundError('Survey category not found');
    }

    return PlayerSurveyResponseFormatter.formatCategory(accountId, updated);
  }

  async deleteCategory(accountId: bigint, categoryId: bigint): Promise<void> {
    const deleted = await this.surveyRepository.deleteCategory(accountId, categoryId);
    if (!deleted) {
      throw new NotFoundError('Survey category not found');
    }
  }

  async createQuestion(
    accountId: bigint,
    payload: CreatePlayerSurveyQuestionType,
  ): Promise<PlayerSurveyQuestionType> {
    const question = payload.question.trim();
    if (!question) {
      throw new ValidationError('Question text is required');
    }

    const categoryId = this.parseId(payload.categoryId, 'categoryId');
    const created = await this.surveyRepository.createQuestion(accountId, categoryId, {
      question,
      questionNumber: payload.questionNumber,
    });

    if (!created) {
      throw new NotFoundError('Survey category not found');
    }

    return PlayerSurveyResponseFormatter.formatQuestion(accountId, created);
  }

  async updateQuestion(
    accountId: bigint,
    questionId: bigint,
    payload: UpdatePlayerSurveyQuestionType,
  ): Promise<PlayerSurveyQuestionType> {
    const updateData: Partial<{ question: string; questionNumber: number }> = {};

    if (payload.question !== undefined) {
      const trimmed = payload.question.trim();
      if (!trimmed) {
        throw new ValidationError('Question text cannot be empty');
      }
      updateData.question = trimmed;
    }

    if (payload.questionNumber !== undefined) {
      updateData.questionNumber = payload.questionNumber;
    }

    const updated = await this.surveyRepository.updateQuestion(accountId, questionId, updateData);
    if (!updated) {
      throw new NotFoundError('Survey question not found');
    }

    return PlayerSurveyResponseFormatter.formatQuestion(accountId, updated);
  }

  async deleteQuestion(accountId: bigint, questionId: bigint): Promise<void> {
    const deleted = await this.surveyRepository.deleteQuestion(accountId, questionId);
    if (!deleted) {
      throw new NotFoundError('Survey question not found');
    }
  }

  async listPlayerSurveys(
    accountId: bigint,
    query: PlayerSurveyListQueryType,
  ): Promise<PlayerSurveySummaryListResponseType> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const currentSeason = await this.seasonsRepository.findCurrentSeason(accountId);

    if (!currentSeason) {
      return PlayerSurveyResponseFormatter.formatSurveyList(
        accountId,
        { players: [], total: 0 },
        page,
        pageSize,
      );
    }

    const result = await this.surveyRepository.listPlayerSurveys(accountId, currentSeason.id, {
      search: query.search,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return PlayerSurveyResponseFormatter.formatSurveyList(accountId, result, page, pageSize);
  }

  async getPlayerSurvey(accountId: bigint, playerId: bigint): Promise<PlayerSurveyDetailType> {
    const playerContact = await this.contactRepository.findContactInAccount(playerId, accountId);
    if (!playerContact) {
      throw new NotFoundError('Player not found');
    }

    const currentSeason = await this.seasonsRepository.findCurrentSeason(accountId);
    if (currentSeason) {
      await this.surveyRepository.isPlayerActiveInSeason(accountId, currentSeason.id, playerId);
    }

    // Allow survey retrieval regardless of current season participation.

    const survey = await this.surveyRepository.getPlayerSurvey(accountId, playerId);
    if (!survey) {
      return {
        player: {
          id: playerId.toString(),
          firstName: playerContact.firstname,
          lastName: playerContact.lastname,
          photoUrl: getContactPhotoUrl(accountId.toString(), playerId.toString()),
        },
        answers: [],
      };
    }

    return PlayerSurveyResponseFormatter.formatSurveyDetail(accountId, survey);
  }

  async resolveViewerContext(
    accountId: bigint,
    userId?: string,
  ): Promise<ViewerContext | undefined> {
    if (!userId) {
      return undefined;
    }

    let contactId: bigint | undefined;
    try {
      const contact = await this.contactRepository.findByUserId(userId, accountId);
      if (contact) {
        contactId = contact.id;
      }
    } catch (_error) {
      contactId = undefined;
    }

    const roleCheck = await this.roleService.hasRole(
      userId,
      ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN],
      {
        accountId,
        teamId: undefined,
        leagueId: undefined,
        seasonId: undefined,
      },
    );

    return {
      contactId,
      isAccountAdmin: roleCheck.hasRole,
    };
  }

  async upsertAnswer(
    accountId: bigint,
    playerId: bigint,
    questionId: bigint,
    payload: PlayerSurveyAnswerUpsertType,
    actor: AnswerActorContext,
  ): Promise<PlayerSurveyAnswerType> {
    this.ensureCanModifyAnswer(playerId, actor);

    const trimmed = payload.answer.trim();
    if (!trimmed) {
      throw new ValidationError('Answer text is required');
    }

    const updated = await this.surveyRepository.upsertAnswer(
      accountId,
      playerId,
      questionId,
      trimmed,
    );
    return PlayerSurveyResponseFormatter.formatAnswer(updated);
  }

  async deleteAnswer(
    accountId: bigint,
    playerId: bigint,
    questionId: bigint,
    actor: AnswerActorContext,
  ): Promise<void> {
    this.ensureCanModifyAnswer(playerId, actor);

    const deleted = await this.surveyRepository.deleteAnswer(accountId, playerId, questionId);
    if (!deleted) {
      throw new NotFoundError('Survey answer not found');
    }
  }

  async getAccountSpotlight(accountId: bigint): Promise<PlayerSurveySpotlightType | null> {
    const currentSeason = await this.seasonsRepository.findCurrentSeason(accountId);
    if (!currentSeason) {
      return null;
    }

    const spotlight = await this.surveyRepository.findRandomAccountAnswer(
      accountId,
      currentSeason.id,
    );
    if (!spotlight) {
      return null;
    }

    return PlayerSurveyResponseFormatter.formatSpotlight(accountId, spotlight);
  }

  async getTeamSpotlight(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<PlayerSurveySpotlightType | null> {
    const spotlight = await this.surveyRepository.findRandomTeamAnswer(accountId, teamSeasonId);
    if (!spotlight) {
      return null;
    }

    return PlayerSurveyResponseFormatter.formatSpotlight(accountId, spotlight);
  }

  private ensureCanModifyAnswer(playerId: bigint, actor: AnswerActorContext) {
    if (actor.contactId === playerId) {
      return;
    }

    if (actor.isAccountAdmin) {
      return;
    }

    throw new AuthorizationError('You do not have permission to modify this survey response');
  }

  private canViewInactiveSurvey(playerId: bigint, viewer?: ViewerContext): boolean {
    if (!viewer) {
      return false;
    }

    if (viewer.contactId === playerId) {
      return true;
    }

    return viewer.isAccountAdmin === true;
  }

  private parseId(raw: string, fieldName: string): bigint {
    try {
      return BigInt(raw);
    } catch (_error) {
      throw new ValidationError(`Invalid ${fieldName}`);
    }
  }
}
