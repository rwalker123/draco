import { ValidationError } from '../../utils/customErrors.js';
import {
  BattingStatValues,
  PitchingStatValues,
} from '../../repositories/interfaces/IStatsEntryRepository.js';

export type PitchingInputValues = Omit<PitchingStatValues, 'ip' | 'ip2'> & {
  ipDecimal: number;
};

const roundTo = (value: number, decimals = 3): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const clampSingles = (values: BattingStatValues) =>
  Math.max(0, values.h - (values.d + values.t + values.hr));

export const calculateBattingDerived = (values: BattingStatValues) => {
  const singles = clampSingles(values);
  const totalBases = singles + values.d * 2 + values.t * 3 + values.hr * 4;
  const plateAppearances = values.ab + values.bb + values.hbp + values.sf + values.sh + values.intr;
  const obDenominator = values.ab + values.bb + values.hbp + values.sf;
  const avg = values.ab === 0 ? 0 : roundTo(values.h / values.ab, 3);
  const obp =
    obDenominator === 0 ? 0 : roundTo((values.h + values.bb + values.hbp) / obDenominator, 3);
  const slg = values.ab === 0 ? 0 : roundTo(totalBases / values.ab, 3);

  return {
    tb: totalBases,
    pa: plateAppearances,
    avg,
    obp,
    slg,
    ops: roundTo(obp + slg, 3),
  };
};

export const validateBattingValues = (values: BattingStatValues): void => {
  if (values.ab < values.h + values.so + values.re) {
    throw new ValidationError(
      'At-bats must be greater than or equal to hits + strikeouts + reached on error.',
    );
  }

  if (values.h < values.d + values.t + values.hr) {
    throw new ValidationError(
      'Hits must be greater than or equal to doubles + triples + home runs.',
    );
  }
};

const splitInnings = (ipDecimal: number): { ip: number; ip2: number } => {
  if (!Number.isFinite(ipDecimal) || ipDecimal < 0) {
    throw new ValidationError('Innings pitched must be a positive number.');
  }

  const wholeInnings = Math.floor(ipDecimal);
  const decimalPart = roundTo(ipDecimal - wholeInnings, 3);
  const outs = Math.round(decimalPart * 10);

  if (![0, 1, 2].includes(outs)) {
    throw new ValidationError('Innings pitched decimals must be .0, .1, or .2.');
  }

  return {
    ip: wholeInnings,
    ip2: outs,
  };
};

export const convertPitchingInput = (input: PitchingInputValues): PitchingStatValues => {
  const { ip, ip2 } = splitInnings(input.ipDecimal);

  return {
    ip,
    ip2,
    bf: input.bf,
    w: input.w,
    l: input.l,
    s: input.s,
    h: input.h,
    r: input.r,
    er: input.er,
    d: input.d,
    t: input.t,
    hr: input.hr,
    so: input.so,
    bb: input.bb,
    wp: input.wp,
    hbp: input.hbp,
    bk: input.bk,
    sc: input.sc,
  };
};

const calculatePitchingAtBats = (values: PitchingStatValues) =>
  Math.max(0, values.bf - values.bb - values.hbp - values.sc);

const calculatePitchingTotalBases = (values: PitchingStatValues) => {
  const singles = Math.max(0, values.h - (values.d + values.t + values.hr));
  return singles + values.d * 2 + values.t * 3 + values.hr * 4;
};

export const calculatePitchingDerived = (values: PitchingStatValues) => {
  const totalOuts = values.ip * 3 + values.ip2;
  const inningsForRates = totalOuts / 3;
  const ipDecimal = roundTo(values.ip + values.ip2 / 10, 1);
  const ab = calculatePitchingAtBats(values);
  const totalBases = calculatePitchingTotalBases(values);

  const era = inningsForRates === 0 ? 0 : roundTo((values.er * 9) / inningsForRates, 2);
  const whip = inningsForRates === 0 ? 0 : roundTo((values.h + values.bb) / inningsForRates, 2);
  const k9 = inningsForRates === 0 ? 0 : roundTo((values.so * 9) / inningsForRates, 2);
  const bb9 = inningsForRates === 0 ? 0 : roundTo((values.bb * 9) / inningsForRates, 2);
  const oba = ab === 0 ? 0 : roundTo(values.h / ab, 3);
  const slg = ab === 0 ? 0 : roundTo(totalBases / ab, 3);

  return {
    ipDecimal,
    era,
    whip,
    k9,
    bb9,
    oba,
    slg,
    ab,
    totalBases,
    totalOuts,
  };
};

export const validatePitchingInput = (input: PitchingInputValues): void => {
  splitInnings(input.ipDecimal);

  (['w', 'l', 's'] as const).forEach((field) => {
    const value = input[field];
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError(`${field.toUpperCase()} must be a non-negative whole number.`);
    }

    if (!Number.isInteger(value)) {
      throw new ValidationError(`${field.toUpperCase()} must be a whole number.`);
    }

    if (value > 1) {
      throw new ValidationError(`${field.toUpperCase()} must be 0 or 1.`);
    }
  });

  if (input.w > 0 && input.s > 0) {
    throw new ValidationError('A pitcher cannot be credited with both a win and a save.');
  }

  if (input.bf < input.h + input.bb + input.hbp + input.so) {
    throw new ValidationError(
      'Batters faced must be greater than or equal to hits + walks + hit by pitch + strikeouts.',
    );
  }

  if (input.er > input.r) {
    throw new ValidationError('Earned runs must be less than or equal to total runs.');
  }

  if (input.h < input.d + input.t + input.hr) {
    throw new ValidationError(
      'Hits allowed must be greater than or equal to doubles + triples + home runs.',
    );
  }
};
