import { Prisma, PrismaClient } from '@prisma/client';
import {
  IPlayerSurveyRepository,
  PlayerSurveyListOptions,
} from '../interfaces/IPlayerSurveyRepository.js';
import {
  dbPlayerSurveyAnswer,
  dbPlayerSurveyCategory,
  dbPlayerSurveyContactWithAnswers,
  dbPlayerSurveyListResult,
  dbPlayerSurveyQuestion,
  dbPlayerSurveySpotlight,
} from '../types/dbTypes.js';

const CATEGORY_SELECT = {
  select: {
    id: true,
    accountid: true,
    categoryname: true,
    priority: true,
    profilequestion: {
      select: {
        id: true,
        categoryid: true,
        question: true,
        questionnum: true,
      },
      orderBy: [{ questionnum: 'asc' }, { id: 'asc' }],
    },
  },
} satisfies Prisma.profilecategoryFindManyArgs;

const QUESTION_SELECT = {
  select: {
    id: true,
    categoryid: true,
    question: true,
    questionnum: true,
    profilecategory: {
      select: {
        id: true,
        accountid: true,
        categoryname: true,
        priority: true,
      },
    },
  },
} satisfies Prisma.profilequestionFindManyArgs;

const ANSWER_SELECT = {
  select: {
    id: true,
    playerid: true,
    questionid: true,
    answer: true,
    profilequestion: {
      select: {
        id: true,
        question: true,
        questionnum: true,
        profilecategory: {
          select: {
            id: true,
            categoryname: true,
            priority: true,
          },
        },
      },
    },
  },
} satisfies Prisma.playerprofileFindManyArgs;

const CONTACT_WITH_ANSWERS_SELECT = {
  select: {
    id: true,
    firstname: true,
    lastname: true,
    middlename: true,
    playerprofile: {
      select: ANSWER_SELECT.select,
      orderBy: [
        {
          profilequestion: {
            profilecategory: {
              priority: 'asc' as const,
            },
          },
        },
        {
          profilequestion: {
            questionnum: 'asc' as const,
          },
        },
        {
          id: 'asc' as const,
        },
      ],
    },
  },
} satisfies Prisma.contactsFindManyArgs;

