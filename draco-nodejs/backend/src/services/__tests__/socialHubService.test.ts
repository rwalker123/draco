import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialHubService } from '../socialHubService.js';
import { ISocialContentRepository, ILiveEventRepository } from '../../repositories/index.js';
import type { dbLiveEvent } from '../../repositories/types/dbTypes.js';
import { DiscordIntegrationService } from '../discordIntegrationService.js';
import type { CommunityChannelType } from '@draco/shared-schemas';

const makeLiveEventRecord = (overrides: Partial<dbLiveEvent> = {}): dbLiveEvent => {
  const base: dbLiveEvent = {
    id: overrides.id ?? 10n,
    leagueeventid: overrides.leagueeventid ?? 20n,
    teamseasonid: overrides.teamseasonid ?? 30n,
    title: overrides.title ?? 'Scrimmage Stream',
    description: overrides.description ?? 'Livestream details',
    streamplatform: overrides.streamplatform ?? 'YouTube',
    streamurl: overrides.streamurl ?? 'https://youtu.be/demo',
    discordchannelid: overrides.discordchannelid ?? null,
    location: overrides.location ?? null,
    status: overrides.status ?? 'upcoming',
    featured: overrides.featured ?? false,
    createdat: overrides.createdat ?? new Date('2024-01-01T12:00:00Z'),
    updatedat: overrides.updatedat ?? new Date('2024-01-01T12:00:00Z'),
    leagueevents:
      overrides.leagueevents ??
      ({
        id: 20n,
        eventdate: new Date('2024-02-01T18:00:00Z'),
        description: 'Scrimmage Stream',
        leagueseasonid: 40n,
        leagueseason: {
          id: 40n,
          seasonid: 50n,
          leagueid: 60n,
          league: {
            id: 60n,
            accountid: 1n,
            name: 'Premier League',
          },
        },
      } as dbLiveEvent['leagueevents']),
    teamsseason:
      overrides.teamsseason ??
      ({
        id: 30n,
        name: 'Varsity Eagles',
        leagueseasonid: 40n,
        teamid: 70n,
      } as dbLiveEvent['teamsseason']),
  };

  return {
    ...base,
    ...overrides,
    leagueevents: {
      ...base.leagueevents,
      ...(overrides.leagueevents ?? {}),
    },
    teamsseason: base.teamsseason
      ? {
          ...base.teamsseason,
          ...(overrides.teamsseason ?? {}),
        }
      : null,
  };
};

