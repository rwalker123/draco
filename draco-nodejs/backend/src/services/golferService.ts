import {
  GolferType,
  CreateGolfScoreType,
  GolfScoreWithDetailsType,
  UpdateGolfScoreType,
  ContactIndividualGolfAccountType,
  GolferSummaryType,
} from '@draco/shared-schemas';
import {
  IGolferRepository,
  GolferWithHomeCourse,
} from '../repositories/interfaces/IGolferRepository.js';
import { IAccountRepository } from '../repositories/interfaces/IAccountRepository.js';
import { IContactRepository } from '../repositories/interfaces/IContactRepository.js';
import { IGolfCourseRepository } from '../repositories/interfaces/IGolfCourseRepository.js';
import {
  IGolfScoreRepository,
  GolfScoreWithDetails,
} from '../repositories/interfaces/IGolfScoreRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  GolferResponseFormatter,
  GolferStats,
} from '../responseFormatters/golferResponseFormatter.js';
import { GolfScoreResponseFormatter } from '../responseFormatters/golfScoreResponseFormatter.js';
import { NotFoundError, AuthorizationError } from '../utils/customErrors.js';
import {
  normalizeGender,
  calculateHandicapIndex,
  calculateAverageScore,
  applyExceptionalScoreReduction,
  getRatingsForGender,
  TeeRatings,
  ScoreForAverage,
} from '../utils/whsCalculator.js';

const RECENT_SCORES_LIMIT = 20;
const GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID = BigInt(5);

export class GolferService {
  private readonly golferRepository: IGolferRepository;
  private readonly accountRepository: IAccountRepository;
  private readonly contactRepository: IContactRepository;
  private readonly golfCourseRepository: IGolfCourseRepository;
  private readonly golfScoreRepository: IGolfScoreRepository;

  constructor(
    golferRepository?: IGolferRepository,
    accountRepository?: IAccountRepository,
    contactRepository?: IContactRepository,
    golfScoreRepository?: IGolfScoreRepository,
  ) {
    this.golferRepository = golferRepository ?? RepositoryFactory.getGolferRepository();
    this.golfCourseRepository = RepositoryFactory.getGolfCourseRepository();
    this.golfScoreRepository = golfScoreRepository ?? RepositoryFactory.getGolfScoreRepository();
    this.accountRepository = accountRepository ?? RepositoryFactory.getAccountRepository();
    this.contactRepository = contactRepository ?? RepositoryFactory.getContactRepository();
  }

  async getGolferByContactId(contactId: bigint): Promise<GolferType | null> {
    const golfer = await this.golferRepository.findByContactId(contactId);
    return golfer ? GolferResponseFormatter.format(golfer) : null;
  }

