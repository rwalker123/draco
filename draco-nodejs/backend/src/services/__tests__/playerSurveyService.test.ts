import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: {
    getPlayerSurveyRepository: vi.fn(),
    getSeasonsRepository: vi.fn(),
    getContactRepository: vi.fn(),
  },
}));

vi.mock('../serviceFactory.js', () => ({
  ServiceFactory: {
    getRoleService: vi.fn(),
  },
}));

import { PlayerSurveyService } from '../playerSurveyService.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../utils/customErrors.js';
import { RepositoryFactory } from '../../repositories/index.js';
import { ServiceFactory } from '../serviceFactory.js';
import {
  dbPlayerSurveyCategory,
  dbPlayerSurveyQuestion,
  dbPlayerSurveyAnswer,
  dbPlayerSurveyContactWithAnswers,
  dbPlayerSurveyListResult,
  dbPlayerSurveySpotlight,
} from '../../repositories/types/dbTypes.js';
import type { IPlayerSurveyRepository } from '../../repositories/interfaces/IPlayerSurveyRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { IContactRepository } from '../../repositories/interfaces/IContactRepository.js';
import type { PlayerSurveyAnswerUpsertType } from '@draco/shared-schemas';

class PlayerSurveyRepositoryMock implements IPlayerSurveyRepository {
  listCategoriesMock = vi.fn<(accountId: bigint) => Promise<dbPlayerSurveyCategory[]>>();
  createCategoryMock =
    vi.fn<
      (
        accountId: bigint,
        data: { categoryName: string; priority: number },
      ) => Promise<dbPlayerSurveyCategory>
    >();
  updateCategoryMock =
    vi.fn<
      (
        accountId: bigint,
        categoryId: bigint,
        data: Partial<{ categoryName: string; priority: number }>,
      ) => Promise<dbPlayerSurveyCategory | null>
    >();
  deleteCategoryMock = vi.fn<(accountId: bigint, categoryId: bigint) => Promise<boolean>>();
  createQuestionMock =
    vi.fn<
      (
        accountId: bigint,
        categoryId: bigint,
        data: { question: string; questionNumber: number },
      ) => Promise<dbPlayerSurveyQuestion | null>
    >();
  updateQuestionMock =
    vi.fn<
      (
        accountId: bigint,
        questionId: bigint,
        data: Partial<{ question: string; questionNumber: number }>,
      ) => Promise<dbPlayerSurveyQuestion | null>
    >();
  deleteQuestionMock = vi.fn<(accountId: bigint, questionId: bigint) => Promise<boolean>>();
  listPlayerSurveysMock =
    vi.fn<
      (
        accountId: bigint,
        seasonId: bigint,
        options: { search?: string; skip: number; take: number },
      ) => Promise<dbPlayerSurveyListResult>
    >();
  getPlayerSurveyMock =
    vi.fn<
      (accountId: bigint, playerId: bigint) => Promise<dbPlayerSurveyContactWithAnswers | null>
    >();
  upsertAnswerMock =
    vi.fn<
      (
        accountId: bigint,
        playerId: bigint,
        questionId: bigint,
        answer: string,
      ) => Promise<dbPlayerSurveyAnswer>
    >();
  deleteAnswerMock =
    vi.fn<(accountId: bigint, playerId: bigint, questionId: bigint) => Promise<boolean>>();
  findRandomAccountAnswerMock =
    vi.fn<(accountId: bigint, seasonId: bigint) => Promise<dbPlayerSurveySpotlight | null>>();
  findRandomTeamAnswerMock =
    vi.fn<(accountId: bigint, teamSeasonId: bigint) => Promise<dbPlayerSurveySpotlight | null>>();
  isPlayerActiveInSeasonMock =
    vi.fn<(accountId: bigint, seasonId: bigint, playerId: bigint) => Promise<boolean>>();
  isPlayerActiveInTeamMock =
    vi.fn<(accountId: bigint, teamSeasonId: bigint, playerId: bigint) => Promise<boolean>>();

