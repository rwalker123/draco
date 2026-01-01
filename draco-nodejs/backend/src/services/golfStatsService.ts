import {
  GolfLeaderType,
  GolfScoringAverageType,
  GolfSkinsEntryType,
  GolfFlightLeadersType,
} from '@draco/shared-schemas';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfScoreRepository } from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { GolfHandicapService } from './golfHandicapService.js';

interface PlayerScoreData {
  contactId: bigint;
  firstName: string;
  lastName: string;
  teamName?: string;
  scores: number[];
  netScores: number[];
  courseHandicaps: number[];
}

interface HoleScoreData {
  contactId: bigint;
  firstName: string;
  lastName: string;
  teamName?: string;
  hole: number;
  score: number;
}

const MATCH_STATUS_COMPLETED = 2;

export class GolfStatsService {
  private readonly matchRepository: IGolfMatchRepository;
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly teamRepository: IGolfTeamRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly handicapService: GolfHandicapService;

  constructor(
    matchRepository?: IGolfMatchRepository,
    scoreRepository?: IGolfScoreRepository,
    flightRepository?: IGolfFlightRepository,
    teamRepository?: IGolfTeamRepository,
    rosterRepository?: IGolfRosterRepository,
    handicapService?: GolfHandicapService,
  ) {
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.scoreRepository = scoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.handicapService = handicapService ?? new GolfHandicapService();
  }

