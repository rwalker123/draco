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

export function registerSportAdapter(sportType: string, adapter: SportScheduleAdapter): void {
  sportAdapterRegistry.set(sportType.toLowerCase(), adapter);
}

export { baseballAdapter } from './baseballAdapter';
export { golfAdapter } from './golfAdapter';
export type { SportScheduleAdapter } from '../types/sportAdapter';
