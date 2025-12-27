import { Prisma, golfteeinformation } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IGolfTeeRepository extends IBaseRepository<
  golfteeinformation,
  Prisma.golfteeinformationCreateInput,
  Prisma.golfteeinformationUpdateInput
> {
  findByCourseId(courseId: bigint): Promise<golfteeinformation[]>;
  findByColor(courseId: bigint, teeColor: string): Promise<golfteeinformation | null>;
  findByColorExcludingId(
    courseId: bigint,
    teeColor: string,
    excludeTeeId: bigint,
  ): Promise<golfteeinformation | null>;
  isTeeInUse(teeId: bigint): Promise<boolean>;
  updatePriorities(
    courseId: bigint,
    teePriorities: { id: bigint; priority: number }[],
  ): Promise<void>;
}
