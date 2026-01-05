import { GolferType } from '@draco/shared-schemas';
import { GolferWithHomeCourse } from '../repositories/interfaces/IGolferRepository.js';
import { GolfCourseResponseFormatter } from './golfCourseResponseFormatter.js';
import { normalizeGender } from '../utils/whsCalculator.js';

export interface GolferStats {
  handicapIndex: number | null;
  lowHandicapIndex: number | null;
  averageScore: number | null;
  roundsPlayed: number;
}

export class GolferResponseFormatter {
  static format(golfer: GolferWithHomeCourse, stats?: GolferStats): GolferType {
    return {
      id: golfer.id.toString(),
      contactId: golfer.contactid.toString(),
      gender: normalizeGender(golfer.gender),
      initialDifferential: golfer.initialdifferential ?? null,
      homeCourse: golfer.homecourse
        ? GolfCourseResponseFormatter.formatSlim(golfer.homecourse)
        : null,
      handicapIndex: stats?.handicapIndex ?? null,
      lowHandicapIndex: stats?.lowHandicapIndex ?? golfer.lowhandicapindex ?? null,
      averageScore: stats?.averageScore ?? null,
      roundsPlayed: stats?.roundsPlayed ?? 0,
    };
  }
}
