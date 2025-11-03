import {
  dbPlayerSurveyAnswer,
  dbPlayerSurveyCategory,
  dbPlayerSurveyContactWithAnswers,
  dbPlayerSurveyListResult,
  dbPlayerSurveyQuestion,
  dbPlayerSurveySpotlight,
} from '../types/dbTypes.js';

export interface PlayerSurveyListOptions {
  search?: string;
  skip: number;
  take: number;
}

export interface IPlayerSurveyRepository {
  listCategories(accountId: bigint): Promise<dbPlayerSurveyCategory[]>;
  createCategory(
    accountId: bigint,
    data: { categoryName: string; priority: number },
  ): Promise<dbPlayerSurveyCategory>;
  updateCategory(
    accountId: bigint,
    categoryId: bigint,
    data: Partial<{ categoryName: string; priority: number }>,
  ): Promise<dbPlayerSurveyCategory | null>;
  deleteCategory(accountId: bigint, categoryId: bigint): Promise<boolean>;

  createQuestion(
    accountId: bigint,
    categoryId: bigint,
    data: { question: string; questionNumber: number },
  ): Promise<dbPlayerSurveyQuestion | null>;
  updateQuestion(
    accountId: bigint,
    questionId: bigint,
    data: Partial<{ question: string; questionNumber: number }>,
  ): Promise<dbPlayerSurveyQuestion | null>;
  deleteQuestion(accountId: bigint, questionId: bigint): Promise<boolean>;

  listPlayerSurveys(
    accountId: bigint,
    seasonId: bigint,
    options: PlayerSurveyListOptions,
  ): Promise<dbPlayerSurveyListResult>;
  getPlayerSurvey(
    accountId: bigint,
    playerId: bigint,
  ): Promise<dbPlayerSurveyContactWithAnswers | null>;
  isPlayerActiveInSeason(accountId: bigint, seasonId: bigint, playerId: bigint): Promise<boolean>;
  isPlayerActiveInTeam(accountId: bigint, teamSeasonId: bigint, playerId: bigint): Promise<boolean>;

  upsertAnswer(
    accountId: bigint,
    playerId: bigint,
    questionId: bigint,
    answer: string,
  ): Promise<dbPlayerSurveyAnswer>;
  deleteAnswer(accountId: bigint, playerId: bigint, questionId: bigint): Promise<boolean>;

  findRandomAccountAnswer(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null>;
  findRandomTeamAnswer(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null>;
}
