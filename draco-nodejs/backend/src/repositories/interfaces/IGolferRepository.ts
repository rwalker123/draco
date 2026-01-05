import { golfer, golfcourse } from '#prisma/client';

export type GolferWithHomeCourse = golfer & {
  homecourse: golfcourse | null;
};

export interface IGolferRepository {
  findById(golferId: bigint): Promise<GolferWithHomeCourse | null>;
  findByContactId(contactId: bigint): Promise<GolferWithHomeCourse | null>;
  create(contactId: bigint, homeCourseId?: bigint): Promise<GolferWithHomeCourse>;
  updateHomeCourse(golferId: bigint, homeCourseId: bigint | null): Promise<GolferWithHomeCourse>;
  updateLowHandicapIndex(golferId: bigint, lowHandicapIndex: number): Promise<GolferWithHomeCourse>;
}
