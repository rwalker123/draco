import { describe, it, expect } from 'vitest';
import { applyColumnOrder, mergeColumnOrder, reconcileOrder } from '../statColumnOrder';

describe('reconcileOrder', () => {
  const canonical = ['ab', 'h', 'r', 'pa', 'avg'];

  it('returns the full canonical order in canonical order when nothing is saved', () => {
    expect(reconcileOrder([], canonical)).toEqual(canonical);
  });

  it('keeps saved fields in saved order and appends missing canonical fields in canonical order', () => {
    expect(reconcileOrder(['pa', 'ab'], canonical)).toEqual(['pa', 'ab', 'h', 'r', 'avg']);
  });

  it('drops saved fields that no longer exist in canonical', () => {
    expect(reconcileOrder(['pa', 'legacy', 'ab'], canonical)).toEqual([
      'pa',
      'ab',
      'h',
      'r',
      'avg',
    ]);
  });
});

describe('applyColumnOrder', () => {
  it('returns the original order untouched when nothing is saved', () => {
    const original = ['ab', 'h', 'r', 'pa'];
    expect(applyColumnOrder(original, [])).toEqual(original);
  });

  it('reorders visible fields according to the saved order', () => {
    const original = ['ab', 'h', 'r', 'pa'];
    const saved = ['pa', 'ab', 'h', 'r'];
    expect(applyColumnOrder(original, saved)).toEqual(['pa', 'ab', 'h', 'r']);
  });

  it('only moves fields present in the saved order, leaving others in their original slot', () => {
    const original = ['ab', 'h', 'r', 'pa'];
    const saved = ['pa', 'ab'];
    expect(applyColumnOrder(original, saved)).toEqual(['pa', 'h', 'r', 'ab']);
  });

  it('ignores saved fields the table does not display', () => {
    const original = ['ab', 'h'];
    const saved = ['pa', 'h', 'ab'];
    expect(applyColumnOrder(original, saved)).toEqual(['h', 'ab']);
  });
});

describe('mergeColumnOrder', () => {
  it('writes a subset edit back into the full stored order, leaving hidden fields fixed', () => {
    const storedFull = ['ab', 'h', 'r', 'pa', 'avg'];
    const visibleFields = ['ab', 'h', 'r', 'pa'];
    const newVisibleOrder = ['pa', 'ab', 'h', 'r'];
    expect(mergeColumnOrder(storedFull, visibleFields, newVisibleOrder)).toEqual([
      'pa',
      'ab',
      'h',
      'r',
      'avg',
    ]);
  });

  it('round-trips: applying a merged order to the same subset reproduces the new visible order', () => {
    const storedFull = ['ab', 'h', 'r', 'd', 't', 'hr', 'pa', 'avg', 'obp'];
    const visibleFields = ['ab', 'h', 'r', 'pa'];
    const newVisibleOrder = ['pa', 'r', 'ab', 'h'];

    const merged = mergeColumnOrder(storedFull, visibleFields, newVisibleOrder);
    expect(applyColumnOrder(visibleFields, merged)).toEqual(newVisibleOrder);

    const hidden = storedFull.filter((field) => !visibleFields.includes(field));
    expect(merged.filter((field) => !visibleFields.includes(field))).toEqual(hidden);
  });

  it('propagates a subset edit to a different table that shows other columns', () => {
    const storedFull = ['ab', 'h', 'r', 'pa', 'avg', 'obp'];
    const editedVisible = ['ab', 'pa'];
    const merged = mergeColumnOrder(storedFull, editedVisible, ['pa', 'ab']);

    const otherTable = ['ab', 'r', 'pa', 'obp'];
    expect(applyColumnOrder(otherTable, merged)).toEqual(['pa', 'r', 'ab', 'obp']);
  });
});
