import { PrismaClient, Prisma } from '#prisma/client';
import { IWelcomeMessageRepository } from '../interfaces/IWelcomeMessageRepository.js';
import { dbWelcomeMessage } from '../types/dbTypes.js';

const WELCOME_MESSAGE_SELECT = {
  id: true,
  accountid: true,
  orderno: true,
  captionmenu: true,
  welcometext: true,
  teamid: true,
} as const;

export class PrismaWelcomeMessageRepository implements IWelcomeMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listAccountMessages(accountId: bigint): Promise<dbWelcomeMessage[]> {
    return this.prisma.accountwelcome.findMany({
      where: {
        accountid: accountId,
        OR: [{ teamid: null }, { teamid: BigInt(0) }],
      },
      orderBy: [{ orderno: 'asc' }, { id: 'asc' }],
      select: WELCOME_MESSAGE_SELECT,
    });
  }

  async listTeamMessages(teamId: bigint): Promise<dbWelcomeMessage[]> {
    return this.prisma.accountwelcome.findMany({
      where: { teamid: teamId },
      orderBy: [{ orderno: 'asc' }, { id: 'asc' }],
      select: WELCOME_MESSAGE_SELECT,
    });
  }

  async findAccountMessage(accountId: bigint, messageId: bigint): Promise<dbWelcomeMessage | null> {
    return this.prisma.accountwelcome.findFirst({
      where: {
        id: messageId,
        accountid: accountId,
        OR: [{ teamid: null }, { teamid: BigInt(0) }],
      },
      select: WELCOME_MESSAGE_SELECT,
    });
  }

  async findTeamMessage(teamId: bigint, messageId: bigint): Promise<dbWelcomeMessage | null> {
    return this.prisma.accountwelcome.findFirst({
      where: {
        id: messageId,
        teamid: teamId,
      },
      select: WELCOME_MESSAGE_SELECT,
    });
  }

  async createMessage(data: Prisma.accountwelcomeUncheckedCreateInput): Promise<dbWelcomeMessage> {
    return this.prisma.accountwelcome.create({ data, select: WELCOME_MESSAGE_SELECT });
  }

  async updateMessage(
    messageId: bigint,
    data: Prisma.accountwelcomeUncheckedUpdateInput,
  ): Promise<dbWelcomeMessage> {
    return this.prisma.accountwelcome.update({
      where: { id: messageId },
      data,
      select: WELCOME_MESSAGE_SELECT,
    });
  }

  async deleteMessage(messageId: bigint): Promise<void> {
    await this.prisma.accountwelcome.delete({ where: { id: messageId } });
  }
}
