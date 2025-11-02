import {
  PlayerSurveyCategoryType,
  PlayerSurveyQuestionType,
  PlayerSurveyDetailType,
  PlayerSurveySummaryType,
  PlayerSurveySummaryListResponseType,
  PlayerSurveyAnswerType,
  PlayerSurveySpotlightType,
  PublicContactSummaryType,
} from '@draco/shared-schemas';
import {
  dbPlayerSurveyCategory,
  dbPlayerSurveyQuestion,
  dbPlayerSurveyAnswer,
  dbPlayerSurveyContactWithAnswers,
  dbPlayerSurveyListResult,
  dbPlayerSurveySpotlight,
} from '../repositories/types/dbTypes.js';
import { PaginationHelper } from '../utils/pagination.js';
import { getContactPhotoUrl } from '../config/logo.js';

export class PlayerSurveyResponseFormatter {
  static formatCategories(
    accountId: bigint,
    categories: dbPlayerSurveyCategory[],
  ): PlayerSurveyCategoryType[] {
    return categories
      .map((category) => this.formatCategory(accountId, category))
      .sort((a, b) => {
        if (a.priority === b.priority) {
          return a.categoryName.localeCompare(b.categoryName);
        }
        return a.priority - b.priority;
      });
  }

  static formatCategory(
    accountId: bigint,
    category: dbPlayerSurveyCategory,
  ): PlayerSurveyCategoryType {
    return {
      id: category.id.toString(),
      accountId: category.accountid.toString(),
      categoryName: category.categoryname,
      priority: category.priority,
      questions: category.profilequestion
        .map((question) => {
          const questionWithCategory = {
            ...question,
            profilecategory: {
              id: category.id,
              accountid: category.accountid,
              categoryname: category.categoryname,
              priority: category.priority,
            },
          } as dbPlayerSurveyQuestion;

          return this.formatQuestion(accountId, questionWithCategory);
        })
        .sort(
          (a, b) => a.questionNumber - b.questionNumber || a.question.localeCompare(b.question),
        ),
    };
  }

  static formatQuestion(
    accountId: bigint,
    question: dbPlayerSurveyQuestion,
  ): PlayerSurveyQuestionType {
    return {
      id: question.id.toString(),
      categoryId: question.categoryid.toString(),
      question: question.question,
      questionNumber: question.questionnum,
    };
  }

  static formatAnswer(answer: dbPlayerSurveyAnswer): PlayerSurveyAnswerType {
    const category = answer.profilequestion.profilecategory;
    return {
      questionId: answer.questionid.toString(),
      categoryId: category.id.toString(),
      categoryName: category.categoryname,
      question: answer.profilequestion.question,
      questionNumber: answer.profilequestion.questionnum,
      answer: answer.answer,
    };
  }

  static formatSurveyDetail(
    accountId: bigint,
    contact: dbPlayerSurveyContactWithAnswers,
  ): PlayerSurveyDetailType {
    const answers = contact.playerprofile.map((answer) => this.formatAnswer(answer));
    return {
      player: this.toPublicContactSummary(accountId, contact),
      answers,
    };
  }

  static formatSurveySummary(
    accountId: bigint,
    contact: dbPlayerSurveyContactWithAnswers,
  ): PlayerSurveySummaryType {
    const answeredQuestionCount = contact.playerprofile.filter((answer) =>
      answer.answer.trim(),
    ).length;

    return {
      player: this.toPublicContactSummary(accountId, contact),
      answeredQuestionCount,
      hasResponses: answeredQuestionCount > 0,
    };
  }

  static formatSurveyList(
    accountId: bigint,
    result: dbPlayerSurveyListResult,
    page: number,
    pageSize: number,
  ): PlayerSurveySummaryListResponseType {
    const surveys = result.players.map((player) => this.formatSurveySummary(accountId, player));
    const pagination = PaginationHelper.createMeta(page, pageSize, result.total);
    return {
      surveys,
      pagination,
    };
  }

  static formatSpotlight(
    accountId: bigint,
    spotlight: dbPlayerSurveySpotlight,
  ): PlayerSurveySpotlightType {
    return {
      player: {
        id: spotlight.playerId.toString(),
        firstName: spotlight.firstName,
        lastName: spotlight.lastName,
        photoUrl:
          getContactPhotoUrl(accountId.toString(), spotlight.playerId.toString()) || undefined,
      },
      question: spotlight.question,
      answer: spotlight.answer,
      teamName: spotlight.teamName || undefined,
    };
  }

  private static toPublicContactSummary(
    accountId: bigint,
    contact: { id: bigint; firstname: string; lastname: string },
  ): PublicContactSummaryType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
    };
  }
}