  listCategories(accountId: bigint): Promise<dbPlayerSurveyCategory[]> {
    return this.listCategoriesMock(accountId);
  }
  createCategory(accountId: bigint, data: { categoryName: string; priority: number }) {
    return this.createCategoryMock(accountId, data);
  }
  updateCategory(
    accountId: bigint,
    categoryId: bigint,
    data: Partial<{ categoryName: string; priority: number }>,
  ) {
    return this.updateCategoryMock(accountId, categoryId, data);
  }
  deleteCategory(accountId: bigint, categoryId: bigint): Promise<boolean> {
    return this.deleteCategoryMock(accountId, categoryId);
  }
  createQuestion(
    accountId: bigint,
    categoryId: bigint,
    data: { question: string; questionNumber: number },
  ) {
    return this.createQuestionMock(accountId, categoryId, data);
  }
  updateQuestion(
    accountId: bigint,
    questionId: bigint,
    data: Partial<{ question: string; questionNumber: number }>,
  ) {
    return this.updateQuestionMock(accountId, questionId, data);
  }
  deleteQuestion(accountId: bigint, questionId: bigint): Promise<boolean> {
    return this.deleteQuestionMock(accountId, questionId);
  }
  listPlayerSurveys(
    accountId: bigint,
    seasonId: bigint,
    options: { search?: string | undefined; skip: number; take: number },
  ): Promise<dbPlayerSurveyListResult> {
    return this.listPlayerSurveysMock(accountId, seasonId, options);
  }
  getPlayerSurvey(
    accountId: bigint,
    playerId: bigint,
  ): Promise<dbPlayerSurveyContactWithAnswers | null> {
    return this.getPlayerSurveyMock(accountId, playerId);
  }
  upsertAnswer(
    accountId: bigint,
    playerId: bigint,
    questionId: bigint,
    answer: string,
  ): Promise<dbPlayerSurveyAnswer> {
    return this.upsertAnswerMock(accountId, playerId, questionId, answer);
  }
  deleteAnswer(accountId: bigint, playerId: bigint, questionId: bigint): Promise<boolean> {
    return this.deleteAnswerMock(accountId, playerId, questionId);
  }
  findRandomAccountAnswer(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null> {
    return this.findRandomAccountAnswerMock(accountId, seasonId);
  }
  findRandomTeamAnswer(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null> {
    return this.findRandomTeamAnswerMock(accountId, teamSeasonId);
  }
  isPlayerActiveInSeason(accountId: bigint, seasonId: bigint, playerId: bigint): Promise<boolean> {
    return this.isPlayerActiveInSeasonMock(accountId, seasonId, playerId);
  }
  isPlayerActiveInTeam(
    accountId: bigint,
    teamSeasonId: bigint,
    playerId: bigint,
  ): Promise<boolean> {
    return this.isPlayerActiveInTeamMock(accountId, teamSeasonId, playerId);
  }
}

class SeasonsRepositoryMock implements ISeasonsRepository {
  findAccountSeasons = vi.fn();
  findSeasonWithLeagues = vi.fn();
  findSeasonById = vi.fn();
  findSeasonByName = vi.fn();
  createSeason = vi.fn();
  updateSeasonName = vi.fn();
  deleteSeason = vi.fn();
  findCurrentSeason =
    vi.fn<(accountId: bigint) => Promise<{ id: bigint; accountid: bigint; name: string } | null>>();
  upsertCurrentSeason = vi.fn();
  createLeagueSeason = vi.fn();
  countSeasonParticipants = vi.fn();
  findSeasonParticipants = vi.fn();
}

class ContactRepositoryMock implements IContactRepository {
  findRosterByContactId = vi.fn();
  findContactInAccount = vi.fn();
  findAccountOwner = vi.fn();
  isAccountOwner = vi.fn();
  findByUserId = vi.fn();
  findContactsByUserIds = vi.fn();
  findContactsWithRolesByAccountId = vi.fn();
  findActiveSeasonRosterContacts = vi.fn();
  searchContactsWithRoles = vi.fn();
  searchContactsByName = vi.fn();
  findAvailableContacts = vi.fn();
  update = vi.fn();
  findById = vi.fn();
  create = vi.fn();
  delete = vi.fn();
  findMany = vi.fn();
  count = vi.fn();
}

const defaultCategory: dbPlayerSurveyCategory = {
  id: 1n,
  accountid: 100n,
  categoryname: 'Favorites',
  priority: 1,
  profilequestion: [
    {
      id: 10n,
      categoryid: 1n,
      question: 'Favorite food?',
      questionnum: 1,
    },
  ],
};

const defaultAnswer: dbPlayerSurveyAnswer = {
  id: 50n,
  playerid: 200n,
  questionid: 10n,
  answer: 'Pizza',
  profilequestion: {
    id: 10n,
    question: 'Favorite food?',
    questionnum: 1,
    profilecategory: {
      id: 1n,
      categoryname: 'Favorites',
      priority: 1,
    },
  },
};

const defaultSurveyContact: dbPlayerSurveyContactWithAnswers = {
  id: 200n,
  firstname: 'Alex',
  lastname: 'Player',
  middlename: '',
  playerprofile: [defaultAnswer],
};

const defaultListResult: dbPlayerSurveyListResult = {
  players: [defaultSurveyContact],
  total: 1,
};

const defaultSpotlight: dbPlayerSurveySpotlight = {
  playerId: 200n,
  firstName: 'Alex',
  lastName: 'Player',
  question: 'Favorite food?',
  answer: 'Pizza',
  photoUrl: null,
  teamName: null,
};

describe('PlayerSurveyService', () => {
  let repository: PlayerSurveyRepositoryMock;
  let seasonsRepository: SeasonsRepositoryMock;
  let contactRepository: ContactRepositoryMock;
  let service: PlayerSurveyService;
  const roleServiceMock = { hasRole: vi.fn() } as unknown as ReturnType<
    typeof ServiceFactory.getRoleService
  >;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new PlayerSurveyRepositoryMock();
    seasonsRepository = new SeasonsRepositoryMock();
    contactRepository = new ContactRepositoryMock();

    vi.spyOn(RepositoryFactory, 'getPlayerSurveyRepository').mockReturnValue(repository);
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepository);
    vi.spyOn(RepositoryFactory, 'getContactRepository').mockReturnValue(contactRepository);
    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(roleServiceMock);

    service = new PlayerSurveyService();
  });