  async getFlightLeaders(flightId: bigint): Promise<GolfFlightLeadersType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);

    const lowActualScore = this.calculateLowScoreLeaders(playerData, 'actual');
    const lowNetScore = this.calculateLowScoreLeaders(playerData, 'net');
    const scoringAverages = this.calculateScoringAverages(playerData);
    const skins = await this.calculateSkinsLeaders(flightId);

    return {
      flightId: flightId.toString(),
      flightName: flight.divisiondefs.name,
      lowActualScore,
      lowNetScore,
      scoringAverages,
      skins: skins.length > 0 ? skins : undefined,
    };
  }

  async getLowScoreLeaders(
    flightId: bigint,
    type: 'actual' | 'net',
    limit = 10,
  ): Promise<GolfLeaderType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);
    return this.calculateLowScoreLeaders(playerData, type, limit);
  }

  async getScoringAverages(flightId: bigint, limit = 20): Promise<GolfScoringAverageType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);
    return this.calculateScoringAverages(playerData, limit);
  }

  async getSkinsLeaders(flightId: bigint): Promise<GolfSkinsEntryType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    return this.calculateSkinsLeaders(flightId);
  }

  private async collectPlayerScores(flightId: bigint): Promise<Map<string, PlayerScoreData>> {
    const teams = await this.teamRepository.findByFlightId(flightId);
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === MATCH_STATUS_COMPLETED);

    const playerDataMap = new Map<string, PlayerScoreData>();

    for (const team of teams) {
      const roster = await this.rosterRepository.findByTeamSeasonId(team.id);

      for (const entry of roster) {
        if (!entry.isactive) continue;

        const golferIdStr = entry.golferid.toString();
        if (!playerDataMap.has(golferIdStr)) {
          playerDataMap.set(golferIdStr, {
            contactId: entry.golfer.contact.id,
            firstName: entry.golfer.contact.firstname,
            lastName: entry.golfer.contact.lastname,
            teamName: team.name,
            scores: [],
            netScores: [],
            courseHandicaps: [],
          });
        }
      }
    }

    for (const match of completedMatches) {
      const matchScores = await this.scoreRepository.findByMatchId(match.id);

      for (const ms of matchScores) {
        const golferIdStr = ms.golfscore.golferid.toString();
        const playerData = playerDataMap.get(golferIdStr);

        if (playerData) {
          const score = ms.golfscore.totalscore;
          playerData.scores.push(score);

          const handicapIndex = await this.handicapService.calculateHandicapIndex(
            ms.golfscore.golferid,
          );
          if (handicapIndex !== null) {
            const courseRating = Number(ms.golfscore.golfteeinformation.mensrating) || 72;
            const slopeRating = Number(ms.golfscore.golfteeinformation.menslope) || 113;
            const par = 72;

            const courseHandicap = this.handicapService.calculateCourseHandicap(
              handicapIndex,
              slopeRating,
              courseRating,
              par,
            );

            playerData.courseHandicaps.push(courseHandicap.courseHandicap);
            playerData.netScores.push(score - courseHandicap.courseHandicap);
          } else {
            playerData.netScores.push(score);
          }
        }
      }
    }

    return playerDataMap;
  }

  private calculateLowScoreLeaders(
    playerData: Map<string, PlayerScoreData>,
    type: 'actual' | 'net',
    limit = 10,
  ): GolfLeaderType[] {
    const leaders: Array<{
      contactId: bigint;
      firstName: string;
      lastName: string;
      teamName?: string;
      value: number;
    }> = [];

    for (const [, data] of playerData) {
      const scores = type === 'actual' ? data.scores : data.netScores;
      if (scores.length === 0) continue;

      const lowestScore = Math.min(...scores);
      leaders.push({
        contactId: data.contactId,
        firstName: data.firstName,
        lastName: data.lastName,
        teamName: data.teamName,
        value: lowestScore,
      });
    }

    leaders.sort((a, b) => a.value - b.value);

    let rank = 1;
    let prevValue = -1;
    let prevRank = 1;

    return leaders.slice(0, limit).map((leader, index) => {
      if (leader.value !== prevValue) {
        rank = index + 1;
        prevRank = rank;
      } else {
        rank = prevRank;
      }
      prevValue = leader.value;

      return {
        contactId: leader.contactId.toString(),
        firstName: leader.firstName,
        lastName: leader.lastName,
        teamName: leader.teamName,
        value: leader.value,
        rank,
      };
    });
  }

  private calculateScoringAverages(
    playerData: Map<string, PlayerScoreData>,
    limit = 20,
  ): GolfScoringAverageType[] {
    const averages: GolfScoringAverageType[] = [];

    for (const [, data] of playerData) {
      if (data.scores.length === 0) continue;

      const avgScore =
        Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10;
      const avgNetScore =
        data.netScores.length > 0
          ? Math.round((data.netScores.reduce((a, b) => a + b, 0) / data.netScores.length) * 10) /
            10
          : undefined;

      averages.push({
        contactId: data.contactId.toString(),
        firstName: data.firstName,
        lastName: data.lastName,
        teamName: data.teamName,
        roundsPlayed: data.scores.length,
        averageScore: avgScore,
        averageNetScore: avgNetScore,
      });
    }

    averages.sort((a, b) => a.averageScore - b.averageScore);

    return averages.slice(0, limit);
  }

  private async calculateSkinsLeaders(flightId: bigint): Promise<GolfSkinsEntryType[]> {
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === MATCH_STATUS_COMPLETED);

    const skinsMap = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        skinsWon: number;
      }
    >();

    for (const match of completedMatches) {
      const matchWithScores = await this.matchRepository.findByIdWithScores(match.id);
      if (!matchWithScores) continue;

      const holeScores = this.collectHoleScores(matchWithScores);

      for (let hole = 1; hole <= 9; hole++) {
        const holeData = holeScores.filter((h) => h.hole === hole);
        if (holeData.length === 0) continue;

        const minScore = Math.min(...holeData.map((h) => h.score));
        const winners = holeData.filter((h) => h.score === minScore);

        if (winners.length === 1) {
          const winner = winners[0];
          const contactIdStr = winner.contactId.toString();

          if (!skinsMap.has(contactIdStr)) {
            skinsMap.set(contactIdStr, {
              contactId: winner.contactId,
              firstName: winner.firstName,
              lastName: winner.lastName,
              teamName: winner.teamName,
              skinsWon: 0,
            });
          }

          skinsMap.get(contactIdStr)!.skinsWon++;
        }
      }
    }

    const entries: GolfSkinsEntryType[] = Array.from(skinsMap.values())
      .filter((e) => e.skinsWon > 0)
      .map((e) => ({
        contactId: e.contactId.toString(),
        firstName: e.firstName,
        lastName: e.lastName,
        teamName: e.teamName,
        skinsWon: e.skinsWon,
      }))
      .sort((a, b) => b.skinsWon - a.skinsWon);

    return entries;
  }

  private collectHoleScores(
    match: NonNullable<Awaited<ReturnType<IGolfMatchRepository['findByIdWithScores']>>>,
  ): HoleScoreData[] {
    const holeScores: HoleScoreData[] = [];

    for (const ms of match.golfmatchscores) {
      const score = ms.golfscore;
      const contact = ms.golfer.contact;
      const teamName = ms.teamsseason.name;

      const holes = [
        score.holescrore1,
        score.holescrore2,
        score.holescrore3,
        score.holescrore4,
        score.holescrore5,
        score.holescrore6,
        score.holescrore7,
        score.holescrore8,
        score.holescrore9,
      ];

      holes.forEach((holeScore, index) => {
        if (holeScore > 0) {
          holeScores.push({
            contactId: contact.id,
            firstName: contact.firstname,
            lastName: contact.lastname,
            teamName,
            hole: index + 1,
            score: holeScore,
          });
        }
      });
    }

    return holeScores;
  }
}
