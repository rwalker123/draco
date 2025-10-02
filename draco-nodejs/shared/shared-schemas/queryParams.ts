import { z } from 'zod';

const truthyValues = new Set(['true', '1', 'yes', 'y', 'on']);
const falsyValues = new Set(['false', '0', 'no', 'n', 'off']);

/**
 * Coerces common query parameter representations into booleans.
 * Accepts boolean literals, numeric flags, and string equivalents ("true", "false", etc.).
 */
export const booleanQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (truthyValues.has(normalized)) {
      return true;
    }

    if (falsyValues.has(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const coerceQueryNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return value;
  }, schema);

export const numberQueryParam = (opts?: { min?: number; max?: number }) => {
  let schema = z.number();
  if (opts?.min !== undefined) schema = schema.min(opts.min);
  if (opts?.max !== undefined) schema = schema.max(opts.max);
  return coerceQueryNumber(schema);
};
