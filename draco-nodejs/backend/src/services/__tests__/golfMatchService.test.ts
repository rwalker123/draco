import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GolfMatchService } from '../golfMatchService.js';
import type {
  IGolfMatchRepository,
  GolfMatchWithTeams,
} from '../../repositories/interfaces/IGolfMatchRepository.js';
import type {
  IGolfFlightRepository,
  GolfFlightWithDetails,
} from '../../repositories/interfaces/IGolfFlightRepository.js';
import type { IGolfTeamRepository } from '../../repositories/interfaces/IGolfTeamRepository.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { GolfMatchStatus } from '../../utils/golfConstants.js';
import type { league, season, teamsseason, teams } from '#prisma/client';

function createMockTeam(overrides: Partial<teams> = {}): teams {
  return {
    id: 1n,
    accountid: 100n,
    createdby: 1n,
    contact: null,
    ...overrides,
  } as teams;
}

function createMockTeamSeason(
  overrides: Partial<teamsseason & { teams: teams }> = {},
): teamsseason & { teams: teams } {
  const teamid = overrides.teamid ?? 1n;
  return {
    id: 1n,
    leagueseasonid: 1n,
    teamid,
    name: 'Team A',
    divisionseasonid: null,
    teams: createMockTeam({ id: teamid }),
    ...overrides,
  } as teamsseason & { teams: teams };
}

function createMockMatch(overrides: Partial<GolfMatchWithTeams> = {}): GolfMatchWithTeams {
  return {
    id: 1n,
    team1: 10n,
    team2: 20n,
    leagueid: 1n,
    matchdate: new Date('2024-06-15T10:00:00Z'),
    courseid: null,
    teeid: null,
    matchstatus: GolfMatchStatus.SCHEDULED,
    matchtype: 0,
    comment: '',
    team1points: null,
    team2points: null,
    team1totalscore: null,
    team2totalscore: null,
    team1netscore: null,
    team2netscore: null,
    team1holewins: null,
    team2holewins: null,
    team1ninewins: null,
    team2ninewins: null,
    team1matchwins: null,
    team2matchwins: null,
    golfcourse: null,
    golfteeinformation: null,
    teamsseason_golfmatch_team1Toteamsseason: createMockTeamSeason({
      id: 10n,
      teamid: 100n,
      leagueseasonid: 1n,
      name: 'Eagles',
    }),
    teamsseason_golfmatch_team2Toteamsseason: createMockTeamSeason({
      id: 20n,
      teamid: 200n,
      leagueseasonid: 1n,
      name: 'Hawks',
    }),
    ...overrides,
  } as GolfMatchWithTeams;
}

function createMockFlight(overrides: Partial<GolfFlightWithDetails> = {}): GolfFlightWithDetails {
  return {
    id: 1n,
    seasonid: 1n,
    leagueid: 10n,
    league: { id: 10n, accountid: 100n, name: 'Flight A' } as league,
    season: {
      id: 1n,
      accountid: 100n,
      name: '2024 Season',
      startdate: new Date('2024-01-01'),
      enddate: new Date('2024-12-31'),
      isactive: true,
      iscurrent: true,
    } as season,
    ...overrides,
  } as GolfFlightWithDetails;
}

