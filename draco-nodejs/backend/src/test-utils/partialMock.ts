import type { Mocked } from 'vitest';
import type { PrismaClient } from '#prisma/client';

export const partialMock = <T>(partial: Partial<Mocked<T>>): Mocked<T> => partial as Mocked<T>;

export const partialPrismaMock = (input: unknown): PrismaClient => input as PrismaClient;
