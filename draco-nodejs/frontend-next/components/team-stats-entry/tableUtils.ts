'use client';

import { useCallback, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export type SortConfig<K> = {
  key: K;
  direction: SortDirection;
};

export const compareValues = (a: unknown, b: unknown): number => {
  if (a === b) {
    return 0;
  }

  if (a === null || a === undefined) {
    return 1;
  }

  if (b === null || b === undefined) {
    return -1;
  }

  const aNumber = typeof a === 'number' ? a : Number(a);
  const bNumber = typeof b === 'number' ? b : Number(b);
  const aIsNumber = Number.isFinite(aNumber);
  const bIsNumber = Number.isFinite(bNumber);

  if (aIsNumber && bIsNumber) {
    return aNumber - bNumber;
  }

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
};

export const toggleDirection = (direction: SortDirection | undefined): SortDirection =>
  direction === 'asc' ? 'desc' : 'asc';

export const useSortableRows = <T, K>(
  rows: readonly T[] | null | undefined,
  getValue: (row: T, key: K) => unknown,
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(null);

  const sortedRows = useMemo(() => {
    if (!rows) {
      return [] as T[];
    }

    if (!sortConfig) {
      return [...rows];
    }

    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);
      return compareValues(aValue, bValue) * directionMultiplier;
    });
  }, [rows, sortConfig, getValue]);

  const handleSort = useCallback((key: K) => {
    setSortConfig((previous) => {
      if (previous?.key === key) {
        return { key, direction: toggleDirection(previous.direction) };
      }

      return { key, direction: 'asc' };
    });
  }, []);

  return { sortedRows, sortConfig, handleSort } as const;
};
