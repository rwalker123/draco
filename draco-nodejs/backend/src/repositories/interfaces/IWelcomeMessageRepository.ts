import { Prisma } from '@prisma/client';
import { dbWelcomeMessage } from '../types/dbTypes.js';

export interface IWelcomeMessageRepository {
  listAccountMessages(accountId: bigint): Promise<dbWelcomeMessage[]>;
  listTeamMessages(teamId: bigint): Promise<dbWelcomeMessage[]>;
  findAccountMessage(accountId: bigint, messageId: bigint): Promise<dbWelcomeMessage | null>;
  findTeamMessage(teamId: bigint, messageId: bigint): Promise<dbWelcomeMessage | null>;
  createMessage(data: Prisma.accountwelcomeUncheckedCreateInput): Promise<dbWelcomeMessage>;
  updateMessage(
    messageId: bigint,
    data: Prisma.accountwelcomeUncheckedUpdateInput,
  ): Promise<dbWelcomeMessage>;
  deleteMessage(messageId: bigint): Promise<void>;
}
