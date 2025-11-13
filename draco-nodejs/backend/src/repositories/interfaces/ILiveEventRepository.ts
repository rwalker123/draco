import { leagueevents, socialliveevents, Prisma } from '@prisma/client';
import { dbLiveEvent } from '../types/dbTypes.js';

export interface LiveEventQuery {
  accountId: bigint;
  seasonId: bigint;
  teamSeasonId?: bigint;
  status?: string[];
  featuredOnly?: boolean;
}

export interface ILiveEventRepository {
  listLiveEvents(query: LiveEventQuery): Promise<dbLiveEvent[]>;
  findLiveEventById(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
  ): Promise<dbLiveEvent | null>;
  findLiveEventByLeagueEventId(
    accountId: bigint,
    seasonId: bigint,
    leagueEventId: bigint,
  ): Promise<dbLiveEvent | null>;
  createLeagueEvent(data: Prisma.leagueeventsUncheckedCreateInput): Promise<leagueevents>;
  updateLeagueEvent(
    leagueEventId: bigint,
    data: Prisma.leagueeventsUncheckedUpdateInput,
  ): Promise<leagueevents>;
  deleteLeagueEvent(leagueEventId: bigint): Promise<void>;
  createLiveEventDetails(
    data: Prisma.socialliveeventsUncheckedCreateInput,
  ): Promise<socialliveevents>;
  updateLiveEventDetails(
    liveEventId: bigint,
    data: Prisma.socialliveeventsUncheckedUpdateInput,
  ): Promise<socialliveevents>;
  deleteLiveEventDetails(liveEventId: bigint): Promise<void>;
  ensureLeagueSeasonAccess(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<void>;
  ensureTeamSeasonAccess(accountId: bigint, seasonId: bigint, teamSeasonId: bigint): Promise<void>;
  ensureLeagueEventAccess(
    accountId: bigint,
    seasonId: bigint,
    leagueEventId: bigint,
  ): Promise<leagueevents>;
}
