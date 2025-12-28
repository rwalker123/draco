import { describe, it, expect, beforeEach } from 'vitest';
import { GolfTeeService } from '../golfTeeService.js';
import { type IGolfTeeRepository, type IGolfCourseRepository } from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import type { golfcourse, golfteeinformation } from '#prisma/client';

function createMockTee(overrides: Partial<golfteeinformation> = {}): golfteeinformation {
  const defaultDistances: Record<string, number> = {};
  for (let i = 1; i <= 18; i++) {
    defaultDistances[`distancehole${i}`] = 350 + i * 10;
  }

  return {
    id: 1n,
    courseid: 1n,
    teecolor: 'Blue',
    teename: 'Blue Tees',
    priority: 0,
    mensrating: 72.5,
    menslope: 130,
    womansrating: 74.0,
    womanslope: 135,
    mensratingfront9: 36.0,
    menslopefront9: 128,
    womansratingfront9: 37.0,
    womanslopefront9: 133,
    mensratingback9: 36.5,
    menslopeback9: 132,
    womansratingback9: 37.0,
    womanslopeback9: 137,
    ...defaultDistances,
    ...overrides,
  } as golfteeinformation;
}

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

describe('GolfTeeService', () => {
  let tees: golfteeinformation[];
  let courses: golfcourse[];
  let nextTeeId: bigint;
  let teeRepository: IGolfTeeRepository;
  let courseRepository: IGolfCourseRepository;
  let service: GolfTeeService;

  beforeEach(() => {
    nextTeeId = 3n;
    courses = [createMockCourse({ id: 1n })];
    tees = [
      createMockTee({ id: 1n, courseid: 1n, teecolor: 'Blue', teename: 'Blue Tees', priority: 0 }),
      createMockTee({
        id: 2n,
        courseid: 1n,
        teecolor: 'White',
        teename: 'White Tees',
        priority: 1,
      }),
    ];

    teeRepository = {
      async findById(id: bigint): Promise<golfteeinformation | null> {
        return tees.find((t) => t.id === id) ?? null;
      },
      async findMany(): Promise<golfteeinformation[]> {
        return [...tees];
      },
      async findByCourseId(courseId: bigint): Promise<golfteeinformation[]> {
        return tees.filter((t) => t.courseid === courseId).sort((a, b) => a.priority - b.priority);
      },
      async findByColor(courseId: bigint, teeColor: string): Promise<golfteeinformation | null> {
        return tees.find((t) => t.courseid === courseId && t.teecolor === teeColor) ?? null;
      },
      async findByColorExcludingId(
        courseId: bigint,
        teeColor: string,
        excludeTeeId: bigint,
      ): Promise<golfteeinformation | null> {
        return (
          tees.find(
            (t) => t.courseid === courseId && t.teecolor === teeColor && t.id !== excludeTeeId,
          ) ?? null
        );
      },
      async create(data): Promise<golfteeinformation> {
        const created = createMockTee({ id: nextTeeId, ...data });
        nextTeeId += 1n;
        tees.push(created);
        return created;
      },
      async update(id: bigint, data): Promise<golfteeinformation> {
        const index = tees.findIndex((t) => t.id === id);
        if (index === -1) {
          throw new NotFoundError('Tee not found');
        }
        const updated = { ...tees[index], ...data };
        tees[index] = updated;
        return updated;
      },
      async delete(id: bigint): Promise<golfteeinformation> {
        const index = tees.findIndex((t) => t.id === id);
        if (index === -1) {
          throw new NotFoundError('Tee not found');
        }
        const deleted = tees[index];
        tees.splice(index, 1);
        return deleted;
      },
      async count(): Promise<number> {
        return tees.length;
      },
      async isTeeInUse(): Promise<boolean> {
        return false;
      },
      async updatePriorities(
        courseId: bigint,
        teePriorities: { id: bigint; priority: number }[],
      ): Promise<void> {
        for (const tp of teePriorities) {
          const tee = tees.find((t) => t.id === tp.id && t.courseid === courseId);
          if (tee) {
            tee.priority = tp.priority;
          }
        }
      },
    };

    courseRepository = {
      async findById(id: bigint): Promise<golfcourse | null> {
        return courses.find((c) => c.id === id) ?? null;
      },
      async findByIdWithTees() {
        return null;
      },
      async findMany() {
        return [];
      },
      async findLeagueCourses() {
        return [];
      },
      async addLeagueCourse() {},
      async removeLeagueCourse() {},
      async updateLeagueCourseDefaults() {},
      async create(data) {
        return createMockCourse(data);
      },
      async update(id, data) {
        return createMockCourse({ id, ...data });
      },
      async delete(id) {
        return createMockCourse({ id });
      },
      async count() {
        return 0;
      },
      async findByName() {
        return null;
      },
      async findByNameExcludingId() {
        return null;
      },
      async findByExternalId() {
        return null;
      },
      async isCourseInUse() {
        return false;
      },
    };

    service = new GolfTeeService(teeRepository, courseRepository);
  });

  describe('getTeeById', () => {
    it('returns formatted tee when found', async () => {
      const result = await service.getTeeById(1n);

      expect(result.id).toBe('1');
      expect(result.teeColor).toBe('Blue');
      expect(result.teeName).toBe('Blue Tees');
      expect(result.mensRating).toBe(72.5);
      expect(result.distances).toHaveLength(18);
    });

    it('throws NotFoundError when tee missing', async () => {
      await expect(service.getTeeById(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getTeesByCourse', () => {
    it('returns tees sorted by priority', async () => {
      const result = await service.getTeesByCourse(1n);

      expect(result).toHaveLength(2);
      expect(result[0].teeColor).toBe('Blue');
      expect(result[1].teeColor).toBe('White');
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(service.getTeesByCourse(999n)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('createTee', () => {
    it('creates tee with valid data', async () => {
      const newTee = await service.createTee(1n, {
        teeColor: 'Red',
        teeName: 'Red Tees',
        priority: 2,
        mensRating: 70.0,
        mensSlope: 125,
        womansRating: 72.0,
        womansSlope: 130,
        distances: Array(18).fill(300),
      });

      expect(newTee.id).toBe('3');
      expect(newTee.teeColor).toBe('Red');
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(
        service.createTee(999n, {
          teeColor: 'Red',
          teeName: 'Red Tees',
          priority: 0,
          mensRating: 70.0,
          mensSlope: 125,
          womansRating: 72.0,
          womansSlope: 130,
          distances: Array(18).fill(300),
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError for duplicate tee color', async () => {
      await expect(
        service.createTee(1n, {
          teeColor: 'Blue',
          teeName: 'Another Blue',
          priority: 0,
          mensRating: 70.0,
          mensSlope: 125,
          womansRating: 72.0,
          womansSlope: 130,
          distances: Array(18).fill(300),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updateTee', () => {
    it('updates tee color', async () => {
      const updated = await service.updateTee(1n, { teeColor: 'Gold' });

      expect(updated.teeColor).toBe('Gold');
    });

    it('throws NotFoundError when tee missing', async () => {
      await expect(service.updateTee(999n, { teeColor: 'Gold' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ValidationError for duplicate color on update', async () => {
      await expect(service.updateTee(1n, { teeColor: 'White' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe('deleteTee', () => {
    it('deletes tee when not in use', async () => {
      await service.deleteTee(1n);

      expect(tees).toHaveLength(1);
      expect(tees[0].id).toBe(2n);
    });

    it('throws NotFoundError when tee missing', async () => {
      await expect(service.deleteTee(999n)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when tee is in use', async () => {
      teeRepository.isTeeInUse = async () => true;

      await expect(service.deleteTee(1n)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updateTeePriorities', () => {
    it('updates priorities for tees', async () => {
      await service.updateTeePriorities(1n, [
        { id: '1', priority: 1 },
        { id: '2', priority: 0 },
      ]);

      const blue = tees.find((t) => t.id === 1n);
      const white = tees.find((t) => t.id === 2n);
      expect(blue?.priority).toBe(1);
      expect(white?.priority).toBe(0);
    });

    it('throws NotFoundError when course missing', async () => {
      await expect(
        service.updateTeePriorities(999n, [{ id: '1', priority: 0 }]),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when tee does not belong to course', async () => {
      await expect(
        service.updateTeePriorities(1n, [{ id: '999', priority: 0 }]),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