describe('GolfMatchService', () => {
  let matchRepository: IGolfMatchRepository;
  let flightRepository: IGolfFlightRepository;
  let teamRepository: IGolfTeamRepository;
  let service: GolfMatchService;

  let matches: GolfMatchWithTeams[];
  let flights: GolfFlightWithDetails[];
  let teamSeasons: Array<{ id: bigint; teamid: bigint; leagueseasonid: bigint; name: string }>;
  let matchHasScores: boolean;

  beforeEach(() => {
    matchHasScores = false;

    matches = [
      createMockMatch({
        id: 1n,
        team1: 10n,
        team2: 20n,
        leagueid: 1n,
      }),
    ];

    flights = [
      createMockFlight({ id: 1n, seasonid: 1n, leagueid: 10n }),
      createMockFlight({ id: 2n, seasonid: 2n, leagueid: 10n }),
    ];

    teamSeasons = [
      { id: 10n, teamid: 100n, leagueseasonid: 1n, name: 'Eagles' },
      { id: 20n, teamid: 200n, leagueseasonid: 1n, name: 'Hawks' },
      { id: 30n, teamid: 100n, leagueseasonid: 2n, name: 'Eagles' },
      { id: 40n, teamid: 200n, leagueseasonid: 2n, name: 'Hawks' },
    ];

    matchRepository = {
      findBySeasonId: vi.fn(),
      findBySeasonIdWithDateRange: vi.fn(),
      findByFlightId: vi.fn(),
      findByLeagueSeasonId: vi.fn(),
      findByIdWithLeague: vi.fn(),
      findById: vi.fn(async (matchId: bigint) => {
        return matches.find((m) => m.id === matchId) ?? null;
      }),
      findByIdWithScores: vi.fn(),
      findUpcoming: vi.fn(),
      findCompleted: vi.fn(),
      findByTeam: vi.fn(),
      findByDate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateStatus: vi.fn(),
      updateTee: vi.fn(),
      hasScores: vi.fn(async () => matchHasScores),
      seasonHasLeagueSeasons: vi.fn(),
      changeMatchSeason: vi.fn(
        async (
          matchId: bigint,
          newLeagueSeasonId: bigint,
          newTeam1Id: bigint,
          newTeam2Id: bigint,
        ) => {
          const match = matches.find((m) => m.id === matchId)!;
          const team1Season = teamSeasons.find((ts) => ts.id === newTeam1Id)!;
          const team2Season = teamSeasons.find((ts) => ts.id === newTeam2Id)!;
          return {
            ...match,
            leagueid: newLeagueSeasonId,
            team1: newTeam1Id,
            team2: newTeam2Id,
            teamsseason_golfmatch_team1Toteamsseason: createMockTeamSeason({
              id: newTeam1Id,
              teamid: team1Season.teamid,
              leagueseasonid: newLeagueSeasonId,
              name: team1Season.name,
            }),
            teamsseason_golfmatch_team2Toteamsseason: createMockTeamSeason({
              id: newTeam2Id,
              teamid: team2Season.teamid,
              leagueseasonid: newLeagueSeasonId,
              name: team2Season.name,
            }),
          } as GolfMatchWithTeams;
        },
      ),
      updatePoints: vi.fn(),
    };

    flightRepository = {
      findBySeasonId: vi.fn(),
      findById: vi.fn(async (flightId: bigint) => {
        return flights.find((f) => f.id === flightId) ?? null;
      }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getPlayerCountForFlight: vi.fn(),
      flightNameExistsInSeason: vi.fn(),
      seasonHasFlights: vi.fn(),
      findByLeagueAndSeason: vi.fn(async (leagueId: bigint, seasonId: bigint) => {
        const found = flights.find((f) => f.leagueid === leagueId && f.seasonid === seasonId);
        return found ? { id: found.id } : null;
      }),
    };

    teamRepository = {
      findBySeasonId: vi.fn(),
      findByFlightId: vi.fn(),
      findById: vi.fn(),
      findByIdWithRoster: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      hasMatches: vi.fn(),
      hasRosterEntries: vi.fn(),
      findByTeamAndLeagueSeason: vi.fn(async (teamId: bigint, leagueSeasonId: bigint) => {
        const found = teamSeasons.find(
          (ts) => ts.teamid === teamId && ts.leagueseasonid === leagueSeasonId,
        );
        return found ? { id: found.id } : null;
      }),
    };

    service = new GolfMatchService(matchRepository, flightRepository, teamRepository);
  });

  describe('changeMatchSeason', () => {
    it('maps both teams to their correct season-specific records in the target season', async () => {
      const result = await service.changeMatchSeason(1n, 2n);

      expect(matchRepository.changeMatchSeason).toHaveBeenCalledWith(1n, 2n, 30n, 40n);

      expect(result.team1.id).toBe('30');
      expect(result.team1.name).toBe('Eagles');
      expect(result.team2.id).toBe('40');
      expect(result.team2.name).toBe('Hawks');
      expect(result.team1.id).not.toBe(result.team2.id);
    });

    it('updates the leagueSeasonId to the target flight', async () => {
      const result = await service.changeMatchSeason(1n, 2n);

      expect(result.leagueSeasonId).toBe('2');
    });

    it('looks up team1 and team2 with their respective definition-level teamIds', async () => {
      await service.changeMatchSeason(1n, 2n);

      expect(teamRepository.findByTeamAndLeagueSeason).toHaveBeenCalledWith(100n, 2n);
      expect(teamRepository.findByTeamAndLeagueSeason).toHaveBeenCalledWith(200n, 2n);
    });

    it('throws NotFoundError when match not found', async () => {
      await expect(service.changeMatchSeason(999n, 2n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when match is completed', async () => {
      matches[0] = createMockMatch({
        id: 1n,
        matchstatus: GolfMatchStatus.COMPLETED,
      });

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 2n)).rejects.toThrow(/completed/i);
    });

    it('throws ValidationError when match has scores', async () => {
      matchHasScores = true;

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 2n)).rejects.toThrow(/scores/i);
    });

    it('throws ValidationError when target season is the same as current', async () => {
      await expect(service.changeMatchSeason(1n, 1n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 1n)).rejects.toThrow(/already in the target/i);
    });

    it('throws ValidationError when target season has no matching flight', async () => {
      flights = [flights[0]];

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 2n)).rejects.toThrow(/matching flight/i);
    });

    it('throws ValidationError when team1 does not exist in target season', async () => {
      teamSeasons = teamSeasons.filter((ts) => !(ts.teamid === 100n && ts.leagueseasonid === 2n));

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 2n)).rejects.toThrow(/Eagles/);
    });

    it('throws ValidationError when team2 does not exist in target season', async () => {
      teamSeasons = teamSeasons.filter((ts) => !(ts.teamid === 200n && ts.leagueseasonid === 2n));

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(ValidationError);
      await expect(service.changeMatchSeason(1n, 2n)).rejects.toThrow(/Hawks/);
    });

    it('throws NotFoundError when current flight not found', async () => {
      flights = [];

      await expect(service.changeMatchSeason(1n, 2n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