export class PrismaPlayerSurveyRepository implements IPlayerSurveyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCategories(accountId: bigint): Promise<dbPlayerSurveyCategory[]> {
    return this.prisma.profilecategory.findMany({
      where: {
        accountid: accountId,
      },
      orderBy: [
        {
          priority: 'asc',
        },
        { id: 'asc' },
      ],
      ...CATEGORY_SELECT,
    });
  }

  async createCategory(
    accountId: bigint,
    data: { categoryName: string; priority: number },
  ): Promise<dbPlayerSurveyCategory> {
    return this.prisma.profilecategory.create({
      data: {
        accountid: accountId,
        categoryname: data.categoryName,
        priority: data.priority,
      },
      ...CATEGORY_SELECT,
    });
  }

  async updateCategory(
    accountId: bigint,
    categoryId: bigint,
    data: Partial<{ categoryName: string; priority: number }>,
  ): Promise<dbPlayerSurveyCategory | null> {
    const existing = await this.prisma.profilecategory.findFirst({
      where: {
        id: categoryId,
        accountid: accountId,
      },
    });

    if (!existing) {
      return null;
    }

    const updateData: Prisma.profilecategoryUpdateArgs['data'] = {};

    if (data.categoryName !== undefined) {
      updateData.categoryname = data.categoryName;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    return this.prisma.profilecategory.update({
      where: { id: categoryId },
      data: updateData,
      ...CATEGORY_SELECT,
    });
  }

  async deleteCategory(accountId: bigint, categoryId: bigint): Promise<boolean> {
    const existing = await this.prisma.profilecategory.findFirst({
      where: {
        id: categoryId,
        accountid: accountId,
      },
    });

    if (!existing) {
      return false;
    }

    await this.prisma.profilecategory.delete({
      where: {
        id: categoryId,
      },
    });

    return true;
  }

  async createQuestion(
    accountId: bigint,
    categoryId: bigint,
    data: { question: string; questionNumber: number },
  ): Promise<dbPlayerSurveyQuestion | null> {
    const category = await this.prisma.profilecategory.findFirst({
      where: {
        id: categoryId,
        accountid: accountId,
      },
    });

    if (!category) {
      return null;
    }

    return this.prisma.profilequestion.create({
      data: {
        categoryid: categoryId,
        question: data.question,
        questionnum: data.questionNumber,
      },
      ...QUESTION_SELECT,
    });
  }

  async updateQuestion(
    accountId: bigint,
    questionId: bigint,
    data: Partial<{ question: string; questionNumber: number }>,
  ): Promise<dbPlayerSurveyQuestion | null> {
    const existing = await this.prisma.profilequestion.findFirst({
      where: {
        id: questionId,
        profilecategory: {
          accountid: accountId,
        },
      },
    });

    if (!existing) {
      return null;
    }

    const updateData: Prisma.profilequestionUpdateArgs['data'] = {};

    if (data.question !== undefined) {
      updateData.question = data.question;
    }

    if (data.questionNumber !== undefined) {
      updateData.questionnum = data.questionNumber;
    }

    return this.prisma.profilequestion.update({
      where: {
        id: questionId,
      },
      data: updateData,
      ...QUESTION_SELECT,
    });
  }

  async deleteQuestion(accountId: bigint, questionId: bigint): Promise<boolean> {
    const existing = await this.prisma.profilequestion.findFirst({
      where: {
        id: questionId,
        profilecategory: {
          accountid: accountId,
        },
      },
    });

    if (!existing) {
      return false;
    }

    await this.prisma.profilequestion.delete({
      where: {
        id: questionId,
      },
    });

    return true;
  }

  async listPlayerSurveys(
    accountId: bigint,
    seasonId: bigint,
    options: PlayerSurveyListOptions,
  ): Promise<dbPlayerSurveyListResult> {
    const baseWhere: Prisma.contactsWhereInput = {
      creatoraccountid: accountId,
      roster: {
        is: {
          rosterseason: {
            some: {
              inactive: false,
              teamsseason: {
                leagueseason: {
                  seasonid: seasonId,
                },
              },
            },
          },
        },
      },
      playerprofile: {
        some: {
          answer: {
            not: '',
          },
          profilequestion: {
            profilecategory: {
              accountid: accountId,
            },
          },
        },
      },
    };

    if (options.search) {
      const term = options.search.trim();
      if (term.length > 0) {
        const searchFilter: Prisma.contactsWhereInput = {
          OR: [
            { firstname: { contains: term, mode: 'insensitive' } },
            { lastname: { contains: term, mode: 'insensitive' } },
            {
              playerprofile: {
                some: {
                  answer: {
                    contains: term,
                    mode: 'insensitive',
                  },
                  profilequestion: {
                    profilecategory: {
                      accountid: accountId,
                    },
                  },
                },
              },
            },
            {
              playerprofile: {
                some: {
                  profilequestion: {
                    question: {
                      contains: term,
                      mode: 'insensitive',
                    },
                    profilecategory: {
                      accountid: accountId,
                    },
                  },
                },
              },
            },
          ],
        };

        if (!baseWhere.AND) {
          baseWhere.AND = [searchFilter];
        } else if (Array.isArray(baseWhere.AND)) {
          baseWhere.AND = [...baseWhere.AND, searchFilter];
        } else {
          baseWhere.AND = [baseWhere.AND, searchFilter];
        }
      }
    }

    const [players, total] = await Promise.all([
      this.prisma.contacts.findMany({
        where: baseWhere,
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }, { id: 'asc' }],
        skip: options.skip,
        take: options.take,
        ...CONTACT_WITH_ANSWERS_SELECT,
      }),
      this.prisma.contacts.count({ where: baseWhere }),
    ]);

    return {
      players,
      total,
    };
  }

  async getPlayerSurvey(
    accountId: bigint,
    playerId: bigint,
  ): Promise<dbPlayerSurveyContactWithAnswers | null> {
    return this.prisma.contacts.findFirst({
      where: {
        id: playerId,
        creatoraccountid: accountId,
        playerprofile: {
          some: {
            profilequestion: {
              profilecategory: {
                accountid: accountId,
              },
            },
          },
        },
      },
      ...CONTACT_WITH_ANSWERS_SELECT,
    });
  }

  async isPlayerActiveInSeason(
    accountId: bigint,
    seasonId: bigint,
    playerId: bigint,
  ): Promise<boolean> {
    const count = await this.prisma.contacts.count({
      where: {
        id: playerId,
        creatoraccountid: accountId,
        roster: {
          is: {
            rosterseason: {
              some: {
                inactive: false,
                teamsseason: {
                  leagueseason: {
                    seasonid: seasonId,
                  },
                },
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  async isPlayerActiveInTeam(
    accountId: bigint,
    teamSeasonId: bigint,
    playerId: bigint,
  ): Promise<boolean> {
    const count = await this.prisma.contacts.count({
      where: {
        id: playerId,
        creatoraccountid: accountId,
        roster: {
          is: {
            rosterseason: {
              some: {
                inactive: false,
                teamseasonid: teamSeasonId,
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  async upsertAnswer(
    accountId: bigint,
    playerId: bigint,
    questionId: bigint,
    answer: string,
  ): Promise<dbPlayerSurveyAnswer> {
    const question = await this.prisma.profilequestion.findFirst({
      where: {
        id: questionId,
        profilecategory: {
          accountid: accountId,
        },
      },
    });

    if (!question) {
      throw new Error('Player survey question not found for account');
    }

    const existing = await this.prisma.playerprofile.findFirst({
      where: {
        playerid: playerId,
        questionid: questionId,
      },
    });

    if (existing) {
      const updated = await this.prisma.playerprofile.update({
        where: { id: existing.id },
        data: { answer },
        ...ANSWER_SELECT,
      });
      return updated;
    }

    const created = await this.prisma.playerprofile.create({
      data: {
        playerid: playerId,
        questionid: questionId,
        answer,
      },
      ...ANSWER_SELECT,
    });

    return created;
  }

  async deleteAnswer(accountId: bigint, playerId: bigint, questionId: bigint): Promise<boolean> {
    const result = await this.prisma.playerprofile.deleteMany({
      where: {
        playerid: playerId,
        questionid: questionId,
        profilequestion: {
          profilecategory: {
            accountid: accountId,
          },
        },
      },
    });

    return result.count > 0;
  }

  async findRandomAccountAnswer(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null> {
    return this.findRandomAnswer(
      {
        answer: { not: '' },
        profilequestion: {
          profilecategory: {
            accountid: accountId,
          },
        },
        contacts: {
          creatoraccountid: accountId,
          roster: {
            is: {
              rosterseason: {
                some: {
                  inactive: false,
                  teamsseason: {
                    leagueseason: {
                      seasonid: seasonId,
                    },
                  },
                },
              },
            },
          },
        },
      },
      undefined,
    );
  }

  async findRandomTeamAnswer(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<dbPlayerSurveySpotlight | null> {
    return this.findRandomAnswer(
      {
        answer: { not: '' },
        profilequestion: {
          profilecategory: {
            accountid: accountId,
          },
        },
        contacts: {
          creatoraccountid: accountId,
          roster: {
            is: {
              rosterseason: {
                some: {
                  inactive: false,
                  teamseasonid: teamSeasonId,
                },
              },
            },
          },
        },
      },
      teamSeasonId,
    );
  }

  private async findRandomAnswer(
    where: Prisma.playerprofileWhereInput,
    teamSeasonId: bigint | undefined,
  ): Promise<dbPlayerSurveySpotlight | null> {
    const total = await this.prisma.playerprofile.count({ where });

    if (total === 0) {
      return null;
    }

    const skip = Math.floor(Math.random() * total);

    const answer = await this.prisma.playerprofile.findFirst({
      where,
      skip,
      orderBy: {
        id: 'asc',
      },
      select: {
        answer: true,
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            roster: {
              select: {
                rosterseason: {
                  where: teamSeasonId ? { teamseasonid: teamSeasonId } : undefined,
                  select: {
                    teamsseason: {
                      select: {
                        name: true,
                      },
                    },
                  },
                  orderBy: { id: 'asc' },
                  take: teamSeasonId ? 1 : undefined,
                },
              },
            },
          },
        },
        profilequestion: {
          select: {
            question: true,
          },
        },
      },
    });

    if (!answer || !answer.contacts) {
      return null;
    }

    const teamName =
      teamSeasonId && answer.contacts.roster?.rosterseason?.length
        ? (answer.contacts.roster.rosterseason[0]?.teamsseason?.name ?? null)
        : null;

    return {
      playerId: answer.contacts.id,
      firstName: answer.contacts.firstname,
      lastName: answer.contacts.lastname,
      question: answer.profilequestion.question,
      answer: answer.answer,
      photoUrl: null,
      teamName: teamName ?? null,
    };
  }
}
