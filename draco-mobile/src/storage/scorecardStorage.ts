import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScorecardSnapshot, ScorecardStoredGame } from '../types/scoring';

const STORAGE_KEY = 'draco_mobile_scorecard_log_v1';
const SCHEMA_VERSION = 1;
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function saveScorecardSnapshot(games: Record<string, ScorecardStoredGame>): Promise<void> {
  const snapshot: ScorecardSnapshot = {
    schemaVersion: SCHEMA_VERSION,
    storedAt: Date.now(),
    games
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export async function loadScorecardSnapshot(): Promise<Record<string, ScorecardStoredGame> | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ScorecardSnapshot;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (!parsed.storedAt || Date.now() - parsed.storedAt > THIRTY_DAYS_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.games ?? {};
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearScorecardSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
