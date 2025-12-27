import { describe, it, expect, beforeEach } from 'vitest';
import { GolfCourseService } from '../golfCourseService.js';
import {
  type IGolfCourseRepository,
  type GolfCourseWithTees,
  type GolfLeagueCourseRaw,
} from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { golfcourse } from '#prisma/client';

function createMockCourse(overrides: Partial<golfcourse> = {}): golfcourse {
  const defaultPars: Record<string, number> = {};
  const defaultHandicaps: Record<string, number> = {};
  for (let i = 1; i <= 18; i++) {
    defaultPars[`menspar${i}`] = 4;
    defaultPars[`womanspar${i}`] = 4;
    defaultHandicaps[`menshandicap${i}`] = i;
    defaultHandicaps[`womanshandicap${i}`] = i;
  }

  return {
    id: 1n,
    name: 'Test Golf Course',
    designer: 'Test Designer',
    yearbuilt: 2000,
    numberofholes: 18,
    address: '123 Golf Lane',
    city: 'Golf City',
    state: 'GC',
    zip: '12345',
    country: 'USA',
    ...defaultPars,
    ...defaultHandicaps,
    ...overrides,
  } as golfcourse;
}

describe('GolfCourseService', () => {
  let courses: golfcourse[];
  let leagueCourses: GolfLeagueCourseRaw[];
  let nextId: bigint;
  let repository: IGolfCourseRepository;
  let service: GolfCourseService;

  beforeEach(() => {
    nextId = 3n;
    courses = [
      createMockCourse({ id: 1n, name: 'Course One' }),
      createMockCourse({ id: 2n, name: 'Course Two' }),
    ];

    leagueCourses = [
      {
        accountid: 100n,
        courseid: 1n,
        defaultmenstee: null,
        defaultwomanstee: null,
        golfcourse: { ...courses[0], golfteeinformation: [] },
      },
    ];

    repository = {
      async findById(id: bigint): Promise<golfcourse | null> {
        return courses.find((c) => c.id === id) ?? null;
      },
      async findByIdWithTees(courseId: bigint): Promise<GolfCourseWithTees | null> {
        const course = courses.find((c) => c.id === courseId);
        return course ? { ...course, golfteeinformation: [] } : null;
      },
      async findMany(): Promise<golfcourse[]> {
        return [...courses];
      },
      async findLeagueCourses(accountId: bigint): Promise<GolfLeagueCourseRaw[]> {
        return leagueCourses.filter((lc) => lc.accountid === accountId);
      },
      async addLeagueCourse(
        accountId: bigint,
        courseId: bigint,
        defaultMensTeeId?: bigint | null,
        defaultWomansTeeId?: bigint | null,
      ): Promise<void> {
        const course = courses.find((c) => c.id === courseId);
        if (course) {
          leagueCourses.push({
            accountid: accountId,
            courseid: courseId,
            defaultmenstee: defaultMensTeeId ?? null,
            defaultwomanstee: defaultWomansTeeId ?? null,
            golfcourse: { ...course, golfteeinformation: [] },
          });
        }
      },
      async removeLeagueCourse(accountId: bigint, courseId: bigint): Promise<void> {
        const index = leagueCourses.findIndex(
          (lc) => lc.accountid === accountId && lc.courseid === courseId,
        );
        if (index !== -1) {
          leagueCourses.splice(index, 1);
        }
      },
      async updateLeagueCourseDefaults(): Promise<void> {},
      async create(data): Promise<golfcourse> {
        const created = createMockCourse({ id: nextId, ...data });
        nextId += 1n;
        courses.push(created);
        return created;
      },
      async update(id: bigint, data): Promise<golfcourse> {
        const index = courses.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new NotFoundError('Course not found');
        }
        const updated = { ...courses[index], ...data };
        courses[index] = updated;
        return updated;
      },
      async delete(id: bigint): Promise<golfcourse> {
        const index = courses.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new NotFoundError('Course not found');
        }
        const deleted = courses[index];
        courses.splice(index, 1);
        return deleted;
      },
      async count(): Promise<number> {
        return courses.length;
      },
      async findByName(name: string): Promise<golfcourse | null> {
        return courses.find((c) => c.name === name) ?? null;
      },
      async findByNameExcludingId(
        name: string,
        excludeCourseId: bigint,
      ): Promise<golfcourse | null> {
        return courses.find((c) => c.name === name && c.id !== excludeCourseId) ?? null;
      },
      async isCourseInUse(): Promise<boolean> {
        return false;
      },
    };

    service = new GolfCourseService(repository);
  });

  describe('getCourseById', () => {
    it('returns formatted course when found', async () => {
      const result = await service.getCourseById(1n);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Course One');
      expect(result.mensPar).toHaveLength(18);
      expect(result.mensHandicap).toHaveLength(18);
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.getCourseById(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getCourseWithTees', () => {
    it('returns course with tees array', async () => {
      const result = await service.getCourseWithTees(1n);

      expect(result.id).toBe('1');
      expect(result.tees).toEqual([]);
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.getCourseWithTees(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getLeagueCourses', () => {
    it('returns formatted league courses for account', async () => {
      const result = await service.getLeagueCourses(100n);

      expect(result).toHaveLength(1);
      expect(result[0].accountId).toBe('100');
      expect(result[0].course.name).toBe('Course One');
    });

    it('returns empty array for account with no courses', async () => {
      const result = await service.getLeagueCourses(999n);

      expect(result).toHaveLength(0);
    });
  });

  describe('createCourse', () => {
    it('creates course with valid data', async () => {
      const newCourse = await service.createCourse({
        name: 'New Course',
        numberOfHoles: 18,
        mensPar: Array(18).fill(4),
        womansPar: Array(18).fill(4),
        mensHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
        womansHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
      });

      expect(newCourse.id).toBe('3');
      expect(newCourse.name).toBe('New Course');
    });

    it('trims course name', async () => {
      const newCourse = await service.createCourse({
        name: '  Trimmed Course  ',
        numberOfHoles: 18,
        mensPar: Array(18).fill(4),
        womansPar: Array(18).fill(4),
        mensHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
        womansHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
      });

      expect(newCourse.name).toBe('Trimmed Course');
    });

    it('throws ValidationError for duplicate name', async () => {
      await expect(
        service.createCourse({
          name: 'Course One',
          numberOfHoles: 18,
          mensPar: Array(18).fill(4),
          womansPar: Array(18).fill(4),
          mensHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
          womansHandicap: Array.from({ length: 18 }, (_, i) => i + 1),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updateCourse', () => {
    it('updates course name', async () => {
      const updated = await service.updateCourse(1n, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.updateCourse(999n, { name: 'Test' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ValidationError for duplicate name on update', async () => {
      await expect(service.updateCourse(1n, { name: 'Course Two' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe('deleteCourse', () => {
    it('deletes course when not in use', async () => {
      await service.deleteCourse(1n);

      expect(courses).toHaveLength(1);
      expect(courses[0].id).toBe(2n);
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.deleteCourse(999n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when course is in use', async () => {
      repository.isCourseInUse = async () => true;

      await expect(service.deleteCourse(1n)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('addLeagueCourse', () => {
    it('adds course to league', async () => {
      await service.addLeagueCourse(100n, { courseId: '2' });

      expect(leagueCourses).toHaveLength(2);
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.addLeagueCourse(100n, { courseId: '999' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ValidationError when course already in league', async () => {
      await expect(service.addLeagueCourse(100n, { courseId: '1' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe('removeLeagueCourse', () => {
    it('removes course from league', async () => {
      await service.removeLeagueCourse(100n, 1n);

      expect(leagueCourses).toHaveLength(0);
    });

    it('throws NotFoundError when course not in league', async () => {
      await expect(service.removeLeagueCourse(100n, 999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
