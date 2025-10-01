import { z } from 'zod';
import { coerceToDate, formatDateToUtcString } from './date.js';

export const bigintToStringSchema = z.bigint().transform((value) => value.toString());
export const nameSchema = z.string().trim().min(1).max(100);

export const birthDateStringSchema = z
  .string()
  .trim()
  .refine(
    (value: string) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Birth date must be empty or formatted as YYYY-MM-DD',
  );

export const birthDateSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null) {
      return '';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }

      const coerced = coerceToDate(trimmed);
      return coerced ? formatDateToUtcString(coerced) : trimmed;
    }

    const coerced = coerceToDate(value);
    return coerced ? formatDateToUtcString(coerced) : value;
  }, z.string())
  .pipe(birthDateStringSchema);

export const trimToUndefined = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value).trim();

  return stringValue.length === 0 ? undefined : stringValue;
};
