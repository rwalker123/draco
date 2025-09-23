import { Prisma, PrismaClient } from '@prisma/client';
import { IPollRepository } from '../interfaces/index.js';
import {
  dbPollCreateData,
  dbPollQuestionWithCounts,
  dbPollQuestionWithUserVotes,
  dbPollUpdateData,
} from '../types/index.js';

export class PrismaPollRepository implements IPollRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildInclude(contactId?: bigint): Prisma.votequestionInclude {
    const include: Prisma.votequestionInclude = {
      voteoptions: {
        orderBy: {
          priority: 'asc',
        },
        include: {
          _count: {
            select: {
              voteanswers: true,
            },
          },
        },
      },
    };

    if (contactId !== undefined) {
      include.voteanswers = {
        where: {
          contactid: contactId,
        },
        select: {
          optionid: true,
          contactid: true,
        },
      };
    }

    return include;
  }

  private async getQuestionWithCounts(
    client: PrismaClient | Prisma.TransactionClient,
    pollId: bigint,
    contactId?: bigint,
  ): Promise<dbPollQuestionWithCounts | dbPollQuestionWithUserVotes | null> {
    return client.votequestion.findFirst({
      where: {
        id: pollId,
      },
      include: this.buildInclude(contactId),
    });
  }

  async findByAccountId(accountId: bigint): Promise<dbPollQuestionWithCounts[]> {
    return this.prisma.votequestion.findMany({
      where: {
        accountid: accountId,
      },
      include: this.buildInclude(),
      orderBy: [
        {
          active: 'desc',
        },
        { id: 'desc' },
      ],
    });
  }

  async findActiveByAccountId(
    accountId: bigint,
    contactId: bigint,
  ): Promise<dbPollQuestionWithUserVotes[]> {
    return this.prisma.votequestion.findMany({
      where: {
        accountid: accountId,
        active: true,
      },
      include: this.buildInclude(contactId),
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findById(accountId: bigint, pollId: bigint): Promise<dbPollQuestionWithCounts | null> {
    return this.prisma.votequestion.findFirst({
      where: {
        id: pollId,
        accountid: accountId,
      },
      include: this.buildInclude(),
    });
  }

  async findByIdWithUserVote(
    accountId: bigint,
    pollId: bigint,
    contactId: bigint,
  ): Promise<dbPollQuestionWithUserVotes | null> {
    return this.prisma.votequestion.findFirst({
      where: {
        id: pollId,
        accountid: accountId,
        active: true,
      },
      include: this.buildInclude(contactId),
    });
  }

  async create(accountId: bigint, data: dbPollCreateData): Promise<dbPollQuestionWithCounts> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.votequestion.create({
        data: {
          accountid: accountId,
          question: data.question,
          active: data.active,
          voteoptions: {
            create: data.options.map((option) => ({
              optiontext: option.optiontext,
              priority: option.priority ?? 0,
            })),
          },
        },
      });

      const result = await this.getQuestionWithCounts(tx, created.id);
      if (!result) {
        throw new Error('Failed to load created poll');
      }

      return result as dbPollQuestionWithCounts;
    });
  }

  async update(
    accountId: bigint,
    pollId: bigint,
    data: dbPollUpdateData,
  ): Promise<dbPollQuestionWithCounts | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.votequestion.findFirst({
        where: {
          id: pollId,
          accountid: accountId,
        },
      });

      if (!existing) {
        return null;
      }

      const updateData: Prisma.votequestionUpdateArgs['data'] = {};

      if (data.question !== undefined) {
        updateData.question = data.question;
      }

      if (data.active !== undefined) {
        updateData.active = data.active;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.votequestion.update({
          where: {
            id: pollId,
          },
          data: updateData,
        });
      }

      if (data.options) {
        for (const option of data.options) {
          if (option.id) {
            const optionUpdate: Prisma.voteoptionsUpdateManyArgs['data'] = {};

            if (option.optiontext !== undefined) {
              optionUpdate.optiontext = option.optiontext;
            }

            if (option.priority !== undefined) {
              optionUpdate.priority = option.priority;
            }

            if (Object.keys(optionUpdate).length > 0) {
              await tx.voteoptions.updateMany({
                where: {
                  id: option.id,
                  questionid: pollId,
                },
                data: optionUpdate,
              });
            }
          } else {
            await tx.voteoptions.create({
              data: {
                questionid: pollId,
                optiontext: option.optiontext,
                priority: option.priority ?? 0,
              },
            });
          }
        }
      }

      if (data.deletedOptionIds?.length) {
        await tx.voteoptions.deleteMany({
          where: {
            questionid: pollId,
            id: {
              in: data.deletedOptionIds,
            },
          },
        });
      }

      const result = await this.getQuestionWithCounts(tx, pollId);
      if (!result) {
        throw new Error('Failed to load updated poll');
      }

      return result as dbPollQuestionWithCounts;
    });
  }

  async delete(accountId: bigint, pollId: bigint): Promise<boolean> {
    const deleted = await this.prisma.votequestion.deleteMany({
      where: {
        id: pollId,
        accountid: accountId,
      },
    });

    return deleted.count > 0;
  }

  async saveVote(pollId: bigint, contactId: bigint, optionId: bigint): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.voteanswers.deleteMany({
        where: {
          questionid: pollId,
          contactid: contactId,
        },
      });

      await tx.voteanswers.create({
        data: {
          questionid: pollId,
          contactid: contactId,
          optionid: optionId,
        },
      });
    });
  }
}
