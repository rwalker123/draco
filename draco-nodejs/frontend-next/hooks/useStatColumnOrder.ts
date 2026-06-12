'use client';

import { useSyncExternalStore } from 'react';
import { statColumnOrderKey } from '../constants/storageKeys';
import { BATTING_STAT_FIELD_ORDER } from '../components/team-stats-entry/battingColumns';
import { PITCHING_STAT_FIELD_ORDER } from '../components/team-stats-entry/pitchingColumns';
import { applyColumnOrder, mergeColumnOrder, reconcileOrder } from '../utils/statColumnOrder';

export type StatColumnVariant = 'batting' | 'pitching';

const CANONICAL_ORDER: Record<StatColumnVariant, string[]> = {
  batting: BATTING_STAT_FIELD_ORDER,
  pitching: PITCHING_STAT_FIELD_ORDER,
};

const parseSavedOrder = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
      return parsed;
    }
  } catch {
    return [];
  }
  return [];
};

interface StatColumnOrderStore {
  canonical: string[];
  getSnapshot: () => string | null;
  subscribe: (callback: () => void) => () => void;
  write: (value: string[] | null) => void;
}

const createStore = (variant: StatColumnVariant): StatColumnOrderStore => {
  const key = statColumnOrderKey(variant);
  const listeners = new Set<() => void>();

  const getSnapshot = (): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const subscribe = (callback: () => void) => {
    listeners.add(callback);
    const handler = (event: StorageEvent) => {
      if (event.key === key) {
        callback();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler);
    }
    return () => {
      listeners.delete(callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handler);
      }
    };
  };

  const write = (value: string[] | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (value && value.length > 0) {
        window.localStorage.setItem(key, JSON.stringify(value));
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {
      return;
    }
    listeners.forEach((listener) => listener());
  };

  return { canonical: CANONICAL_ORDER[variant], getSnapshot, subscribe, write };
};

const stores: Record<StatColumnVariant, StatColumnOrderStore> = {
  batting: createStore('batting'),
  pitching: createStore('pitching'),
};

const getServerSnapshot = (): string | null => null;

export interface UseStatColumnOrderResult {
  order: string[];
  isCustomized: boolean;
  applyReorder: (visibleFields: string[], newVisibleOrder: string[]) => void;
  reset: () => void;
}

export const useStatColumnOrder = (variant: StatColumnVariant): UseStatColumnOrderResult => {
  const store = stores[variant];
  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
  const order = reconcileOrder(parseSavedOrder(raw), store.canonical);

  const applyReorder = (visibleFields: string[], newVisibleOrder: string[]) => {
    const current = reconcileOrder(parseSavedOrder(store.getSnapshot()), store.canonical);
    store.write(mergeColumnOrder(current, visibleFields, newVisibleOrder));
  };

  const reset = () => {
    store.write(null);
  };

  return { order, isCustomized: raw !== null, applyReorder, reset };
};

export { applyColumnOrder };
