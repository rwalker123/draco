import { describe, expect, it, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadScheduleSnapshot, saveScheduleSnapshot } from '../scheduleStorage';
import type { ScheduleSnapshot } from '../../types/schedule';

const sampleSnapshot: ScheduleSnapshot = {
  games: [
    {
      id: 'game-1',
      gameDate: new Date().toISOString(),
      startsAt: new Date().toISOString(),
      homeTeam: { id: 'home-1', name: 'Home Team' },
      visitorTeam: { id: 'away-1', name: 'Visitor Team' },
      field: { id: 'field-1', name: 'Main Field' },
      league: { id: 'league-1', name: 'Premier' },
      season: undefined,
      gameStatus: 0,
      gameStatusText: 'Scheduled'
    }
  ],
  teams: [{ id: 'team-1', name: 'Home Team', league: { id: 'league-1', name: 'Premier' }, division: undefined }],
  assignments: [
    { id: 'assign-1', scope: 'team', accountId: 'account-1', teamSeasonId: 'team-1', updatedAt: new Date().toISOString() }
  ]
};

describe('scheduleStorage', () => {
  beforeEach(async () => {
    await (AsyncStorage as unknown as { clear: () => Promise<void> }).clear();
    vi.useRealTimers();
  });

  it('saves and loads schedule snapshots', async () => {
    await saveScheduleSnapshot(sampleSnapshot);

    const loaded = await loadScheduleSnapshot();
    expect(loaded).toEqual(sampleSnapshot);
  });

  it('evicts snapshots older than 30 days', async () => {
    vi.useFakeTimers();
    await saveScheduleSnapshot(sampleSnapshot);

    const now = Date.now();
    vi.setSystemTime(now + 1000 * 60 * 60 * 24 * 31);

    const loaded = await loadScheduleSnapshot();
    expect(loaded).toBeNull();
    vi.useRealTimers();
  });

  it('returns null for invalid JSON', async () => {
    await AsyncStorage.setItem('draco_mobile_schedule_snapshot_v1', 'not json');
    const loaded = await loadScheduleSnapshot();
    expect(loaded).toBeNull();
  });
});
