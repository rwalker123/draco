import {
  PlayerHandicapType,
  LeagueHandicapsType,
  GolfDifferentialType,
  CourseHandicapType,
} from '@draco/shared-schemas';
import { IGolfScoreRepository } from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';

interface ScoreDifferential {
  scoreId: bigint;
  datePlayed: Date;
  courseName: string;
  score: number;
  rating: number;
  slope: number;
  differential: number;
  holesPlayed: number;
}

const HANDICAP_LOOKUP: Record<number, number> = {
  3: 1,
  4: 1,
  5: 1,
  6: 2,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 6,
  16: 6,
  17: 7,
  18: 8,
  19: 8,
  20: 10,
};

const BONUS_REDUCTION: Record<number, number> = {
  3: 2.0,
  4: 1.0,
  5: 0.0,
  6: 1.0,
};

export class GolfHandicapService {
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly teamRepository: IGolfTeamRepository;

  constructor(
    scoreRepository?: IGolfScoreRepository,
    flightRepository?: IGolfFlightRepository,
    rosterRepository?: IGolfRosterRepository,
    teamRepository?: IGolfTeamRepository,
  ) {
    this.scoreRepository = scoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
  }

  calculateDifferential(score: number, courseRating: number, slopeRating: number): number {
    const differential = ((score - courseRating) * 113) / slopeRating;
    return Math.round(differential * 10) / 10;
  }

  async calculateHandicapIndex(contactId: bigint): Promise<number | null> {
    const scores = await this.scoreRepository.findByContactId(contactId, 40);

    if (scores.length === 0) {
      return null;
    }

    const differentials = this.processScorestoDifferentials(scores);

    if (differentials.length < 3) {
      return null;
    }

    return this.computeHandicapFromDifferentials(differentials);
  }

  private processScorestoDifferentials(
    scores: Array<{
      id: bigint;
      dateplayed: Date;
      totalscore: number;
      holesplayed: number;
      golfcourse: { name: string };
      golfteeinformation: { mensrating: unknown; menslope: unknown };
    }>,
  ): ScoreDifferential[] {
    const differentials: ScoreDifferential[] = [];

    for (const score of scores) {
      const rating = Number(score.golfteeinformation.mensrating) || 72;
      const slope = Number(score.golfteeinformation.menslope) || 113;

      if (score.holesplayed === 18) {
        differentials.push({
          scoreId: score.id,
          datePlayed: score.dateplayed,
          courseName: score.golfcourse.name,
          score: score.totalscore,
          rating,
          slope,
          differential: this.calculateDifferential(score.totalscore, rating, slope),
          holesPlayed: 18,
        });
      } else if (score.holesplayed === 9) {
        differentials.push({
          scoreId: score.id,
          datePlayed: score.dateplayed,
          courseName: score.golfcourse.name,
          score: score.totalscore,
          rating: rating / 2,
          slope,
          differential: this.calculateDifferential(score.totalscore, rating / 2, slope),
          holesPlayed: 9,
        });
      }
    }

    return differentials;
  }

  private computeHandicapFromDifferentials(differentials: ScoreDifferential[]): number {
    const sorted = [...differentials].sort((a, b) => a.differential - b.differential);
    const count = Math.min(sorted.length, 20);
    const usedCount = HANDICAP_LOOKUP[count] ?? Math.floor(count * 0.4);
    const reduction = BONUS_REDUCTION[count] ?? 0;

    const lowestDifferentials = sorted.slice(0, usedCount);
    const sum = lowestDifferentials.reduce((acc, d) => acc + d.differential, 0);
    const average = sum / usedCount;

    let handicapIndex = average * 0.96 - reduction;
    handicapIndex = Math.round(handicapIndex * 10) / 10;

    return Math.max(0, handicapIndex);
  }

  async getPlayerHandicap(contactId: bigint, includeDetails = false): Promise<PlayerHandicapType> {
    const scores = await this.scoreRepository.findByContactId(contactId, 40);

    if (scores.length === 0) {
      const contact = scores[0]?.contacts;
      return {
        contactId: contactId.toString(),
        firstName: contact?.firstname ?? '',
        lastName: contact?.lastname ?? '',
        handicapIndex: null,
        roundsUsed: 0,
        totalRounds: 0,
      };
    }

    const differentials = this.processScorestoDifferentials(scores);
    const sorted = [...differentials].sort((a, b) => a.differential - b.differential);
    const count = Math.min(sorted.length, 20);
    const usedCount = HANDICAP_LOOKUP[count] ?? Math.floor(count * 0.4);

    let handicapIndex: number | null = null;
    if (differentials.length >= 3) {
      handicapIndex = this.computeHandicapFromDifferentials(differentials);
    }

    const contact = scores[0].contacts;
    const result: PlayerHandicapType = {
      contactId: contactId.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      handicapIndex,
      roundsUsed: Math.min(usedCount, differentials.length),
      totalRounds: differentials.length,
      lastUpdated: scores[0]?.dateplayed?.toISOString().split('T')[0],
    };

    if (includeDetails) {
      result.differentials = sorted
        .slice(0, 20)
        .map((d, index) => this.formatDifferential(d, index < usedCount));
    }

    return result;
  }

  private formatDifferential(
    diff: ScoreDifferential,
    isUsedInCalculation: boolean,
  ): GolfDifferentialType {
    return {
      scoreId: diff.scoreId.toString(),
      datePlayed: diff.datePlayed.toISOString().split('T')[0],
      courseName: diff.courseName,
      score: diff.score,
      rating: diff.rating,
      slope: diff.slope,
      differential: diff.differential,
      isUsedInCalculation,
    };
  }

  async getLeagueHandicaps(flightId: bigint): Promise<LeagueHandicapsType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const teams = await this.teamRepository.findByFlightId(flightId);
    const playerHandicaps: PlayerHandicapType[] = [];

    for (const team of teams) {
      const roster = await this.rosterRepository.findByTeamSeasonId(team.id);

      for (const entry of roster) {
        if (!entry.isactive) continue;

        const handicap = await this.getPlayerHandicap(entry.contactid);
        playerHandicaps.push(handicap);
      }
    }

    playerHandicaps.sort((a, b) => {
      if (a.handicapIndex === null && b.handicapIndex === null) return 0;
      if (a.handicapIndex === null) return 1;
      if (b.handicapIndex === null) return -1;
      return a.handicapIndex - b.handicapIndex;
    });

    return {
      flightId: flightId.toString(),
      flightName: flight.divisiondefs.name,
      players: playerHandicaps,
    };
  }

  calculateCourseHandicap(
    handicapIndex: number,
    slopeRating: number,
    courseRating: number,
    par: number,
  ): CourseHandicapType {
    const courseHandicap = Math.round((handicapIndex * slopeRating) / 113 + (courseRating - par));

    return {
      handicapIndex,
      courseRating,
      slopeRating,
      par,
      courseHandicap,
    };
  }

  calculateESCMaxScore(courseHandicap: number): number {
    if (courseHandicap <= 9) return 10;
    if (courseHandicap <= 19) return 7;
    if (courseHandicap <= 29) return 8;
    if (courseHandicap <= 39) return 9;
    return 10;
  }

  async updatePlayerStartIndex(contactId: bigint): Promise<number | null> {
    const handicapIndex = await this.calculateHandicapIndex(contactId);
    return handicapIndex;
  }
}
