import type { Mocked } from 'vitest';

export const partialMock = <T>(partial: Partial<Mocked<T>>): Mocked<T> => partial as Mocked<T>;
