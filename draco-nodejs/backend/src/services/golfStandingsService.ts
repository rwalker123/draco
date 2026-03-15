import {
  GolfTeamStandingType,
  GolfFlightStandingsType,
  GolfLeagueStandingsType,
} from '@draco/shared-schemas';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfScoreRepository } from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfLeagueRepository } from '../repositories/interfaces/IGolfLeagueRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { GolfMatchStatus } from '../utils/golfConstants.js';

interface TeamStandingData {
  teamSeasonId: bigint;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesTied: number;
  matchPoints: number;
  strokePoints: number;
  totalStrokes: number;
  roundsPlayed: number;
}

export class GolfStandingsService {
  private readonly matchRepository: IGolfMatchRepository;
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly teamRepository: IGolfTeamRepository;
  private readonly leagueRepository: IGolfLeagueRepository;

  constructor(
    matchRepository?: IGolfMatchRepository,
    scoreRepository?: IGolfScoreRepository,
    flightRepository?: IGolfFlightRepository,
    teamRepository?: IGolfTeamRepository,
    leagueRepository?: IGolfLeagueRepository,
  ) {
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.scoreRepository = scoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
  }

  async getFlightStandings(flightId: bigint): Promise<GolfFlightStandingsType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const leagueSetup = await this.leagueRepository.findByLeagueSeasonId(flightId);
    const isIndividualScoring = leagueSetup?.scoringtype === 'individual';

    const teams = await this.teamRepository.findByFlightId(flightId);
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const standingsMap = new Map<bigint, TeamStandingData>();

    for (const team of teams) {
      standingsMap.set(team.id, {
        teamSeasonId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesTied: 0,
        matchPoints: 0,
        strokePoints: 0,
        totalStrokes: 0,
        roundsPlayed: 0,
      });
    }

    // Batch load all scores for completed matches to avoid N+1 queries
    const matchIds = completedMatches.map((m) => m.id);
    const allScoresMap = await this.scoreRepository.findByMatchIds(matchIds);

    for (const match of completedMatches) {
      const matchScores = allScoresMap.get(match.id) || [];

      const team1Scores = matchScores.filter((ms) => ms.teamid === match.team1);
      const team2Scores = matchScores.filter((ms) => ms.teamid === match.team2);

      const team1Present = team1Scores.filter((ms) => !ms.golfscore.isabsent);
      const team2Present = team2Scores.filter((ms) => !ms.golfscore.isabsent);

      const team1Total = team1Present.reduce((sum, ms) => sum + ms.golfscore.totalscore, 0);
      const team2Total = team2Present.reduce((sum, ms) => sum + ms.golfscore.totalscore, 0);

      const team1Standing = standingsMap.get(match.team1);
      const team2Standing = standingsMap.get(match.team2);

      if (team1Standing && team2Standing) {
        team1Standing.matchesPlayed++;
        team2Standing.matchesPlayed++;

        team1Standing.totalStrokes += team1Total;
        team2Standing.totalStrokes += team2Total;
        team1Standing.roundsPlayed += team1Present.length;
        team2Standing.roundsPlayed += team2Present.length;

        if (isIndividualScoring && match.team1points !== null && match.team2points !== null) {
          team1Standing.matchPoints += match.team1points;
          team2Standing.matchPoints += match.team2points;

          const pointsDiff = match.team1points - match.team2points;
          const pointsTied = Math.abs(pointsDiff) < 0.001;

          if (!pointsTied && pointsDiff > 0) {
            team1Standing.matchesWon++;
            team2Standing.matchesLost++;
          } else if (!pointsTied && pointsDiff < 0) {
            team2Standing.matchesWon++;
            team1Standing.matchesLost++;
          } else if (match.team1matchwins === 1) {
            team1Standing.matchesWon++;
            team2Standing.matchesLost++;
          } else if (match.team2matchwins === 1) {
            team2Standing.matchesWon++;
            team1Standing.matchesLost++;
          } else {
            team1Standing.matchesTied++;
            team2Standing.matchesTied++;
          }
        } else {
          if (team1Total < team2Total) {
            team1Standing.matchesWon++;
            team2Standing.matchesLost++;
            team1Standing.matchPoints += 2;
          } else if (team2Total < team1Total) {
            team2Standing.matchesWon++;
            team1Standing.matchesLost++;
            team2Standing.matchPoints += 2;
          } else {
            team1Standing.matchesTied++;
            team2Standing.matchesTied++;
            team1Standing.matchPoints += 1;
            team2Standing.matchPoints += 1;
          }

          const strokeDiff = Math.abs(team1Total - team2Total);
          if (strokeDiff > 0) {
            if (team1Total < team2Total) {
              team1Standing.strokePoints += strokeDiff;
            } else {
              team2Standing.strokePoints += strokeDiff;
            }
          }
        }
      }
    }

