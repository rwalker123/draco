import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduleSnapshot } from '../types/schedule';

const STORAGE_KEY = 'draco_mobile_schedule_snapshot_v1';
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

type StoredScheduleSnapshot = ScheduleSnapshot & {
  storedAt: number;
};

export async function saveScheduleSnapshot(snapshot: ScheduleSnapshot): Promise<void> {
  const record: StoredScheduleSnapshot = {
    ...snapshot,
    storedAt: Date.now()
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export async function loadScheduleSnapshot(): Promise<ScheduleSnapshot | null> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredScheduleSnapshot;
    if (!parsed?.storedAt) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.storedAt > THIRTY_DAYS_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      games: parsed.games ?? [],
      teams: parsed.teams ?? [],
      assignments: parsed.assignments ?? []
    };
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearScheduleSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
