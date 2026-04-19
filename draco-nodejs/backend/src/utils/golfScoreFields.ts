import { golfscore } from '#prisma/client';

const HOLE_COUNT = 18;

type HoleFieldPrefix = 'holescrore' | 'putts' | 'fairway' | 'gir';

export function extractHoleFields<T>(score: golfscore, prefix: HoleFieldPrefix): T[] {
  return Array.from(
    { length: HOLE_COUNT },
    (_, i) => score[`${prefix}${i + 1}` as keyof golfscore] as T,
  );
}

export const extractHoleScores = (score: golfscore): number[] =>
  extractHoleFields<number>(score, 'holescrore');

export const extractPutts = (score: golfscore): (number | null)[] =>
  extractHoleFields<number | null>(score, 'putts');

export const extractFairways = (score: golfscore): (boolean | null)[] =>
  extractHoleFields<boolean | null>(score, 'fairway');

export const extractGirs = (score: golfscore): (boolean | null)[] =>
  extractHoleFields<boolean | null>(score, 'gir');