    const standings = Array.from(standingsMap.values())
      .map((data) => this.formatTeamStanding(data))
      .sort((a, b) => {
        const pointsDiff = b.totalPoints - a.totalPoints;
        if (pointsDiff !== 0) return pointsDiff;

        const winPctA =
          a.matchesPlayed > 0 ? (a.matchesWon + 0.5 * a.matchesTied) / a.matchesPlayed : 0;
        const winPctB =
          b.matchesPlayed > 0 ? (b.matchesWon + 0.5 * b.matchesTied) / b.matchesPlayed : 0;
        const winPctDiff = winPctB - winPctA;
        if (winPctDiff !== 0) return winPctDiff;

        const strokeDiff = a.totalStrokes - b.totalStrokes;
        if (strokeDiff !== 0) return strokeDiff;

        return a.teamSeasonId.localeCompare(b.teamSeasonId);
      });

    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    return {
      flightId: flightId.toString(),
      flightName: flight.league.name,
      standings,
    };
  }

  async getLeagueStandings(seasonId: bigint): Promise<GolfLeagueStandingsType> {
    const flights = await this.flightRepository.findBySeasonId(seasonId);
    if (flights.length === 0) {
      throw new NotFoundError('No flights found for this season');
    }
    const flightStandings: GolfFlightStandingsType[] = [];

    for (const flight of flights) {
      const standings = await this.getFlightStandings(flight.id);
      flightStandings.push(standings);
    }

    return {
      seasonId: seasonId.toString(),
      flights: flightStandings,
    };
  }

  private formatTeamStanding(data: TeamStandingData): GolfTeamStandingType {
    const totalPoints = data.matchPoints + data.strokePoints;
    const averageScore =
      data.roundsPlayed > 0
        ? Math.round((data.totalStrokes / data.roundsPlayed) * 10) / 10
        : undefined;

    return {
      teamSeasonId: data.teamSeasonId.toString(),
      teamName: data.teamName,
      matchesPlayed: data.matchesPlayed,
      matchesWon: data.matchesWon,
      matchesLost: data.matchesLost,
      matchesTied: data.matchesTied,
      matchPoints: data.matchPoints,
      strokePoints: data.strokePoints,
      totalPoints,
      totalStrokes: data.totalStrokes,
      averageScore,
    };
  }

  async calculateMatchPoints(
    matchId: bigint,
  ): Promise<{ team1Points: number; team2Points: number }> {
    const match = await this.matchRepository.findByIdWithScores(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.matchstatus !== GolfMatchStatus.COMPLETED) {
      return { team1Points: 0, team2Points: 0 };
    }

    const team1Scores = match.golfmatchscores.filter((ms) => ms.teamid === match.team1);
    const team2Scores = match.golfmatchscores.filter((ms) => ms.teamid === match.team2);

    const team1Total = team1Scores.reduce((sum, ms) => sum + ms.golfscore.totalscore, 0);
    const team2Total = team2Scores.reduce((sum, ms) => sum + ms.golfscore.totalscore, 0);

    let team1Points = 0;
    let team2Points = 0;

    if (team1Total < team2Total) {
      team1Points = 2;
    } else if (team2Total < team1Total) {
      team2Points = 2;
    } else {
      team1Points = 1;
      team2Points = 1;
    }

    const strokeDiff = Math.abs(team1Total - team2Total);
    if (team1Total < team2Total) {
      team1Points += strokeDiff;
    } else if (team2Total < team1Total) {
      team2Points += strokeDiff;
    }

    return { team1Points, team2Points };
  }
}
