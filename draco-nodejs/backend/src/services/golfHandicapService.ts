import {
  PlayerHandicapType,
  LeagueHandicapsType,
  GolfDifferentialType,
  CourseHandicapType,
  BatchCourseHandicapResponseType,
  PlayerCourseHandicapType,
} from '@draco/shared-schemas';
import { IGolfScoreRepository } from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfTeeRepository } from '../repositories/interfaces/IGolfTeeRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { combineNineHoleScores } from '../utils/whsCalculator.js';

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

const MAX_SCORES_TO_FETCH = 40;
const MAX_DIFFERENTIALS_FOR_HANDICAP = 20;

export class GolfHandicapService {
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly teamRepository: IGolfTeamRepository;
  private readonly teeRepository: IGolfTeeRepository;
  private readonly courseRepository: IGolfCourseRepository;

  constructor(
    scoreRepository?: IGolfScoreRepository,
    flightRepository?: IGolfFlightRepository,
    rosterRepository?: IGolfRosterRepository,
    teamRepository?: IGolfTeamRepository,
    teeRepository?: IGolfTeeRepository,
    courseRepository?: IGolfCourseRepository,
  ) {
    this.scoreRepository = scoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
    this.teeRepository = teeRepository ?? RepositoryFactory.getGolfTeeRepository();
    this.courseRepository = courseRepository ?? RepositoryFactory.getGolfCourseRepository();
  }

  calculateDifferential(score: number, courseRating: number, slopeRating: number): number {
    const differential = ((score - courseRating) * 113) / slopeRating;
    return Math.round(differential * 10) / 10;
  }

  async calculateHandicapIndex(golferId: bigint): Promise<number | null> {
    const scores = await this.scoreRepository.findByGolferId(golferId, MAX_SCORES_TO_FETCH);

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

    const eighteenHoleScores = scores.filter((s) => s.holesplayed === 18);
    const nineHoleScores = scores
      .filter((s) => s.holesplayed === 9)
      .sort((a, b) => a.dateplayed.getTime() - b.dateplayed.getTime());

    for (const score of eighteenHoleScores) {
      const rating = Number(score.golfteeinformation.mensrating) || 72;
      const slope = Number(score.golfteeinformation.menslope) || 113;

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
    }

    for (let i = 0; i < nineHoleScores.length - 1; i += 2) {
      const first = nineHoleScores[i];
      const second = nineHoleScores[i + 1];

      const combined = combineNineHoleScores(
        {
          id: first.id,
          totalScore: first.totalscore,
          rating: Number(first.golfteeinformation.mensrating) || 72,
          slope: Number(first.golfteeinformation.menslope) || 113,
          datePlayed: first.dateplayed,
          courseName: first.golfcourse.name,
        },
        {
          id: second.id,
          totalScore: second.totalscore,
          rating: Number(second.golfteeinformation.mensrating) || 72,
          slope: Number(second.golfteeinformation.menslope) || 113,
          datePlayed: second.dateplayed,
          courseName: second.golfcourse.name,
        },
      );

      differentials.push({
        scoreId: combined.firstScoreId,
        datePlayed: combined.earlierDate,
        courseName: combined.courseNames,
        score: combined.combinedScore,
        rating: combined.combinedRating,
        slope: combined.combinedSlope,
        differential: combined.differential,
        holesPlayed: 18,
      });
    }

    return differentials;
  }

  private computeHandicapFromDifferentials(differentials: ScoreDifferential[]): number {
    const sorted = [...differentials].sort((a, b) => a.differential - b.differential);
    const count = Math.min(sorted.length, MAX_DIFFERENTIALS_FOR_HANDICAP);
    const usedCount = HANDICAP_LOOKUP[count] ?? Math.floor(count * 0.4);
    const reduction = BONUS_REDUCTION[count] ?? 0;

    const lowestDifferentials = sorted.slice(0, usedCount);
    const sum = lowestDifferentials.reduce((acc, d) => acc + d.differential, 0);
    const average = sum / usedCount;

    let handicapIndex = average * 0.96 - reduction;
    handicapIndex = Math.round(handicapIndex * 10) / 10;

    return Math.max(0, handicapIndex);
  }

