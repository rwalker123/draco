import { AccountPollType, CreatePollType, UpdatePollType } from '@draco/shared-schemas';
import {
  IPollRepository,
  RepositoryFactory,
  dbPollCreateData,
  dbPollOptionUpsertData,
  dbPollUpdateData,
} from '../repositories/index.js';
import { PollResponseFormatter } from '../responseFormatters/responseFormatters.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export class PollService {
  private readonly pollRepository: IPollRepository;

  constructor() {
    this.pollRepository = RepositoryFactory.getPollRepository();
  }

  async listAccountPolls(accountId: bigint): Promise<AccountPollType[]> {
    const polls = await this.pollRepository.findByAccountId(accountId);
    return polls.map((poll) => PollResponseFormatter.formatPoll(poll));
  }

  async listActivePolls(accountId: bigint, contactId: bigint): Promise<AccountPollType[]> {
    const polls = await this.pollRepository.findActiveByAccountId(accountId, contactId);
    return polls.map((poll) => PollResponseFormatter.formatPoll(poll));
  }

  async createPoll(accountId: bigint, data: CreatePollType): Promise<AccountPollType> {
    if (data.options.length < 2) {
      throw new ValidationError('A poll must include at least two options');
    }

    const normalizedOptions = this.normalizeCreateOptions(data.options);

    const created = await this.pollRepository.create(accountId, {
      question: data.question,
      active: data.active ?? true,
      options: normalizedOptions,
    });

    return PollResponseFormatter.formatPoll(created);
  }

  async updatePoll(
    accountId: bigint,
    pollId: bigint,
    data: UpdatePollType,
  ): Promise<AccountPollType> {
    const existing = await this.pollRepository.findById(accountId, pollId);

    if (!existing) {
      throw new NotFoundError('Poll not found');
    }

    const updatePayload = this.buildUpdatePayload(existing.voteoptions, data);

    const updated = await this.pollRepository.update(accountId, pollId, updatePayload);
    if (!updated) {
      throw new NotFoundError('Poll not found');
    }

    return PollResponseFormatter.formatPoll(updated);
  }

  async deletePoll(accountId: bigint, pollId: bigint): Promise<void> {
    const deleted = await this.pollRepository.delete(accountId, pollId);
    if (!deleted) {
      throw new NotFoundError('Poll not found');
    }
  }

  async castVote(
    accountId: bigint,
    pollId: bigint,
    contactId: bigint,
    optionId: bigint,
  ): Promise<AccountPollType> {
    const poll = await this.pollRepository.findById(accountId, pollId);

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!poll.active) {
      throw new ValidationError('This poll is not currently active');
    }

    const optionExists = poll.voteoptions.some((option) => option.id === optionId);
    if (!optionExists) {
      throw new ValidationError('Selected option does not belong to this poll');
    }

    await this.pollRepository.saveVote(pollId, contactId, optionId);

    const updated = await this.pollRepository.findByIdWithUserVote(accountId, pollId, contactId);
    if (!updated) {
      throw new NotFoundError('Poll not found');
    }

    return PollResponseFormatter.formatPoll(updated);
  }

  private normalizeCreateOptions(options: CreatePollType['options']): dbPollCreateData['options'] {
    let nextPriority = 0;

    return options.map((option) => ({
      optiontext: option.optionText,
      priority: option.priority ?? nextPriority++,
    }));
  }

  private buildUpdatePayload(
    existingOptions: Array<{ id: bigint; priority: number }>,
    data: UpdatePollType,
  ): dbPollUpdateData {
    const updatePayload: dbPollUpdateData = {};

    if (data.question !== undefined) {
      updatePayload.question = data.question;
    }

    if (data.active !== undefined) {
      updatePayload.active = data.active;
    }

    const existingIds = new Set(existingOptions.map((option) => option.id.toString()));

    const deletedIds = (data.deletedOptionIds ?? []).filter((id) => existingIds.has(id));
    const newOptions = (data.options ?? []).filter((option) => !option.id);
    const existingCount = existingOptions.length;
    const finalCount = existingCount - deletedIds.length + newOptions.length;

    if (finalCount < 2) {
      throw new ValidationError('A poll must include at least two options');
    }

    if (data.options) {
      let nextPriority =
        existingOptions.reduce((max, option) => Math.max(max, option.priority), -1) + 1;

      const optionsForUpdate: dbPollOptionUpsertData[] = data.options.map((option) => {
        if (option.id) {
          if (!existingIds.has(option.id)) {
            throw new ValidationError('Invalid option specified for update');
          }

          const updateEntry: dbPollOptionUpsertData = {
            id: BigInt(option.id),
            optiontext: option.optionText,
          };

          if (option.priority !== undefined) {
            updateEntry.priority = option.priority;
          }

          return updateEntry;
        }

        const priority = option.priority ?? nextPriority++;
        return {
          optiontext: option.optionText,
          priority,
        };
      });

      updatePayload.options = optionsForUpdate;
    }

    if (deletedIds.length > 0) {
      updatePayload.deletedOptionIds = deletedIds.map((id) => BigInt(id));
    }

    return updatePayload;
  }
}
