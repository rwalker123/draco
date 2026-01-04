import { GolferType } from '@draco/shared-schemas';
import { GolferWithHomeCourse } from '../repositories/interfaces/IGolferRepository.js';
import { GolfCourseResponseFormatter } from './golfCourseResponseFormatter.js';

export class GolferResponseFormatter {
  static format(golfer: GolferWithHomeCourse): GolferType {
    return {
      id: golfer.id.toString(),
      contactId: golfer.contactid.toString(),
      initialDifferential: golfer.initialdifferential ?? null,
      homeCourse: golfer.homecourse
        ? GolfCourseResponseFormatter.formatSlim(golfer.homecourse)
        : null,
    };
  }
}