  async getPlayerHandicap(golferId: bigint, includeDetails = false): Promise<PlayerHandicapType> {
    const scores = await this.scoreRepository.findByGolferId(golferId, MAX_SCORES_TO_FETCH);

    if (scores.length === 0) {
      return {
        contactId: '',
        firstName: '',
        lastName: '',
        handicapIndex: null,
        roundsUsed: 0,
        totalRounds: 0,
      };
    }

    const differentials = this.processScorestoDifferentials(scores);
    const sorted = [...differentials].sort((a, b) => a.differential - b.differential);
    const count = Math.min(sorted.length, MAX_DIFFERENTIALS_FOR_HANDICAP);
    const usedCount = HANDICAP_LOOKUP[count] ?? Math.floor(count * 0.4);

    let handicapIndex: number | null = null;
    if (differentials.length >= 3) {
      handicapIndex = this.computeHandicapFromDifferentials(differentials);
    }

    const contact = scores[0].golfer.contact;
    const result: PlayerHandicapType = {
      contactId: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      handicapIndex,
      roundsUsed: Math.min(usedCount, differentials.length),
      totalRounds: differentials.length,
      lastUpdated: scores[0]?.dateplayed?.toISOString().split('T')[0],
    };

    if (includeDetails) {
      result.differentials = sorted
        .slice(0, MAX_DIFFERENTIALS_FOR_HANDICAP)
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

        const handicap = await this.getPlayerHandicap(entry.golferid);
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

  async calculateBatchCourseHandicaps(
    golferIds: bigint[],
    teeId: bigint,
    holesPlayed: number,
  ): Promise<BatchCourseHandicapResponseType> {
    const tee = await this.teeRepository.findById(teeId);
    if (!tee) {
      throw new NotFoundError('Tee not found');
    }

    const course = await this.courseRepository.findById(tee.courseid);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const isNineHoles = holesPlayed === 9;
    const courseRating = isNineHoles
      ? Number(tee.mensratingfront9) || Number(tee.mensrating) / 2
      : Number(tee.mensrating);
    const slopeRating = isNineHoles
      ? Number(tee.menslopefront9) || Number(tee.menslope)
      : Number(tee.menslope);

    const mensPar =
      course.menspar1 +
      course.menspar2 +
      course.menspar3 +
      course.menspar4 +
      course.menspar5 +
      course.menspar6 +
      course.menspar7 +
      course.menspar8 +
      course.menspar9 +
      (isNineHoles
        ? 0
        : course.menspar10 +
          course.menspar11 +
          course.menspar12 +
          course.menspar13 +
          course.menspar14 +
          course.menspar15 +
          course.menspar16 +
          course.menspar17 +
          course.menspar18);

    const golfers = await this.rosterRepository.findGolfersByIds(golferIds);

    const players: PlayerCourseHandicapType[] = await Promise.all(
      golferIds.map(async (golferId) => {
        const golfer = golfers.find((g) => g.id === golferId);
        if (!golfer) {
          return {
            golferId: golferId.toString(),
            gender: 'M' as const,
            handicapIndex: null,
            courseHandicap: null,
          };
        }

        let handicapIndex = await this.calculateHandicapIndex(golferId);

        if (handicapIndex === null && golfer.initialdifferential !== null) {
          handicapIndex = golfer.initialdifferential;
        }

        const gender = (golfer.gender === 'F' ? 'F' : 'M') as 'M' | 'F';

        if (handicapIndex === null) {
          return {
            golferId: golferId.toString(),
            gender,
            handicapIndex: null,
            courseHandicap: null,
          };
        }

        const courseHandicapResult = this.calculateCourseHandicap(
          handicapIndex,
          slopeRating,
          courseRating,
          mensPar,
        );

        return {
          golferId: golferId.toString(),
          gender,
          handicapIndex,
          courseHandicap: courseHandicapResult.courseHandicap,
        };
      }),
    );

    return {
      teeId: teeId.toString(),
      courseRating,
      slopeRating,
      par: mensPar,
      holesPlayed,
      players,
    };
  }
}
