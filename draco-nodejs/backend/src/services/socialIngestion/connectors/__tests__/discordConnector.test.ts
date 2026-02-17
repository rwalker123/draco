import { describe, beforeEach, expect, it, vi } from 'vitest';
import { DiscordConnector } from '../discordConnector.js';
import type {
  DiscordConnectorOptions,
  DiscordMessageIngestionRecord,
} from '../../ingestionTypes.js';
import type { DiscordIngestionTarget } from '../../../../config/socialIngestion.js';
import type { ISocialContentRepository } from '../../../../repositories/interfaces/ISocialContentRepository.js';
import { HttpError } from '../../../../utils/fetchJson.js';

vi.mock('../../../../utils/fetchJson.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../utils/fetchJson.js')>();
  return {
    ...actual,
    fetchJson: vi.fn(),
  };
});

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
    'upsertCommunityMessage' | 'deleteCommunityMessages' | 'listCommunityMessageCacheEntries'
  >;
  let options: DiscordConnectorOptions;
  let connector: DiscordConnector;

  beforeEach(() => {
    repository = {
      upsertCommunityMessage: vi.fn().mockResolvedValue(undefined),
      deleteCommunityMessages: vi.fn().mockResolvedValue(undefined),
      listCommunityMessageCacheEntries: vi.fn().mockResolvedValue([]),
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
          ) => Promise<{ messages: DiscordMessageIngestionRecord[]; rateLimited: boolean }>;
        },
        'fetchChannelMessages',
      )
      .mockResolvedValueOnce({ messages: [firstMessage], rateLimited: false })
      .mockResolvedValueOnce({ messages: [firstMessage], rateLimited: false })
      .mockResolvedValueOnce({ messages: [updatedMessage], rateLimited: false });

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
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledTimes(1);
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledWith(
      target.accountId,
      target.channelId,
      options.limit,
    );
  });

  it('deletes cached messages that are no longer returned by Discord', async () => {
    const first = createMessage({ messageId: 'msg-1' });
    const second = createMessage({ messageId: 'msg-2' });

    const fetchSpy = vi
      .spyOn(
        connector as unknown as {
          fetchChannelMessages: (
            target: DiscordIngestionTarget,
          ) => Promise<{ messages: DiscordMessageIngestionRecord[]; rateLimited: boolean }>;
        },
        'fetchChannelMessages',
      )
      .mockResolvedValueOnce({ messages: [first, second], rateLimited: false })
      .mockResolvedValueOnce({ messages: [first], rateLimited: false });

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
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledTimes(1);
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledWith(
      target.accountId,
      target.channelId,
      options.limit,
    );
  });

  it('hydrates cache from existing records and deletes missing messages on first run', async () => {
    const existingId = `${target.accountId.toString()}-stale`;
    repository.listCommunityMessageCacheEntries = vi.fn().mockResolvedValue([
      {
        id: existingId,
        content: 'Old message',
        attachments: [],
        permalink: '',
        postedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const fetchSpy = vi
      .spyOn(
        connector as unknown as {
          fetchChannelMessages: (
            target: DiscordIngestionTarget,
          ) => Promise<{ messages: DiscordMessageIngestionRecord[]; rateLimited: boolean }>;
        },
        'fetchChannelMessages',
      )
      .mockResolvedValue({ messages: [], rateLimited: false });

    await (connector as unknown as { runIngestion: () => Promise<void> }).runIngestion();

    expect(repository.deleteCommunityMessages).toHaveBeenCalledWith([existingId]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledTimes(1);
    expect(repository.listCommunityMessageCacheEntries).toHaveBeenCalledWith(
      target.accountId,
      target.channelId,
      options.limit,
    );
  });
});

describe('DiscordConnector rate limit handling', () => {
  let repository: Pick<
    ISocialContentRepository,
    'upsertCommunityMessage' | 'deleteCommunityMessages' | 'listCommunityMessageCacheEntries'
  >;
  let options: DiscordConnectorOptions;
  let connector: DiscordConnector;

  type ConnectorInternals = {
    fetchChannelMessages: (
      target: DiscordIngestionTarget,
    ) => Promise<{ messages: DiscordMessageIngestionRecord[]; rateLimited: boolean }>;
    extractRetryAfterMs: (body: string) => number;
    nextAllowedRun: number;
    globalCooldownUntil: number;
    consecutiveRateLimits: number;
  };

  function internals(): ConnectorInternals {
    return connector as unknown as ConnectorInternals;
  }

  beforeEach(() => {
    repository = {
      upsertCommunityMessage: vi.fn().mockResolvedValue(undefined),
      deleteCommunityMessages: vi.fn().mockResolvedValue(undefined),
      listCommunityMessageCacheEntries: vi.fn().mockResolvedValue([]),
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

  it('uses retry_after from a standard per-channel 429 response', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);
    mockFetchJson.mockRejectedValueOnce(
      new HttpError('rate limited', 429, JSON.stringify({ retry_after: 3 })),
    );

    const result = await internals().fetchChannelMessages(target);

    expect(result.rateLimited).toBe(true);
    expect(result.messages).toEqual([]);
    expect(internals().nextAllowedRun).toBeGreaterThan(Date.now() + 2500);
    expect(internals().globalCooldownUntil).toBe(0);
  });

  it('sets globalCooldownUntil when response has global flag', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);
    mockFetchJson.mockRejectedValueOnce(
      new HttpError('rate limited', 429, JSON.stringify({ retry_after: 5, global: true })),
    );

    const before = Date.now();
    await internals().fetchChannelMessages(target);

    expect(internals().globalCooldownUntil).toBeGreaterThanOrEqual(before + 5000);
    expect(internals().globalCooldownUntil).toBeLessThan(before + 10_000);
  });

  it('applies 60s default cooldown for global block without retry_after', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);
    const globalBlockBody = JSON.stringify({
      code: 0,
      message:
        'You are being blocked from accessing our API temporarily due to exceeding global rate limits.',
    });
    mockFetchJson.mockRejectedValueOnce(new HttpError('rate limited', 429, globalBlockBody));

    const before = Date.now();
    await internals().fetchChannelMessages(target);

    expect(internals().globalCooldownUntil).toBeGreaterThanOrEqual(before + 60_000);
    expect(internals().nextAllowedRun).toBeGreaterThanOrEqual(before + 60_000);
  });

  it('applies exponential backoff on consecutive rate limits', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);
    const globalBlockBody = JSON.stringify({
      code: 0,
      message:
        'You are being blocked from accessing our API temporarily due to exceeding global rate limits.',
    });

    mockFetchJson.mockRejectedValue(new HttpError('rate limited', 429, globalBlockBody));

    internals().globalCooldownUntil = 0;
    internals().nextAllowedRun = 0;
    await internals().fetchChannelMessages(target);
    const firstCooldown = internals().globalCooldownUntil;

    internals().globalCooldownUntil = 0;
    internals().nextAllowedRun = 0;
    await internals().fetchChannelMessages(target);
    const secondCooldown = internals().globalCooldownUntil;

    internals().globalCooldownUntil = 0;
    internals().nextAllowedRun = 0;
    await internals().fetchChannelMessages(target);
    const thirdCooldown = internals().globalCooldownUntil;

    const now = Date.now();
    expect(firstCooldown - now).toBeGreaterThanOrEqual(55_000);
    expect(firstCooldown - now).toBeLessThan(65_000);
    expect(secondCooldown - now).toBeGreaterThanOrEqual(115_000);
    expect(secondCooldown - now).toBeLessThan(125_000);
    expect(thirdCooldown - now).toBeGreaterThanOrEqual(235_000);
    expect(thirdCooldown - now).toBeLessThan(245_000);
    expect(internals().consecutiveRateLimits).toBe(3);
  });

  it('resets consecutiveRateLimits on a successful fetch', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);

    mockFetchJson.mockRejectedValueOnce(
      new HttpError(
        'rate limited',
        429,
        JSON.stringify({ code: 0, message: 'exceeding global rate limits' }),
      ),
    );

    await internals().fetchChannelMessages(target);
    expect(internals().consecutiveRateLimits).toBe(1);

    mockFetchJson.mockResolvedValueOnce([]);
    internals().nextAllowedRun = 0;
    internals().globalCooldownUntil = 0;
    await internals().fetchChannelMessages(target);
    expect(internals().consecutiveRateLimits).toBe(0);
  });

  it('defaults to 5s when 429 body is unparseable', async () => {
    const { fetchJson } = await import('../../../../utils/fetchJson.js');
    const mockFetchJson = vi.mocked(fetchJson);
    mockFetchJson.mockRejectedValueOnce(new HttpError('rate limited', 429, 'not json'));

    const before = Date.now();
    await internals().fetchChannelMessages(target);

    expect(internals().nextAllowedRun).toBeGreaterThanOrEqual(before + 5000);
    expect(internals().nextAllowedRun).toBeLessThan(before + 10_000);
  });
});
