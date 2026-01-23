import type { SportScheduleAdapter } from '../types/sportAdapter';
import { baseballAdapter } from './baseballAdapter';
import { golfAdapter } from './golfAdapter';

const sportAdapterRegistry = new Map<string, SportScheduleAdapter>();

sportAdapterRegistry.set('baseball', baseballAdapter);
sportAdapterRegistry.set('softball', baseballAdapter);
sportAdapterRegistry.set('golf', golfAdapter);

export function getSportAdapter(accountType: string | undefined): SportScheduleAdapter {
  if (!accountType) {
    return baseballAdapter;
  }

  const normalizedType = accountType.toLowerCase();
  const adapter = sportAdapterRegistry.get(normalizedType);

  if (!adapter) {
    return baseballAdapter;
  }

  return adapter;
}

export type { SportScheduleAdapter } from '../types/sportAdapter';
