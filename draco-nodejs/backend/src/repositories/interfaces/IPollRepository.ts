import {
  dbPollCreateData,
  dbPollQuestionWithCounts,
  dbPollQuestionWithUserVotes,
  dbPollUpdateData,
} from '../types/index.js';

export interface IPollRepository {
  findByAccountId(accountId: bigint): Promise<dbPollQuestionWithCounts[]>;
  findActiveByAccountId(
    accountId: bigint,
    contactId: bigint,
  ): Promise<dbPollQuestionWithUserVotes[]>;
  findById(accountId: bigint, pollId: bigint): Promise<dbPollQuestionWithCounts | null>;
  findByIdWithUserVote(
    accountId: bigint,
    pollId: bigint,
    contactId: bigint,
  ): Promise<dbPollQuestionWithUserVotes | null>;
  create(accountId: bigint, data: dbPollCreateData): Promise<dbPollQuestionWithCounts>;
  update(
    accountId: bigint,
    pollId: bigint,
    data: dbPollUpdateData,
  ): Promise<dbPollQuestionWithCounts | null>;
  delete(accountId: bigint, pollId: bigint): Promise<boolean>;
  saveVote(pollId: bigint, contactId: bigint, optionId: bigint): Promise<void>;
}
