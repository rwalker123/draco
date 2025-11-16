import { describe, beforeEach, expect, it, vi } from 'vitest';
import { DiscordConnector } from '../discordConnector.js';
import type {
  DiscordConnectorOptions,
  DiscordMessageIngestionRecord,
} from '../../ingestionTypes.js';
import type { DiscordIngestionTarget } from '../../../../config/socialIngestion.js';
import type { ISocialContentRepository } from '../../../../repositories/interfaces/ISocialContentRepository.js';

const target: DiscordIngestionTarget = {
  accountId: BigInt(1),
  seasonId: BigInt(2),
  channelId: 'channel-123',
  label: 'general',
  guildId: 'guild-123',
};

function createMessage(
  overrides: Partial<DiscordMessageIngestionRecord> = {},
): DiscordMessageIngestionRecord {
  return {
    messageId: 'message-1',
    content: 'Hello world',
    authorDisplayName: 'Jane Doe',
    authorId: 'user-1',
    authorAvatarUrl: null,
    postedAt: new Date('2024-01-01T00:00:00.000Z'),
    attachments: [],
    permalink: '',
    ...overrides,
  };
}

describe('DiscordConnector message cache', () => {
  let repository: Pick<
    ISocialContentRepository,
    'upsertCommunityMessage' | 'deleteCommunityMessages'
  >;
  let options: DiscordConnectorOptions;
  let connector: DiscordConnector;

  beforeEach(() => {
    repository = {
      upsertCommunityMessage: vi.fn().mockResolvedValue(undefined),
      deleteCommunityMessages: vi.fn().mockResolvedValue(undefined),
    };

    options = {
      botToken: 'bot-token',
      limit: 10,
      intervalMs: 1000,
      enabled: true,
      targetsProvider: vi.fn().mockResolvedValue([target]),
    };

    connector = new DiscordConnector(repository as ISocialContentRepository, options);
  });

  it('skips repository writes when channel messages are unchanged', async () => {
    const firstMessage = createMessage();
    const updatedMessage = createMessage({ content: 'Edited content' });

    const fetchSpy = vi
      .spyOn(
        connector as unknown as {
          fetchChannelMessages: (
            target: DiscordIngestionTarget,
          ) => Promise<DiscordMessageIngestionRecord[]>;
        },
        'fetchChannelMessages',
      )
      .mockResolvedValueOnce([firstMessage])
      .mockResolvedValueOnce([firstMessage])
      .mockResolvedValueOnce([updatedMessage]);

    const run = () =>
      (connector as unknown as { runIngestion: () => Promise<void> }).runIngestion();

    await run();
    expect(repository.upsertCommunityMessage).toHaveBeenCalledTimes(1);

    await run();
    expect(repository.upsertCommunityMessage).toHaveBeenCalledTimes(1);

    await run();
    expect(repository.upsertCommunityMessage).toHaveBeenCalledTimes(2);

    expect(repository.deleteCommunityMessages).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('deletes cached messages that are no longer returned by Discord', async () => {
    const first = createMessage({ messageId: 'msg-1' });
    const second = createMessage({ messageId: 'msg-2' });

    const fetchSpy = vi
      .spyOn(
        connector as unknown as {
          fetchChannelMessages: (
            target: DiscordIngestionTarget,
          ) => Promise<DiscordMessageIngestionRecord[]>;
        },
        'fetchChannelMessages',
      )
      .mockResolvedValueOnce([first, second])
      .mockResolvedValueOnce([first]);

    const run = () =>
      (connector as unknown as { runIngestion: () => Promise<void> }).runIngestion();

    await run();
    expect(repository.upsertCommunityMessage).toHaveBeenCalledTimes(2);
    expect(repository.deleteCommunityMessages).not.toHaveBeenCalled();

    await run();
    expect(repository.deleteCommunityMessages).toHaveBeenCalledWith([
      `${target.accountId.toString()}-${second.messageId}`,
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