  it('lists categories with formatting', async () => {
    repository.listCategoriesMock.mockResolvedValue([defaultCategory]);

    const result = await service.listCategories(100n);

    expect(repository.listCategoriesMock).toHaveBeenCalledWith(100n);
    expect(result).toEqual([
      {
        id: '1',
        accountId: '100',
        categoryName: 'Favorites',
        priority: 1,
        questions: [
          {
            id: '10',
            categoryId: '1',
            question: 'Favorite food?',
            questionNumber: 1,
          },
        ],
      },
    ]);
  });

  it('throws validation error when creating category with empty name', async () => {
    await expect(
      service.createCategory(100n, { categoryName: '   ', priority: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.createCategoryMock).not.toHaveBeenCalled();
  });

  it('allows player to update own answer', async () => {
    repository.upsertAnswerMock.mockResolvedValue(defaultAnswer);

    const payload: PlayerSurveyAnswerUpsertType = { answer: '  Pizza  ' };
    const result = await service.upsertAnswer(100n, 200n, 10n, payload, {
      contactId: 200n,
      isAccountAdmin: false,
    });

    expect(repository.upsertAnswerMock).toHaveBeenCalledWith(100n, 200n, 10n, 'Pizza');
    expect(result.answer).toBe('Pizza');
  });

  it('prevents non-admin editing another player answer', async () => {
    await expect(
      service.upsertAnswer(
        100n,
        200n,
        10n,
        { answer: 'Test' },
        {
          contactId: 201n,
          isAccountAdmin: false,
        },
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.upsertAnswerMock).not.toHaveBeenCalled();
  });

  it('allows admin to edit another player answer', async () => {
    repository.upsertAnswerMock.mockResolvedValue(defaultAnswer);

    await service.upsertAnswer(
      100n,
      200n,
      10n,
      { answer: 'Answer' },
      {
        contactId: 201n,
        isAccountAdmin: true,
      },
    );

    expect(repository.upsertAnswerMock).toHaveBeenCalled();
  });

  it('throws when player survey not available for non-active player and viewer is not owner/admin', async () => {
    contactRepository.findContactInAccount.mockResolvedValue({
      id: 200n,
      firstname: 'Alex',
      lastname: 'Player',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date(),
      middlename: null,
      creatoraccountid: 100n,
      userid: null,
    });
    seasonsRepository.findCurrentSeason.mockResolvedValue({
      id: 10n,
      accountid: 100n,
      name: 'Season',
    });
    repository.isPlayerActiveInSeasonMock.mockResolvedValue(false);

    await expect(service.getPlayerSurvey(100n, 200n)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns survey detail for owner even if not active', async () => {
    contactRepository.findContactInAccount.mockResolvedValue({
      id: 200n,
      firstname: 'Alex',
      lastname: 'Player',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date(),
      middlename: null,
      creatoraccountid: 100n,
      userid: null,
    });
    seasonsRepository.findCurrentSeason.mockResolvedValue({
      id: 10n,
      accountid: 100n,
      name: 'Season',
    });
    repository.isPlayerActiveInSeasonMock.mockResolvedValue(false);
    repository.getPlayerSurveyMock.mockResolvedValue(defaultSurveyContact);

    const result = await service.getPlayerSurvey(100n, 200n);

    expect(result.answers).toHaveLength(1);
  });

  it('lists player surveys with pagination', async () => {
    seasonsRepository.findCurrentSeason.mockResolvedValue({
      id: 10n,
      accountid: 100n,
      name: 'Season',
    });
    repository.listPlayerSurveysMock.mockResolvedValue(defaultListResult);

    const result = await service.listPlayerSurveys(100n, { page: 1, pageSize: 10 });

    expect(repository.listPlayerSurveysMock).toHaveBeenCalledWith(100n, 10n, {
      search: undefined,
      skip: 0,
      take: 10,
    });
    expect(result.pagination.total).toBe(1);
  });

  it('returns null spotlight if no current season', async () => {
    seasonsRepository.findCurrentSeason.mockResolvedValue(null);

    const result = await service.getAccountSpotlight(100n);

    expect(result).toBeNull();
  });

  it('returns formatted spotlight when repository provides one', async () => {
    seasonsRepository.findCurrentSeason.mockResolvedValue({
      id: 10n,
      accountid: 100n,
      name: 'Season',
    });
    repository.findRandomAccountAnswerMock.mockResolvedValue(defaultSpotlight);

    const result = await service.getAccountSpotlight(100n);

    expect(result?.question).toBe('Favorite food?');
  });
});
