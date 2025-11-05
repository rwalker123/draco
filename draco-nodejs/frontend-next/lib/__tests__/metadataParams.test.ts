import { describe, expect, it } from 'vitest';

import { getFirstQueryValue, normalizeSearchParams, resolveRouteParams } from '../metadataParams';

describe('normalizeSearchParams', () => {
  it('returns empty object when searchParams is undefined', async () => {
    await expect(normalizeSearchParams(undefined)).resolves.toEqual({});
  });

  it('converts URLSearchParams into a plain record', async () => {
    const params = new URLSearchParams();
    params.append('accountId', '123');
    params.append('accountId', '456');
    params.append('view', 'summary');

    await expect(normalizeSearchParams(params)).resolves.toEqual({
      accountId: ['123', '456'],
      view: 'summary',
    });
  });

  it('handles promise-wrapped URLSearchParams values', async () => {
    const params = new URLSearchParams({ accountId: 'promise' });
    await expect(normalizeSearchParams(Promise.resolve(params))).resolves.toEqual({
      accountId: 'promise',
    });
  });

  it('clones an existing record without mutation', async () => {
    const original = { accountId: '789', filter: ['recent', 'popular'] };
    const normalized = await normalizeSearchParams(original);

    expect(normalized).toEqual(original);
    expect(normalized).not.toBe(original);
  });
});

describe('getFirstQueryValue', () => {
  it('returns undefined when key is missing', async () => {
    await expect(getFirstQueryValue(undefined, 'missing')).resolves.toBeUndefined();
  });

  it('reads from URLSearchParams', async () => {
    const params = new URLSearchParams({ accountId: '101' });
    await expect(getFirstQueryValue(params, 'accountId')).resolves.toBe('101');
  });

  it('returns the first entry when multiple values exist', async () => {
    const params = { accountId: ['202', '303'] };
    await expect(getFirstQueryValue(params, 'accountId')).resolves.toBe('202');
  });
});

describe('resolveRouteParams', () => {
  it('returns params when already resolved', async () => {
    const params = { accountId: '404' };
    await expect(resolveRouteParams(params)).resolves.toEqual(params);
  });

  it('awaits params when passed as a promise', async () => {
    const params = Promise.resolve({ accountId: '505' });
    await expect(resolveRouteParams(params)).resolves.toEqual({ accountId: '505' });
  });
});