describe('SocialHubService', () => {
  let socialContentRepository: ISocialContentRepository;
  let liveEventRepository: ILiveEventRepository;
  let listCommunityChannelsMock: ReturnType<typeof vi.fn>;
  let service: SocialHubService;

  const accountId = 1n;
  const seasonId = 2n;
  const makeCommunityChannel = (
    overrides: Partial<CommunityChannelType> = {},
  ): CommunityChannelType => ({
    id: overrides.id ?? 'channel-1',
    accountId: overrides.accountId ?? accountId.toString(),
    seasonId: overrides.seasonId ?? seasonId.toString(),
    discordChannelId: overrides.discordChannelId ?? '123',
    name: overrides.name ?? 'general',
    label: overrides.label ?? 'General',
    scope: overrides.scope ?? 'account',
    channelType: overrides.channelType ?? 'text',
    url: overrides.url ?? 'https://discord.com/channels/1/123',
    teamId: overrides.teamId ?? undefined,
    teamSeasonId: overrides.teamSeasonId ?? undefined,
  });

  beforeEach(() => {
    socialContentRepository = {
      listFeedItems: vi.fn().mockResolvedValue([]),
      createFeedItems: vi.fn(),
      deleteFeedItem: vi.fn(),
      restoreFeedItem: vi.fn(),
      listVideos: vi.fn().mockResolvedValue([]),
      upsertVideo: vi.fn(),
      listCommunityMessages: vi.fn().mockResolvedValue([]),
      upsertCommunityMessage: vi.fn(),
      deleteCommunityMessages: vi.fn(),
      listCommunityMessageCacheEntries: vi.fn().mockResolvedValue([]),
    };

    liveEventRepository = {
      listLiveEvents: vi.fn().mockResolvedValue([]),
      findLiveEventById: vi.fn(),
      createLeagueEvent: vi.fn(),
      updateLeagueEvent: vi.fn(),
      deleteLeagueEvent: vi.fn(),
      createLiveEventDetails: vi.fn(),
      updateLiveEventDetails: vi.fn(),
      deleteLiveEventDetails: vi.fn(),
      ensureLeagueSeasonAccess: vi.fn().mockResolvedValue(undefined),
      ensureTeamSeasonAccess: vi.fn().mockResolvedValue(undefined),
      ensureLeagueEventAccess: vi.fn(),
      findLiveEventByLeagueEventId: vi.fn().mockResolvedValue(null),
    };

    listCommunityChannelsMock = vi.fn().mockResolvedValue([]);
    const discordIntegrationService = {
      listCommunityChannels: listCommunityChannelsMock,
    } as unknown as DiscordIntegrationService;

    service = new SocialHubService(
      socialContentRepository,
      liveEventRepository,
      discordIntegrationService,
    );
  });

  it('lists live events with filters', async () => {
    const records = [makeLiveEventRecord()];
    (liveEventRepository.listLiveEvents as ReturnType<typeof vi.fn>).mockResolvedValue(records);

    const results = await service.listLiveEvents(accountId, seasonId, {
      teamSeasonId: '30',
      status: ['upcoming'],
      featuredOnly: true,
    });

    expect(liveEventRepository.listLiveEvents).toHaveBeenCalledWith({
      accountId,
      seasonId,
      teamSeasonId: 30n,
      status: ['upcoming'],
      featuredOnly: true,
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Scrimmage Stream');
  });

  it('creates a new live event when leagueEventId is not provided', async () => {
    (liveEventRepository.createLeagueEvent as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 99n,
      eventdate: new Date('2024-03-01T00:00:00Z'),
      description: 'Scrimmage Stream',
      leagueseasonid: 40n,
    });
    (liveEventRepository.createLiveEventDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 15n,
      leagueeventid: 99n,
      teamseasonid: 30n,
      title: 'Scrimmage Stream',
    });
    (liveEventRepository.findLiveEventById as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeLiveEventRecord({ id: 15n, leagueeventid: 99n }),
    );

    const result = await service.createLiveEvent(accountId, seasonId, {
      leagueSeasonId: '40',
      teamSeasonId: '30',
      title: 'Scrimmage Stream  ',
      startsAt: '2024-03-01T00:00:00Z',
      streamUrl: 'https://twitch.tv/demo',
    });

    expect(liveEventRepository.createLeagueEvent).toHaveBeenCalled();
    expect(liveEventRepository.createLiveEventDetails).toHaveBeenCalledWith({
      leagueeventid: 99n,
      teamseasonid: 30n,
      title: 'Scrimmage Stream',
      description: null,
      streamplatform: null,
      streamurl: 'https://twitch.tv/demo',
      discordchannelid: null,
      location: null,
      status: 'upcoming',
      featured: false,
    });
    expect(result.leagueSeasonId).toBe('40');
  });

  it('updates an existing live event and trims title values', async () => {
    const existing = makeLiveEventRecord({
      id: 10n,
      leagueeventid: 99n,
      leagueevents: {
        id: 99n,
        eventdate: new Date('2024-04-01T00:00:00Z'),
        description: 'Old title',
        leagueseasonid: 40n,
        leagueseason: {
          id: 40n,
          seasonid: seasonId,
          leagueid: 60n,
          league: { id: 60n, accountid: accountId, name: 'League' },
        },
      },
    });

    (liveEventRepository.findLiveEventById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(
        makeLiveEventRecord({
          id: 10n,
          title: 'Updated Title',
          status: 'live',
          streamurl: 'https://example.com/watch',
        }),
      );

    const result = await service.updateLiveEvent(accountId, seasonId, 10n, {
      title: '  Updated Title ',
      status: 'live',
      streamUrl: 'https://example.com/watch',
    });

    expect(liveEventRepository.updateLeagueEvent).toHaveBeenCalledWith(
      99n,
      expect.objectContaining({
        description: 'Updated Title',
      }),
    );
    expect(liveEventRepository.updateLiveEventDetails).toHaveBeenCalledWith(
      10n,
      expect.objectContaining({
        title: 'Updated Title',
        status: 'live',
        streamurl: 'https://example.com/watch',
      }),
    );
    expect(result.status).toBe('live');
  });

  it('deletes a live event by removing metadata record', async () => {
    (liveEventRepository.findLiveEventById as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeLiveEventRecord({ id: 10n }),
    );

    await service.deleteLiveEvent(accountId, seasonId, 10n);
    expect(liveEventRepository.deleteLiveEventDetails).toHaveBeenCalledWith(10n);
  });

  it('returns empty community messages when no channels are available', async () => {
    listCommunityChannelsMock.mockResolvedValue([]);

    const result = await service.listCommunityMessages(accountId, seasonId);

    expect(result).toEqual([]);
    expect(socialContentRepository.listCommunityMessages).not.toHaveBeenCalled();
  });

  it('filters community messages to allowed channels', async () => {
    listCommunityChannelsMock.mockResolvedValue([
      makeCommunityChannel({ discordChannelId: 'abc123' }),
      makeCommunityChannel({ discordChannelId: 'def456' }),
    ]);

    await service.listCommunityMessages(accountId, seasonId, { limit: 5 });

    expect(listCommunityChannelsMock).toHaveBeenCalledWith(accountId, seasonId, undefined, {
      userId: undefined,
    });
    expect(socialContentRepository.listCommunityMessages).toHaveBeenNthCalledWith(1, {
      accountId,
      seasonId,
      teamSeasonId: undefined,
      channelIds: ['abc123'],
      limit: 5,
    });
    expect(socialContentRepository.listCommunityMessages).toHaveBeenNthCalledWith(2, {
      accountId,
      seasonId,
      teamSeasonId: undefined,
      channelIds: ['def456'],
      limit: 5,
    });
  });

  it('returns no messages when requested channel ids are not allowed', async () => {
    listCommunityChannelsMock.mockResolvedValue([
      makeCommunityChannel({ discordChannelId: 'abc' }),
    ]);

    const result = await service.listCommunityMessages(accountId, seasonId, {
      channelIds: ['other'],
      limit: 5,
    });

    expect(result).toEqual([]);
    expect(socialContentRepository.listCommunityMessages).not.toHaveBeenCalled();
  });

  it('falls back to channel-only filtering when team messages are missing metadata', async () => {
    listCommunityChannelsMock.mockResolvedValue([
      makeCommunityChannel({
        discordChannelId: 'team-chan',
        teamSeasonId: '30',
        scope: 'teamSeason',
      }),
    ]);
    const repoMock = socialContentRepository.listCommunityMessages as ReturnType<typeof vi.fn>;
    repoMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.listCommunityMessages(accountId, seasonId, { teamSeasonId: '30', limit: 5 });

    expect(repoMock).toHaveBeenCalledTimes(1);
    expect(repoMock).toHaveBeenCalledWith({
      accountId,
      seasonId,
      teamSeasonId: 30n,
      channelIds: ['team-chan'],
      limit: 5,
    });
  });
});
