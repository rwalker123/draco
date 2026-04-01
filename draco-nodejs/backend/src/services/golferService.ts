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
  getHolePars,
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

    const scores = await this.golfScoreRepository.findAllByGolferId(golfer.id, RECENT_SCORES_LIMIT);
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

    const gender = normalizeGender(golfer.gender);
    const coursePars = getHolePars(courseWithTees, gender);
    const computedGir = this.computeGirFromPutts(holeScores, scoreData.putts, coursePars);

    const putts = scoreData.putts;
    const fairwaysHit = scoreData.fairwaysHit;

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
      ...(putts && {
        putts1: putts[0] ?? null,
        putts2: putts[1] ?? null,
        putts3: putts[2] ?? null,
        putts4: putts[3] ?? null,
        putts5: putts[4] ?? null,
        putts6: putts[5] ?? null,
        putts7: putts[6] ?? null,
        putts8: putts[7] ?? null,
        putts9: putts[8] ?? null,
        putts10: putts[9] ?? null,
        putts11: putts[10] ?? null,
        putts12: putts[11] ?? null,
        putts13: putts[12] ?? null,
        putts14: putts[13] ?? null,
        putts15: putts[14] ?? null,
        putts16: putts[15] ?? null,
        putts17: putts[16] ?? null,
        putts18: putts[17] ?? null,
      }),
      ...(fairwaysHit && {
        fairway1: fairwaysHit[0] ?? null,
        fairway2: fairwaysHit[1] ?? null,
        fairway3: fairwaysHit[2] ?? null,
        fairway4: fairwaysHit[3] ?? null,
        fairway5: fairwaysHit[4] ?? null,
        fairway6: fairwaysHit[5] ?? null,
        fairway7: fairwaysHit[6] ?? null,
        fairway8: fairwaysHit[7] ?? null,
        fairway9: fairwaysHit[8] ?? null,
        fairway10: fairwaysHit[9] ?? null,
        fairway11: fairwaysHit[10] ?? null,
        fairway12: fairwaysHit[11] ?? null,
        fairway13: fairwaysHit[12] ?? null,
        fairway14: fairwaysHit[13] ?? null,
        fairway15: fairwaysHit[14] ?? null,
        fairway16: fairwaysHit[15] ?? null,
        fairway17: fairwaysHit[16] ?? null,
        fairway18: fairwaysHit[17] ?? null,
      }),
      ...computedGir,
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

    const scores = await this.golfScoreRepository.findAllByGolferId(golfer.id, limit);
    return scores.map((score) => GolfScoreResponseFormatter.formatWithDetails(score));
  }

  async updateScoreForAccount(
    accountId: bigint,
    scoreId: bigint,
    updateData: UpdateGolfScoreType,
  ): Promise<GolfScoreWithDetailsType> {
    const { existingScore, golfer } = await this.verifyScoreOwnership(accountId, scoreId);

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

    if (updateData.putts !== undefined) {
      const p = updateData.putts;
      repoUpdateData.putts1 = p[0] ?? null;
      repoUpdateData.putts2 = p[1] ?? null;
      repoUpdateData.putts3 = p[2] ?? null;
      repoUpdateData.putts4 = p[3] ?? null;
      repoUpdateData.putts5 = p[4] ?? null;
      repoUpdateData.putts6 = p[5] ?? null;
      repoUpdateData.putts7 = p[6] ?? null;
      repoUpdateData.putts8 = p[7] ?? null;
      repoUpdateData.putts9 = p[8] ?? null;
      repoUpdateData.putts10 = p[9] ?? null;
      repoUpdateData.putts11 = p[10] ?? null;
      repoUpdateData.putts12 = p[11] ?? null;
      repoUpdateData.putts13 = p[12] ?? null;
      repoUpdateData.putts14 = p[13] ?? null;
      repoUpdateData.putts15 = p[14] ?? null;
      repoUpdateData.putts16 = p[15] ?? null;
      repoUpdateData.putts17 = p[16] ?? null;
      repoUpdateData.putts18 = p[17] ?? null;
    }

    if (updateData.fairwaysHit !== undefined) {
      const fw = updateData.fairwaysHit;
      repoUpdateData.fairway1 = fw[0] ?? null;
      repoUpdateData.fairway2 = fw[1] ?? null;
      repoUpdateData.fairway3 = fw[2] ?? null;
      repoUpdateData.fairway4 = fw[3] ?? null;
      repoUpdateData.fairway5 = fw[4] ?? null;
      repoUpdateData.fairway6 = fw[5] ?? null;
      repoUpdateData.fairway7 = fw[6] ?? null;
      repoUpdateData.fairway8 = fw[7] ?? null;
      repoUpdateData.fairway9 = fw[8] ?? null;
      repoUpdateData.fairway10 = fw[9] ?? null;
      repoUpdateData.fairway11 = fw[10] ?? null;
      repoUpdateData.fairway12 = fw[11] ?? null;
      repoUpdateData.fairway13 = fw[12] ?? null;
      repoUpdateData.fairway14 = fw[13] ?? null;
      repoUpdateData.fairway15 = fw[14] ?? null;
      repoUpdateData.fairway16 = fw[15] ?? null;
      repoUpdateData.fairway17 = fw[16] ?? null;
      repoUpdateData.fairway18 = fw[17] ?? null;
    }

    if (holeScores !== undefined || updateData.putts !== undefined) {
      const effectiveCourseId = updateData.courseId
        ? BigInt(updateData.courseId)
        : existingScore.courseid;
      const courseForGir = await this.golfCourseRepository.findByIdWithTees(effectiveCourseId);
      if (courseForGir) {
        const gender = normalizeGender(golfer.gender);
        const coursePars = getHolePars(courseForGir, gender);
        const effectiveHoleScores = holeScores ?? [
          existingScore.holescrore1,
          existingScore.holescrore2,
          existingScore.holescrore3,
          existingScore.holescrore4,
          existingScore.holescrore5,
          existingScore.holescrore6,
          existingScore.holescrore7,
          existingScore.holescrore8,
          existingScore.holescrore9,
          existingScore.holescrore10,
          existingScore.holescrore11,
          existingScore.holescrore12,
          existingScore.holescrore13,
          existingScore.holescrore14,
          existingScore.holescrore15,
          existingScore.holescrore16,
          existingScore.holescrore17,
          existingScore.holescrore18,
        ];
        const effectivePutts = updateData.putts;
        const computedGir = this.computeGirFromPutts(
          effectiveHoleScores,
          effectivePutts,
          coursePars,
        );
        repoUpdateData.gir1 = computedGir['gir1'];
        repoUpdateData.gir2 = computedGir['gir2'];
        repoUpdateData.gir3 = computedGir['gir3'];
        repoUpdateData.gir4 = computedGir['gir4'];
        repoUpdateData.gir5 = computedGir['gir5'];
        repoUpdateData.gir6 = computedGir['gir6'];
        repoUpdateData.gir7 = computedGir['gir7'];
        repoUpdateData.gir8 = computedGir['gir8'];
        repoUpdateData.gir9 = computedGir['gir9'];
        repoUpdateData.gir10 = computedGir['gir10'];
        repoUpdateData.gir11 = computedGir['gir11'];
        repoUpdateData.gir12 = computedGir['gir12'];
        repoUpdateData.gir13 = computedGir['gir13'];
        repoUpdateData.gir14 = computedGir['gir14'];
        repoUpdateData.gir15 = computedGir['gir15'];
        repoUpdateData.gir16 = computedGir['gir16'];
        repoUpdateData.gir17 = computedGir['gir17'];
        repoUpdateData.gir18 = computedGir['gir18'];
      }
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

    const scores = await this.golfScoreRepository.findAllByGolferId(golfer.id, RECENT_SCORES_LIMIT);
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

  private computeGirFromPutts(
    holeScores: number[],
    putts: (number | null)[] | undefined,
    coursePars: number[],
  ): Record<string, boolean | null> {
    const result: Record<string, boolean | null> = {};
    for (let i = 0; i < 18; i++) {
      const score = holeScores[i];
      const putt = putts?.[i];
      const par = coursePars[i];
      if (putt === null || putt === undefined || !score || !par) {
        result[`gir${i + 1}`] = null;
      } else {
        result[`gir${i + 1}`] = score - putt <= par - 2;
      }
    }
    return result;
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
