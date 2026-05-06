import { buildIcsCalendar, buildVEvent, formatIcsDateTime } from '../utils/icsBuilder.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../repositories/interfaces/IScheduleRepository.js';

const ICS_DEFAULT_GAME_DURATION_MINUTES = parseInt(
  process.env.ICS_DEFAULT_GAME_DURATION_MINUTES ?? '180',
  10,
);

const CALENDAR_CACHE_TTL_MS = 60_000;
const CALENDAR_CACHE_MAX_ENTRIES = 1000;

interface CacheEntry {
  etag: string;
  lastModified: Date;
  body: string;
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
  private readonly inFlight = new Map<string, Promise<CalendarResult | null>>();

  constructor(scheduleRepository?: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository ?? RepositoryFactory.getScheduleRepository();
  }

  async getTeamSeasonCalendarFingerprint(
    teamSeasonId: bigint,
  ): Promise<CalendarFingerprint | null> {
    const context = await this.scheduleRepository.findTeamSeasonCalendarContext(teamSeasonId);

    if (!context || !context.scheduleVisible) {
      return null;
    }

    const fingerprint = await this.scheduleRepository.getTeamScheduleFingerprint(
      teamSeasonId,
      context.seasonId,
    );

    const etag = this.buildEtag(fingerprint);
    const lastModified = fingerprint.maxGamedate ?? new Date(0);

    return { etag, lastModified, teamSeasonContext: context };
  }

  async getTeamSeasonCalendar(teamSeasonId: bigint): Promise<CalendarResult | null> {
    const key = teamSeasonId.toString();

    const existing = this.cache.get(key);
    if (existing && Date.now() - existing.cachedAt < CALENDAR_CACHE_TTL_MS) {
      return { etag: existing.etag, lastModified: existing.lastModified, body: existing.body };
    }

    const inflight = this.inFlight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = this.fetchAndCache(teamSeasonId, key).finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  private async fetchAndCache(teamSeasonId: bigint, key: string): Promise<CalendarResult | null> {
    const fingerprintResult = await this.getTeamSeasonCalendarFingerprint(teamSeasonId);

    if (!fingerprintResult) {
      return null;
    }

    const { etag, lastModified, teamSeasonContext } = fingerprintResult;

    const existing = this.cache.get(key);
    if (
      existing &&
      existing.etag === etag &&
      Date.now() - existing.cachedAt < CALENDAR_CACHE_TTL_MS
    ) {
      return { etag: existing.etag, lastModified: existing.lastModified, body: existing.body };
    }

    const games = await this.scheduleRepository.listAllGamesForTeam(
      teamSeasonId,
      teamSeasonContext.seasonId,
    );

    const uidDomain = process.env.ICS_UID_DOMAIN ?? 'draco.local';
    const dtstamp = formatIcsDateTime(new Date());
    const gameDurationMinutes = ICS_DEFAULT_GAME_DURATION_MINUTES;

    const eventBlocks = games.map((game) =>
      buildVEvent({
        game,
        dtstamp,
        gameDurationMinutes,
        uidDomain,
        leagueName: teamSeasonContext.leagueName || null,
      }),
    );

    const calendarName = `${teamSeasonContext.teamName} Schedule (${teamSeasonContext.seasonName})`;

    const body = buildIcsCalendar({
      calendarName,
      events: eventBlocks,
    });

    this.evictOldestIfNeeded();
    this.cache.set(key, { etag, lastModified, body, cachedAt: Date.now() });

    return { etag, lastModified, body };
  }

  private buildEtag(fingerprint: {
    count: number;
    maxId: bigint | null;
    maxGamedate: Date | null;
  }): string {
    const maxIdHex = fingerprint.maxId !== null ? fingerprint.maxId.toString(16) : '0';
    const maxEpoch =
      fingerprint.maxGamedate !== null ? fingerprint.maxGamedate.getTime().toString() : '0';
    return `W/"${fingerprint.count}-${maxIdHex}-${maxEpoch}"`;
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
