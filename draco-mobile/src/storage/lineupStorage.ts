import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  GameLineupAssignment,
  LineupMutation,
  LineupTemplate,
} from '../types/lineups';

const STORAGE_KEY = 'draco_mobile_lineups_cache_v1';
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

type LineupStorageRecord = {
  storedAt: number;
  templates: LineupTemplate[];
  assignments: GameLineupAssignment[];
  pending: LineupMutation[];
};

export type LineupCache = Pick<LineupStorageRecord, 'templates' | 'assignments' | 'pending'>;

export async function saveLineupCache(cache: LineupCache): Promise<void> {
  const record: LineupStorageRecord = {
    ...cache,
    storedAt: Date.now()
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function loadLineupCache(): Promise<LineupCache | null> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as LineupStorageRecord;
    if (!parsed?.storedAt) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.storedAt > THIRTY_DAYS_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      templates: parsed.templates ?? [],
      assignments: parsed.assignments ?? [],
      pending: parsed.pending ?? []
    };
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearLineupCache(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
