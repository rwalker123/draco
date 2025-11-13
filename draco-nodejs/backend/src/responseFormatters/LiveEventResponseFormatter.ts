import { dbLiveEvent } from '../repositories/types/dbTypes.js';
import type { LiveEventType, LiveEventStatusType } from '@draco/shared-schemas';

export class LiveEventResponseFormatter {
  static format(events: dbLiveEvent[]): LiveEventType[] {
    return events.map((event) => this.formatOne(event));
  }

  static formatOne(event: dbLiveEvent): LiveEventType {
    const leagueEvent = event.leagueevents;
    const leagueSeason = leagueEvent.leagueseason;
    const teamSeason = event.teamsseason;

    return {
      id: event.id.toString(),
      leagueEventId: leagueEvent.id.toString(),
      accountId: leagueSeason.league.accountid.toString(),
      seasonId: leagueSeason.seasonid.toString(),
      leagueSeasonId: leagueSeason.id.toString(),
      teamSeasonId: teamSeason?.id?.toString() ?? null,
      startsAt: leagueEvent.eventdate.toISOString(),
      title: event.title,
      description: event.description ?? null,
      streamPlatform: event.streamplatform ?? null,
      streamUrl: event.streamurl ?? null,
      discordChannelId: event.discordchannelid ?? null,
      location: event.location ?? null,
      status: this.normalizeStatus(event.status),
      featured: event.featured,
      createdAt: event.createdat.toISOString(),
      updatedAt: event.updatedat.toISOString(),
    };
  }

  private static normalizeStatus(rawStatus: string): LiveEventStatusType {
    const normalized = rawStatus.toLowerCase();
    if (normalized === 'live' || normalized === 'ended' || normalized === 'cancelled') {
      return normalized;
    }
    return 'upcoming';
  }
}
