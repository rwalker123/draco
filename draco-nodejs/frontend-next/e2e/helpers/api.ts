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
  deleteGolfTeam,
  createGolfMatch,
  deleteGolfMatch,
  submitGolfMatchResults,
  updateGolfMatchStatus,
  getCurrentSeason,
  deleteContact,
  getGolfSeasonStandings,
} from '@draco/shared-api-client';
import type {
  League,
  LeagueSeasonWithDivision,
  LeagueSeason,
  TeamSeason,
  GolfRosterEntry,
  GolfMatch,
  GolfLeagueStandings,
  UpdateGolfLeagueSetup,
  SubmitMatchResults,
  CurrentSeasonResponse,
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

export class ApiError extends Error {
  status: number;

  constructor(label: string, status: number, details: unknown) {
    super(`${label} (${status}): ${JSON.stringify(details)}`);
    this.status = status;
  }
}

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
    const { error, response } = await deleteLeague({
      client: this.client,
      path: { accountId, leagueId },
    });
    if (error) throw new ApiError('deleteLeague', response.status, error);
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
    const { error, response } = await deleteAccountSeason({
      client: this.client,
      path: { accountId, seasonId },
    });
    if (error) throw new ApiError('deleteSeason', response.status, error);
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
    const { error, response } = await removeLeagueFromSeason({
      client: this.client,
      path: { accountId, seasonId, leagueSeasonId },
    });
    if (error) throw new ApiError('removeLeagueFromSeason', response.status, error);
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

  async deleteTeam(accountId: string, seasonId: string, teamSeasonId: string): Promise<void> {
    const { error, response } = await deleteGolfTeam({
      client: this.client,
      path: { accountId, seasonId, teamSeasonId },
    });
    if (error) throw new ApiError('deleteTeam', response.status, error);
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
    const { error, response } = await deleteGolfPlayer({
      client: this.client,
      path: { accountId, seasonId, rosterId },
    });
    if (error) throw new ApiError('deleteRosterEntry', response.status, error);
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
    const { error, response } = await deleteGolfMatch({
      client: this.client,
      path: { accountId, matchId },
      query: force ? { force: true } : undefined,
    });
    if (error) throw new ApiError('deleteMatch', response.status, error);
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

  async updateMatchStatus(accountId: string, matchId: string, status: number): Promise<void> {
    const { error } = await updateGolfMatchStatus({
      client: this.client,
      path: { accountId, matchId },
      body: { status },
    });
    if (error) throw new Error(`updateMatchStatus failed: ${JSON.stringify(error)}`);
  }

  async fetchCurrentSeason(accountId: string): Promise<CurrentSeasonResponse> {
    const { data: season, error } = await getCurrentSeason({
      client: this.client,
      path: { accountId },
    });
    if (error || !season) throw new Error(`getCurrentSeason failed: ${JSON.stringify(error)}`);
    return season;
  }

  async getSeasonStandings(accountId: string, seasonId: string): Promise<GolfLeagueStandings> {
    const { data, error } = await getGolfSeasonStandings({
      client: this.client,
      path: { accountId, seasonId },
    });
    if (error || !data) throw new Error(`getGolfSeasonStandings failed: ${JSON.stringify(error)}`);
    return data;
  }

  async deleteContact(accountId: string, contactId: string): Promise<void> {
    const { error, response } = await deleteContact({
      client: this.client,
      path: { accountId, contactId },
      query: { force: true },
    });
    if (error) throw new ApiError('deleteContact', response.status, error);
  }
}
