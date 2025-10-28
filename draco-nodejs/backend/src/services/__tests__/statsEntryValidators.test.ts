import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../utils/customErrors.js';
import {
  calculateBattingDerived,
  calculatePitchingDerived,
  convertPitchingInput,
  validateBattingValues,
  validatePitchingInput,
} from '../utils/statsEntryValidators.js';

describe('statsEntryValidators', () => {
  describe('calculateBattingDerived', () => {
    it('computes advanced batting metrics', () => {
      const derived = calculateBattingDerived({
        ab: 12,
        h: 5,
        r: 3,
        d: 2,
        t: 1,
        hr: 0,
        rbi: 4,
        so: 2,
        bb: 3,
        hbp: 1,
        sb: 2,
        cs: 0,
        sf: 0,
        sh: 0,
        re: 0,
        intr: 0,
        lob: 3,
      });

      expect(derived.tb).toBe(9);
      expect(derived.pa).toBe(16);
      expect(derived.avg).toBeCloseTo(0.417, 3);
      expect(derived.obp).toBeCloseTo(0.563, 3);
      expect(derived.slg).toBeCloseTo(0.75, 3);
      expect(derived.ops).toBeCloseTo(1.313, 3);
    });
  });

  describe('validateBattingValues', () => {
    it('throws when hits exceed allowed maximum', () => {
      expect(() =>
        validateBattingValues({
          ab: 4,
          h: 2,
          r: 0,
          d: 1,
          t: 1,
          hr: 1,
          rbi: 0,
          so: 0,
          bb: 0,
          hbp: 0,
          sb: 0,
          cs: 0,
          sf: 0,
          sh: 0,
          re: 0,
          intr: 0,
          lob: 0,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('convertPitchingInput', () => {
    it('splits innings decimal into components', () => {
      const converted = convertPitchingInput({
        ipDecimal: 6.2,
        bf: 28,
        w: 1,
        l: 0,
        s: 0,
        h: 5,
        r: 2,
        er: 2,
        d: 1,
        t: 0,
        hr: 0,
        so: 7,
        bb: 2,
        wp: 0,
        hbp: 0,
        bk: 0,
        sc: 0,
      });

      expect(converted.ip).toBe(6);
      expect(converted.ip2).toBe(2);
    });
  });

  describe('validatePitchingInput', () => {
    it('throws when innings decimal is invalid', () => {
      expect(() =>
        validatePitchingInput({
          ipDecimal: 4.3,
          bf: 20,
          w: 0,
          l: 0,
          s: 0,
          h: 4,
          r: 1,
          er: 1,
          d: 0,
          t: 0,
          hr: 0,
          so: 5,
          bb: 1,
          wp: 0,
          hbp: 0,
          bk: 0,
          sc: 0,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('calculatePitchingDerived', () => {
    it('computes pitching advanced metrics', () => {
      const derived = calculatePitchingDerived({
        ip: 7,
        ip2: 1,
        bf: 30,
        w: 1,
        l: 0,
        s: 0,
        h: 6,
        r: 2,
        er: 2,
        d: 1,
        t: 0,
        hr: 0,
        so: 8,
        bb: 2,
        wp: 0,
        hbp: 0,
        bk: 0,
        sc: 0,
      });

      expect(derived.ipDecimal).toBeCloseTo(7.1, 1);
      expect(derived.era).toBeCloseTo(2.45, 2);
      expect(derived.whip).toBeCloseTo(1.09, 2);
      expect(derived.k9).toBeCloseTo(9.82, 2);
      expect(derived.bb9).toBeCloseTo(2.45, 2);
      expect(derived.oba).toBeCloseTo(0.214, 3);
      expect(derived.slg).toBeCloseTo(0.25, 3);
    });
  });
});
