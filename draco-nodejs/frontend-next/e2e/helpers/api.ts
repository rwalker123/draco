import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import {
  createLeague,
  deleteLeague,
  createAccountSeason,
  deleteAccountSeason,
  addLeagueToSeason,
  removeLeagueFromSeason,
  updateGolfLeagueSetup,
  createLeagueSeasonTeam,
  createAndSignGolfPlayer,
  deleteGolfPlayer,
  createGolfMatch,
  deleteGolfMatch,
  submitGolfMatchResults,
} from '@draco/shared-api-client';
import type {
  League,
  LeagueSeasonWithDivision,
  LeagueSeason,
  TeamSeason,
  GolfRosterEntry,
  GolfMatch,
  UpdateGolfLeagueSetup,
  SubmitMatchResults,
} from '@draco/shared-api-client';

export function createE2EApiClient(baseUrl: string, token: string) {
  return createClient(
    createConfig({
      baseUrl,
      auth: () => token,
    }),
  );
}

type E2EClient = ReturnType<typeof createE2EApiClient>;

export class ApiHelper {
  private client: E2EClient;

  constructor(baseURL: string, token: string) {
    this.client = createE2EApiClient(baseURL, token);
  }

  async createLeague(accountId: string, data: { name: string }): Promise<League> {
    const { data: league, error } = await createLeague({
      client: this.client,
      path: { accountId },
      body: data,
    });
    if (error || !league) throw new Error(`createLeague failed: ${JSON.stringify(error)}`);
    return league;
  }

  async deleteLeague(accountId: string, leagueId: string): Promise<void> {
    const { error } = await deleteLeague({
      client: this.client,
      path: { accountId, leagueId },
    });
    if (error) throw new Error(`deleteLeague failed: ${JSON.stringify(error)}`);
  }

  async createSeason(accountId: string, data: { name: string }): Promise<LeagueSeasonWithDivision> {
    const { data: season, error } = await createAccountSeason({
      client: this.client,
      path: { accountId },
      body: data,
    });
    if (error || !season) throw new Error(`createSeason failed: ${JSON.stringify(error)}`);
    return season;
  }

  async deleteSeason(accountId: string, seasonId: string): Promise<void> {
    const { error } = await deleteAccountSeason({
      client: this.client,
      path: { accountId, seasonId },
    });
    if (error) throw new Error(`deleteSeason failed: ${JSON.stringify(error)}`);
  }

  async addLeagueToSeason(
    accountId: string,
    seasonId: string,
    leagueId: string,
  ): Promise<LeagueSeason> {
    const { data: leagueSeason, error } = await addLeagueToSeason({
      client: this.client,
      path: { accountId, seasonId },
      body: { leagueId },
    });
    if (error || !leagueSeason)
      throw new Error(`addLeagueToSeason failed: ${JSON.stringify(error)}`);
    return leagueSeason;
  }

  async removeLeagueFromSeason(
    accountId: string,
    seasonId: string,
    leagueSeasonId: string,
  ): Promise<void> {
    const { error } = await removeLeagueFromSeason({
      client: this.client,
      path: { accountId, seasonId, leagueSeasonId },
    });
    if (error) throw new Error(`removeLeagueFromSeason failed: ${JSON.stringify(error)}`);
  }

  async updateLeagueSetup(
    accountId: string,
    seasonId: string,
    leagueSeasonId: string,
    data: UpdateGolfLeagueSetup,
  ): Promise<void> {
    const { error } = await updateGolfLeagueSetup({
      client: this.client,
      path: { accountId, seasonId, leagueSeasonId },
      body: data,
    });
    if (error) throw new Error(`updateLeagueSetup failed: ${JSON.stringify(error)}`);
  }

  async createTeam(
    accountId: string,
    seasonId: string,
    leagueSeasonId: string,
    data: { name: string },
  ): Promise<TeamSeason> {
    const { data: team, error } = await createLeagueSeasonTeam({
      client: this.client,
      path: { accountId, seasonId, leagueSeasonId },
      body: data,
    });
    if (error || !team) throw new Error(`createTeam failed: ${JSON.stringify(error)}`);
    return team;
  }

  async createAndSignPlayer(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    data: {
      firstName: string;
      lastName: string;
      initialDifferential?: number;
    },
  ): Promise<GolfRosterEntry> {
    const { data: rosterEntry, error } = await createAndSignGolfPlayer({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId },
      body: data,
    });
    if (error || !rosterEntry)
      throw new Error(`createAndSignPlayer failed: ${JSON.stringify(error)}`);
    return rosterEntry;
  }

  async deleteRosterEntry(accountId: string, seasonId: string, rosterId: string): Promise<void> {
    const { error } = await deleteGolfPlayer({
      client: this.client,
      path: { accountId, seasonId, rosterId },
    });
    if (error) throw new Error(`deleteRosterEntry failed: ${JSON.stringify(error)}`);
  }

  async createMatch(
    accountId: string,
    seasonId: string,
    data: {
      leagueSeasonId: string;
      team1Id: string;
      team2Id: string;
      matchDateTime: string;
      courseId?: string;
      teeId?: string;
    },
  ): Promise<GolfMatch> {
    const { data: match, error } = await createGolfMatch({
      client: this.client,
      path: { accountId, seasonId },
      body: data,
    });
    if (error || !match) throw new Error(`createMatch failed: ${JSON.stringify(error)}`);
    return match;
  }

  async deleteMatch(accountId: string, matchId: string, force = false): Promise<void> {
    const { error } = await deleteGolfMatch({
      client: this.client,
      path: { accountId, matchId },
      query: force ? { force: true } : undefined,
    });
    if (error) throw new Error(`deleteMatch failed: ${JSON.stringify(error)}`);
  }

  async submitMatchResults(
    accountId: string,
    matchId: string,
    data: SubmitMatchResults,
  ): Promise<GolfMatch> {
    const { data: result, error } = await submitGolfMatchResults({
      client: this.client,
      path: { accountId, matchId },
      body: data,
    });
    if (error || !result) throw new Error(`submitMatchResults failed: ${JSON.stringify(error)}`);
    return result;
  }
}
