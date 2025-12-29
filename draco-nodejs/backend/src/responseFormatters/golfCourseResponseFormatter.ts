import { golfcourse } from '#prisma/client';
import {
  GolfCourseType,
  GolfCourseWithTeesType,
  GolfLeagueCourseType,
  GolfCourseSlimType,
} from '@draco/shared-schemas';
import {
  GolfCourseWithTees,
  GolfLeagueCourseRaw,
} from '../repositories/interfaces/IGolfCourseRepository.js';
import { GolfTeeResponseFormatter } from './golfTeeResponseFormatter.js';

export class GolfCourseResponseFormatter {
  private static normalize(value?: string | null): string | null | undefined {
    if (value === undefined || value === null) {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static buildParArray(course: golfcourse, prefix: 'menspar' | 'womanspar'): number[] {
    return [
      course[`${prefix}1`],
      course[`${prefix}2`],
      course[`${prefix}3`],
      course[`${prefix}4`],
      course[`${prefix}5`],
      course[`${prefix}6`],
      course[`${prefix}7`],
      course[`${prefix}8`],
      course[`${prefix}9`],
      course[`${prefix}10`],
      course[`${prefix}11`],
      course[`${prefix}12`],
      course[`${prefix}13`],
      course[`${prefix}14`],
      course[`${prefix}15`],
      course[`${prefix}16`],
      course[`${prefix}17`],
      course[`${prefix}18`],
    ];
  }

  private static buildHandicapArray(
    course: golfcourse,
    prefix: 'menshandicap' | 'womanshandicap',
  ): number[] {
    return [
      course[`${prefix}1`],
      course[`${prefix}2`],
      course[`${prefix}3`],
      course[`${prefix}4`],
      course[`${prefix}5`],
      course[`${prefix}6`],
      course[`${prefix}7`],
      course[`${prefix}8`],
      course[`${prefix}9`],
      course[`${prefix}10`],
      course[`${prefix}11`],
      course[`${prefix}12`],
      course[`${prefix}13`],
      course[`${prefix}14`],
      course[`${prefix}15`],
      course[`${prefix}16`],
      course[`${prefix}17`],
      course[`${prefix}18`],
    ];
  }

  static format(course: golfcourse): GolfCourseType {
    return {
      id: course.id.toString(),
      externalId: course.externalid ?? null,
      name: course.name,
      designer: this.normalize(course.designer),
      yearBuilt: course.yearbuilt,
      numberOfHoles: course.numberofholes,
      address: this.normalize(course.address),
      city: this.normalize(course.city),
      state: this.normalize(course.state),
      zip: this.normalize(course.zip),
      country: this.normalize(course.country),
      mensPar: this.buildParArray(course, 'menspar'),
      womansPar: this.buildParArray(course, 'womanspar'),
      mensHandicap: this.buildHandicapArray(course, 'menshandicap'),
      womansHandicap: this.buildHandicapArray(course, 'womanshandicap'),
    };
  }

  static formatMany(courses: golfcourse[]): GolfCourseType[] {
    return courses.map((course) => this.format(course));
  }

  static formatWithTees(course: GolfCourseWithTees): GolfCourseWithTeesType {
    return {
      ...this.format(course),
      tees: GolfTeeResponseFormatter.formatMany(course.golfteeinformation),
    };
  }

  static formatManyWithTees(courses: GolfCourseWithTees[]): GolfCourseWithTeesType[] {
    return courses.map((course) => this.formatWithTees(course));
  }

  static formatLeagueCourse(leagueCourse: GolfLeagueCourseRaw): GolfLeagueCourseType {
    return {
      accountId: leagueCourse.accountid.toString(),
      course: this.format(leagueCourse.golfcourse),
      defaultMensTeeId: leagueCourse.defaultmenstee?.toString() ?? null,
      defaultWomansTeeId: leagueCourse.defaultwomanstee?.toString() ?? null,
    };
  }

  static formatLeagueCourses(leagueCourses: GolfLeagueCourseRaw[]): GolfLeagueCourseType[] {
    return leagueCourses.map((lc) => this.formatLeagueCourse(lc));
  }

  static formatSlim(course: golfcourse): GolfCourseSlimType {
    return {
      id: course.id.toString(),
      name: course.name,
      address: this.normalize(course.address),
      city: this.normalize(course.city),
      state: this.normalize(course.state),
    };
  }
}
