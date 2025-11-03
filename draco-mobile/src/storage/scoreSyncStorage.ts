import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScoreEventMutation } from '../types/scoring';

const STORAGE_KEY = 'draco_mobile_score_sync_queue_v1';
const SCHEMA_VERSION = 1;
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

type StoredQueue = {
  schemaVersion: number;
  storedAt: number;
  mutations: ScoreEventMutation[];
};

export async function loadScoreSyncQueue(): Promise<ScoreEventMutation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredQueue;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    }

    if (!parsed.storedAt || Date.now() - parsed.storedAt > THIRTY_DAYS_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed.mutations ?? [];
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export async function saveScoreSyncQueue(mutations: ScoreEventMutation[]): Promise<void> {
  const payload: StoredQueue = {
    schemaVersion: SCHEMA_VERSION,
    storedAt: Date.now(),
    mutations,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function clearScoreSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
