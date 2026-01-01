import { golfteeinformation } from '#prisma/client';
import { GolfCourseTeeType, GolfCourseTeeSlimType } from '@draco/shared-schemas';

export class GolfTeeResponseFormatter {
  static format(tee: golfteeinformation): GolfCourseTeeType {
    return {
      id: tee.id.toString(),
      courseId: tee.courseid.toString(),
      teeColor: tee.teecolor,
      teeName: tee.teename,
      priority: tee.priority,
      mensRating: tee.mensrating,
      mensSlope: tee.menslope,
      womansRating: tee.womansrating,
      womansSlope: tee.womanslope,
      mensRatingFront9: tee.mensratingfront9,
      mensSlopeFront9: tee.menslopefront9,
      womansRatingFront9: tee.womansratingfront9,
      womansSlopeFront9: tee.womanslopefront9,
      mensRatingBack9: tee.mensratingback9,
      mensSlopeBack9: tee.menslopeback9,
      womansRatingBack9: tee.womansratingback9,
      womansSlopeBack9: tee.womanslopeback9,
      distances: [
        tee.distancehole1,
        tee.distancehole2,
        tee.distancehole3,
        tee.distancehole4,
        tee.distancehole5,
        tee.distancehole6,
        tee.distancehole7,
        tee.distancehole8,
        tee.distancehole9,
        tee.distancehole10,
        tee.distancehole11,
        tee.distancehole12,
        tee.distancehole13,
        tee.distancehole14,
        tee.distancehole15,
        tee.distancehole16,
        tee.distancehole17,
        tee.distancehole18,
      ],
    };
  }

  static formatMany(tees: golfteeinformation[]): GolfCourseTeeType[] {
    return tees.map((tee) => this.format(tee));
  }

  static formatSlim(tee: golfteeinformation): GolfCourseTeeSlimType {
    return {
      id: tee.id.toString(),
      teeName: tee.teename,
      teeColor: tee.teecolor,
    };
  }
}
