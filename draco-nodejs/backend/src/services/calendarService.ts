import { createHash } from 'crypto';
import { buildIcsCalendar, buildVEvent, formatIcsDateTime } from '../utils/icsBuilder.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';
import type { dbGameInfo } from '../repositories/types/index.js';

const DEFAULT_GAME_DURATION_MINUTES_FALLBACK = 180;

const parseGameDurationMinutes = (raw: string | undefined): number => {
  const parsed = parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GAME_DURATION_MINUTES_FALLBACK;
};

const ICS_DEFAULT_GAME_DURATION_MINUTES = parseGameDurationMinutes(
  process.env.ICS_DEFAULT_GAME_DURATION_MINUTES,
);

const CALENDAR_CACHE_TTL_MS = 60_000;
const CALENDAR_CACHE_MAX_ENTRIES = 1000;

interface CacheEntry {
  etag: string;
  lastModified: Date;
  body: string;
  context: TeamSeasonContext;
  cachedAt: number;
}

export interface TeamSeasonContext {
  teamName: string;
  leagueName: string;
  seasonName: string;
  seasonId: bigint;
  accountId: bigint;
  scheduleVisible: boolean;
}

export interface CalendarFingerprint {
  etag: string;
  lastModified: Date;
  teamSeasonContext: TeamSeasonContext;
}

export interface CalendarResult {
  etag: string;
  lastModified: Date;
  body: string;
}

export class CalendarService {
  private readonly scheduleRepository: IScheduleRepository;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<
    string,
    Promise<{ result: CalendarResult; context: TeamSeasonContext } | null>
  >();

  constructor(scheduleRepository?: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository ?? RepositoryFactory.getScheduleRepository();
  }

  async getTeamSeasonCalendarFingerprint(
    teamSeasonId: bigint,
  ): Promise<CalendarFingerprint | null> {
    const loaded = await this.getOrLoadCalendar(teamSeasonId);
    if (!loaded) return null;
    return {
      etag: loaded.result.etag,
      lastModified: loaded.result.lastModified,
      teamSeasonContext: loaded.context,
    };
  }

  async getTeamSeasonCalendar(teamSeasonId: bigint): Promise<CalendarResult | null> {
    const loaded = await this.getOrLoadCalendar(teamSeasonId);
    return loaded?.result ?? null;
  }

  private async getOrLoadCalendar(
    teamSeasonId: bigint,
  ): Promise<{ result: CalendarResult; context: TeamSeasonContext } | null> {
    const key = teamSeasonId.toString();

    const existing = this.cache.get(key);
    if (existing && Date.now() - existing.cachedAt < CALENDAR_CACHE_TTL_MS && existing.context) {
      return {
        result: { etag: existing.etag, lastModified: existing.lastModified, body: existing.body },
        context: existing.context,
      };
    }

    const inflight = this.inFlight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = this.loadAndCache(teamSeasonId, key).finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  private async loadAndCache(
    teamSeasonId: bigint,
    key: string,
  ): Promise<{ result: CalendarResult; context: TeamSeasonContext } | null> {
    const context = await this.scheduleRepository.findTeamSeasonCalendarContext(teamSeasonId);
    if (!context || !context.scheduleVisible) {
      return null;
    }

    const games = await this.scheduleRepository.listAllGamesForTeam(teamSeasonId, context.seasonId);

    const etag = this.buildEtag(games);
    const previous = this.cache.get(key);
    const lastModified = previous && previous.etag === etag ? previous.lastModified : new Date();

    const uidDomain = process.env.ICS_UID_DOMAIN ?? 'draco.local';
    const dtstamp = formatIcsDateTime(new Date());

    const eventBlocks = games.map((game) =>
      buildVEvent({
        game,
        dtstamp,
        gameDurationMinutes: ICS_DEFAULT_GAME_DURATION_MINUTES,
        uidDomain,
        leagueName: context.leagueName || null,
      }),
    );

    const calendarName = `${context.teamName} Schedule (${context.seasonName})`;

    const body = buildIcsCalendar({
      calendarName,
      events: eventBlocks,
    });

    this.evictOldestIfNeeded();
    this.cache.set(key, { etag, lastModified, body, context, cachedAt: Date.now() });

    return { result: { etag, lastModified, body }, context };
  }

  private buildEtag(games: dbGameInfo[]): string {
    const hash = createHash('sha1');
    for (const game of games) {
      hash.update(
        [
          game.id.toString(),
          game.gamedate?.toISOString() ?? '',
          game.gamestatus.toString(),
          game.fieldid?.toString() ?? '',
          game.comment ?? '',
          game.hteamid.toString(),
          game.vteamid.toString(),
        ].join('|'),
      );
      hash.update('\n');
    }
    return `W/"${games.length}-${hash.digest('hex').slice(0, 16)}"`;
  }

  private evictOldestIfNeeded(): void {
    if (this.cache.size < CALENDAR_CACHE_MAX_ENTRIES) return;

    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [k, v] of this.cache) {
      if (v.cachedAt < oldestTime) {
        oldestTime = v.cachedAt;
        oldestKey = k;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }
}