  async getGolferForAccount(accountId: bigint): Promise<GolferType> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new NotFoundError('Account does not have an owner contact');
    }

    const golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      throw new NotFoundError('Golfer profile not found for this account');
    }

    const scores = await this.golfScoreRepository.findByGolferId(golfer.id, RECENT_SCORES_LIMIT);
    const stats = await this.calculateGolferStats(golfer, scores);

    return GolferResponseFormatter.format(golfer, stats);
  }

  async updateHomeCourse(golferId: bigint, homeCourseId: bigint | null): Promise<GolferType> {
    const golfer = await this.golferRepository.findById(golferId);
    if (!golfer) {
      throw new NotFoundError('Golfer not found');
    }

    if (homeCourseId !== null) {
      const courseExists = await this.golfCourseRepository.findById(homeCourseId);
      if (!courseExists) {
        throw new NotFoundError('Golf course not found');
      }
    }

    const updated = await this.golferRepository.updateHomeCourse(golferId, homeCourseId);
    return GolferResponseFormatter.format(updated);
  }

  async updateHomeCourseForAccount(
    accountId: bigint,
    homeCourseId: bigint | null,
  ): Promise<GolferType> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new AuthorizationError('Owner contact for the specified account was not found');
    }

    if (homeCourseId !== null) {
      const courseExists = await this.golfCourseRepository.findById(homeCourseId);
      if (!courseExists) {
        throw new NotFoundError('Golf course not found');
      }
    }

    let golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      golfer = await this.golferRepository.create(ownerContact.id, homeCourseId ?? undefined);
      return GolferResponseFormatter.format(golfer);
    }

    const updated = await this.golferRepository.updateHomeCourse(golfer.id, homeCourseId);
    return GolferResponseFormatter.format(updated);
  }

  async createGolfer(contactId: bigint, homeCourseId?: bigint): Promise<GolferType> {
    const existing = await this.golferRepository.findByContactId(contactId);
    if (existing) {
      return GolferResponseFormatter.format(existing);
    }

    const golfer = await this.golferRepository.create(contactId, homeCourseId);
    return GolferResponseFormatter.format(golfer);
  }

  async createScoreForAccount(
    accountId: bigint,
    scoreData: CreateGolfScoreType,
  ): Promise<GolfScoreWithDetailsType> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new AuthorizationError('Owner contact for the specified account was not found');
    }

    let golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      golfer = await this.golferRepository.create(ownerContact.id);
    }

    const courseWithTees = await this.golfCourseRepository.findByIdWithTees(
      BigInt(scoreData.courseId),
    );
    if (!courseWithTees) {
      throw new NotFoundError('Golf course not found');
    }

    const tee = courseWithTees.golfteeinformation.find((t) => t.id === BigInt(scoreData.teeId));
    if (!tee) {
      throw new NotFoundError('Tee not found for this course');
    }

    const holeScores = scoreData.holeScores ?? [];
    const totalScore = scoreData.totalScore ?? holeScores.reduce((sum, score) => sum + score, 0);

    const createData = {
      courseid: BigInt(scoreData.courseId),
      golferid: golfer.id,
      teeid: BigInt(scoreData.teeId),
      dateplayed: new Date(scoreData.datePlayed),
      holesplayed: scoreData.holesPlayed,
      totalscore: totalScore,
      totalsonly: scoreData.totalsOnly,
      holescrore1: holeScores[0] ?? 0,
      holescrore2: holeScores[1] ?? 0,
      holescrore3: holeScores[2] ?? 0,
      holescrore4: holeScores[3] ?? 0,
      holescrore5: holeScores[4] ?? 0,
      holescrore6: holeScores[5] ?? 0,
      holescrore7: holeScores[6] ?? 0,
      holescrore8: holeScores[7] ?? 0,
      holescrore9: holeScores[8] ?? 0,
      holescrore10: holeScores[9] ?? 0,
      holescrore11: holeScores[10] ?? 0,
      holescrore12: holeScores[11] ?? 0,
      holescrore13: holeScores[12] ?? 0,
      holescrore14: holeScores[13] ?? 0,
      holescrore15: holeScores[14] ?? 0,
      holescrore16: holeScores[15] ?? 0,
      holescrore17: holeScores[16] ?? 0,
      holescrore18: holeScores[17] ?? 0,
      startindex: scoreData.startIndex ?? null,
    };

    const createdScore = await this.golfScoreRepository.create(createData);

    const scoreWithDetails = await this.golfScoreRepository.findById(createdScore.id);
    if (!scoreWithDetails) {
      throw new NotFoundError('Created score not found');
    }

    return GolfScoreResponseFormatter.formatWithDetails(scoreWithDetails);
  }

  async getScoresForAccount(accountId: bigint, limit = 20): Promise<GolfScoreWithDetailsType[]> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new AuthorizationError('Owner contact for the specified account was not found');
    }

    const golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      return [];
    }

    const scores = await this.golfScoreRepository.findByGolferId(golfer.id, limit);
    return scores.map((score) => GolfScoreResponseFormatter.formatWithDetails(score));
  }

  async updateScoreForAccount(
    accountId: bigint,
    scoreId: bigint,
    updateData: UpdateGolfScoreType,
  ): Promise<GolfScoreWithDetailsType> {
    const { existingScore } = await this.verifyScoreOwnership(accountId, scoreId);

    if (updateData.courseId) {
      const courseWithTees = await this.golfCourseRepository.findByIdWithTees(
        BigInt(updateData.courseId),
      );
      if (!courseWithTees) {
        throw new NotFoundError('Golf course not found');
      }

      if (updateData.teeId) {
        const teeId = BigInt(updateData.teeId);
        const tee = courseWithTees.golfteeinformation.find((t) => t.id === teeId);
        if (!tee) {
          throw new NotFoundError('Tee not found for this course');
        }
      }
    } else if (updateData.teeId) {
      const teeId = BigInt(updateData.teeId);
      const courseWithTees = await this.golfCourseRepository.findByIdWithTees(
        existingScore.courseid,
      );
      if (!courseWithTees) {
        throw new NotFoundError('Golf course not found');
      }
      const tee = courseWithTees.golfteeinformation.find((t) => t.id === teeId);
      if (!tee) {
        throw new NotFoundError('Tee not found for this course');
      }
    }

    const holeScores = updateData.holeScores;
    const repoUpdateData: Parameters<typeof this.golfScoreRepository.update>[1] = {};

    if (updateData.courseId !== undefined) {
      repoUpdateData.courseid = BigInt(updateData.courseId);
    }
    if (updateData.teeId !== undefined) {
      repoUpdateData.teeid = BigInt(updateData.teeId);
    }
    if (updateData.datePlayed !== undefined) {
      repoUpdateData.dateplayed = new Date(updateData.datePlayed);
    }
    if (updateData.holesPlayed !== undefined) {
      repoUpdateData.holesplayed = updateData.holesPlayed;
    }
    if (updateData.totalsOnly !== undefined) {
      repoUpdateData.totalsonly = updateData.totalsOnly;
    }
    if (updateData.totalScore !== undefined) {
      repoUpdateData.totalscore = updateData.totalScore;
    } else if (holeScores) {
      repoUpdateData.totalscore = holeScores.reduce((sum, score) => sum + score, 0);
    }

    if (holeScores) {
      repoUpdateData.holescrore1 = holeScores[0] ?? 0;
      repoUpdateData.holescrore2 = holeScores[1] ?? 0;
      repoUpdateData.holescrore3 = holeScores[2] ?? 0;
      repoUpdateData.holescrore4 = holeScores[3] ?? 0;
      repoUpdateData.holescrore5 = holeScores[4] ?? 0;
      repoUpdateData.holescrore6 = holeScores[5] ?? 0;
      repoUpdateData.holescrore7 = holeScores[6] ?? 0;
      repoUpdateData.holescrore8 = holeScores[7] ?? 0;
      repoUpdateData.holescrore9 = holeScores[8] ?? 0;
      repoUpdateData.holescrore10 = holeScores[9] ?? 0;
      repoUpdateData.holescrore11 = holeScores[10] ?? 0;
      repoUpdateData.holescrore12 = holeScores[11] ?? 0;
      repoUpdateData.holescrore13 = holeScores[12] ?? 0;
      repoUpdateData.holescrore14 = holeScores[13] ?? 0;
      repoUpdateData.holescrore15 = holeScores[14] ?? 0;
      repoUpdateData.holescrore16 = holeScores[15] ?? 0;
      repoUpdateData.holescrore17 = holeScores[16] ?? 0;
      repoUpdateData.holescrore18 = holeScores[17] ?? 0;
    }

    await this.golfScoreRepository.update(scoreId, repoUpdateData);

    const updatedScore = await this.golfScoreRepository.findById(scoreId);
    if (!updatedScore) {
      throw new NotFoundError('Updated score not found');
    }

    return GolfScoreResponseFormatter.formatWithDetails(updatedScore);
  }

  async deleteScoreForAccount(accountId: bigint, scoreId: bigint): Promise<void> {
    await this.verifyScoreOwnership(accountId, scoreId);
    await this.golfScoreRepository.delete(scoreId);
  }

  async getGolferSummaryForAccount(accountId: bigint): Promise<GolferSummaryType | null> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return null;
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      return null;
    }

    const golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      return null;
    }

    const scores = await this.golfScoreRepository.findByGolferId(golfer.id, RECENT_SCORES_LIMIT);
    const stats = await this.calculateGolferStats(golfer, scores);

    return {
      handicapIndex: stats.handicapIndex,
      isInitialHandicap:
        golfer.initialdifferential !== null &&
        stats.handicapIndex !== null &&
        stats.handicapIndex === golfer.initialdifferential,
      averageScore: stats.averageScore,
      roundsPlayed: stats.roundsPlayed,
    };
  }

  async getIndividualGolfAccountForContact(
    contactId: bigint,
  ): Promise<ContactIndividualGolfAccountType> {
    const contact = await this.contactRepository.findById(contactId);
    if (!contact || !contact.userid) {
      return null;
    }

    const individualAccount = await this.accountRepository.findByOwnerUserIdAndType(
      contact.userid,
      GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID,
    );

    if (!individualAccount) {
      return null;
    }

    try {
      const golfer = await this.getGolferForAccount(individualAccount.id);
      return {
        accountId: individualAccount.id.toString(),
        accountName: individualAccount.name,
        handicapIndex: golfer.handicapIndex ?? null,
        isInitialHandicap:
          golfer.initialDifferential !== null &&
          golfer.handicapIndex !== null &&
          golfer.handicapIndex === golfer.initialDifferential,
        averageScore: golfer.averageScore ?? null,
        roundsPlayed: golfer.roundsPlayed ?? 0,
      };
    } catch (error) {
      console.error('Failed to fetch golfer for individual account:', error);
      return null;
    }
  }

  private async verifyScoreOwnership(
    accountId: bigint,
    scoreId: bigint,
  ): Promise<{ golfer: GolferWithHomeCourse; existingScore: GolfScoreWithDetails }> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const ownerContact = await this.findOwnerContact(accountId, account.owneruserid);
    if (!ownerContact) {
      throw new AuthorizationError('Owner contact for the specified account was not found');
    }

    const golfer = await this.golferRepository.findByContactId(ownerContact.id);
    if (!golfer) {
      throw new NotFoundError('Golfer not found');
    }

    const existingScore = await this.golfScoreRepository.findById(scoreId);
    if (!existingScore) {
      throw new NotFoundError('Score not found');
    }

    if (existingScore.golferid !== golfer.id) {
      throw new AuthorizationError('Score does not belong to this account');
    }

    return { golfer, existingScore };
  }

  private async findOwnerContact(
    accountId: bigint,
    ownerUserId: string | null,
  ): Promise<{ id: bigint } | null> {
    if (!ownerUserId) {
      return null;
    }

    const contacts = await this.contactRepository.findContactsByUserIds([ownerUserId]);
    const ownerContact = contacts.find(
      (contact) => contact.userid === ownerUserId && contact.creatoraccountid === accountId,
    );

    return ownerContact ? { id: ownerContact.id } : null;
  }

  private async calculateGolferStats(
    golfer: GolferWithHomeCourse,
    scores: GolfScoreWithDetails[],
  ): Promise<GolferStats> {
    const roundsPlayed = scores.length;

    if (roundsPlayed === 0) {
      return {
        handicapIndex: null,
        lowHandicapIndex: golfer.lowhandicapindex ?? null,
        averageScore: null,
        roundsPlayed: 0,
      };
    }

    const gender = normalizeGender(golfer.gender);

    const scoresForAverage: ScoreForAverage[] = scores.map((score) => ({
      totalScore: score.totalscore,
      holesPlayed: score.holesplayed,
    }));
    const averageScore = calculateAverageScore(scoresForAverage);

    const differentials = scores.map((score) => {
      const teeRatings: TeeRatings = {
        mensRating: Number(score.golfteeinformation.mensrating) || 72,
        mensSlope: Number(score.golfteeinformation.menslope) || 113,
        womansRating: Number(score.golfteeinformation.womansrating) || 72,
        womansSlope: Number(score.golfteeinformation.womanslope) || 113,
      };
      const { courseRating, slopeRating } = getRatingsForGender(teeRatings, gender);
      const differential = ((score.totalscore - courseRating) * 113) / slopeRating;
      return Math.round(differential * 10) / 10;
    });

    if (differentials.length < 3) {
      return {
        handicapIndex: null,
        lowHandicapIndex: golfer.lowhandicapindex ?? null,
        averageScore,
        roundsPlayed,
      };
    }

    let adjustedDifferentials = differentials;
    const currentLowHI = golfer.lowhandicapindex ?? null;

    if (currentLowHI !== null && differentials.length > 0) {
      const latestDifferential = differentials[0];
      adjustedDifferentials = applyExceptionalScoreReduction(
        differentials,
        currentLowHI,
        latestDifferential,
      );
    }

    const handicapResult = calculateHandicapIndex(adjustedDifferentials, currentLowHI);

    if (!handicapResult) {
      return {
        handicapIndex: null,
        lowHandicapIndex: currentLowHI,
        averageScore,
        roundsPlayed,
      };
    }

    if (
      handicapResult.newLowHandicapIndex !== currentLowHI &&
      (currentLowHI === null || handicapResult.newLowHandicapIndex < currentLowHI)
    ) {
      await this.golferRepository.updateLowHandicapIndex(
        golfer.id,
        handicapResult.newLowHandicapIndex,
      );
    }

    return {
      handicapIndex: handicapResult.handicapIndex,
      lowHandicapIndex: handicapResult.newLowHandicapIndex,
      averageScore,
      roundsPlayed,
    };
  }
}
