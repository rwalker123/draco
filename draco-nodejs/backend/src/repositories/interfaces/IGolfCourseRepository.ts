import { golfcourse, golfteeinformation } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export type GolfCourseWithTees = golfcourse & {
  golfteeinformation: golfteeinformation[];
};

export type GolfLeagueCourseRaw = {
  accountid: bigint;
  courseid: bigint;
  defaultmenstee: bigint | null;
  defaultwomanstee: bigint | null;
  golfcourse: GolfCourseWithTees;
};

export interface IGolfCourseRepository extends IBaseRepository<
  golfcourse,
  Partial<golfcourse>,
  Partial<golfcourse>
> {
  findByIdWithTees(courseId: bigint): Promise<GolfCourseWithTees | null>;
  findLeagueCourses(accountId: bigint): Promise<GolfLeagueCourseRaw[]>;
  addLeagueCourse(
    accountId: bigint,
    courseId: bigint,
    defaultMensTeeId?: bigint | null,
    defaultWomansTeeId?: bigint | null,
  ): Promise<void>;
  removeLeagueCourse(accountId: bigint, courseId: bigint): Promise<void>;
  updateLeagueCourseDefaults(
    accountId: bigint,
    courseId: bigint,
    defaultMensTeeId?: bigint | null,
    defaultWomansTeeId?: bigint | null,
  ): Promise<void>;
  findByName(name: string): Promise<golfcourse | null>;
  findByNameExcludingId(name: string, excludeCourseId: bigint): Promise<golfcourse | null>;

  findByExternalId(externalId: string): Promise<golfcourse | null>;
  isCourseInUse(courseId: bigint): Promise<boolean>;
}
