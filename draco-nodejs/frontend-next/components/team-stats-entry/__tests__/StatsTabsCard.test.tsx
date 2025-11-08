import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type {
  GameBattingStatsType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import StatsTabsCard, { type TabKey } from '../StatsTabsCard';

const mockResizeObserver = class {
  constructor(_callback?: unknown) {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

(globalThis as unknown as { ResizeObserver: typeof mockResizeObserver }).ResizeObserver =
  mockResizeObserver;

const noop = () => {};
const asyncNoop = async () => {};

const emptyPlayers: TeamStatsPlayerSummaryType[] = [];

const nullBatting = null as unknown as GameBattingStatsType | null;
const nullPitching = null as unknown as GamePitchingStatsType | null;

const sampleBattingStats: GameBattingStatsType = {
  gameId: '1',
  teamSeasonId: 'team-1',
  stats: [
    {
      statId: 'stat-1',
      rosterSeasonId: 'roster-1',
      playerId: 'player-1',
      contactId: 'contact-1',
      playerName: 'Sample Batter',
      playerNumber: 12,
      ab: 0,
      h: 0,
      r: 0,
      d: 0,
      t: 0,
      hr: 0,
      rbi: 0,
      so: 0,
      bb: 0,
      hbp: 0,
      sb: 0,
      cs: 0,
      sf: 0,
      sh: 0,
      re: 0,
      intr: 0,
      lob: 0,
      tb: 0,
      pa: 0,
      avg: 0,
      obp: 0,
      slg: 0,
      ops: 0,
    },
  ],
  totals: {
    t: 0,
    ab: 0,
    h: 0,
    r: 0,
    d: 0,
    hr: 0,
    rbi: 0,
    bb: 0,
    so: 0,
    hbp: 0,
    sb: 0,
    sf: 0,
    sh: 0,
    avg: 0,
    obp: 0,
    slg: 0,
    ops: 0,
    tb: 0,
    pa: 0,
    cs: 0,
    re: 0,
    intr: 0,
    lob: 0,
  },
  availablePlayers: [
    {
      rosterSeasonId: 'roster-2',
      playerId: 'player-2',
      contactId: 'contact-2',
      playerName: 'New Batter',
      playerNumber: 7,
      photoUrl: null,
    },
  ],
};

const samplePitchingStats: GamePitchingStatsType = {
  gameId: '1',
  teamSeasonId: 'team-1',
  stats: [
    {
      statId: 'pitch-1',
      rosterSeasonId: 'roster-3',
      playerId: 'player-3',
      contactId: 'contact-3',
      playerName: 'Sample Pitcher',
      playerNumber: 9,
      ipDecimal: 0,
      w: 0,
      l: 0,
      s: 0,
      h: 0,
      r: 0,
      er: 0,
      d: 0,
      t: 0,
      hr: 0,
      so: 0,
      bb: 0,
      bf: 0,
      wp: 0,
      hbp: 0,
      bk: 0,
      sc: 0,
      ip: 0,
      ip2: 0,
      era: 0,
      whip: 0,
      k9: 0,
      bb9: 0,
      oba: 0,
      slg: 0,
    },
  ],
  totals: {
    ipDecimal: 0,
    w: 0,
    l: 0,
    s: 0,
    h: 0,
    r: 0,
    er: 0,
    d: 0,
    t: 0,
    hr: 0,
    so: 0,
    bb: 0,
    bf: 0,
    wp: 0,
    hbp: 0,
    bk: 0,
    sc: 0,
    ip: 0,
    ip2: 0,
    era: 0,
    whip: 0,
    k9: 0,
    bb9: 0,
    oba: 0,
    slg: 0,
  },
  availablePlayers: [
    {
      rosterSeasonId: 'roster-4',
      playerId: 'player-4',
      contactId: 'contact-4',
      playerName: 'New Pitcher',
      playerNumber: 22,
      photoUrl: null,
    },
  ],
};
describe('StatsTabsCard', () => {
  it('hides attendance tab for non-admin viewers', () => {
    render(
      <StatsTabsCard
        tab={'batting' satisfies TabKey}
        onTabChange={noop}
        canManageStats={false}
        enableAttendanceTracking
        loading={false}
        error={null}
        selectedGameId="game-1"
        battingStats={nullBatting}
        pitchingStats={nullPitching}
        battingTotals={null}
        pitchingTotals={null}
        availableBatters={emptyPlayers}
        availablePitchers={emptyPlayers}
        onCreateBattingStat={asyncNoop}
        onUpdateBattingStat={asyncNoop}
        onDeleteBattingStat={noop}
        onCreatePitchingStat={asyncNoop}
        onUpdatePitchingStat={asyncNoop}
        onDeletePitchingStat={noop}
        onProcessError={noop}
        attendanceOptions={emptyPlayers}
        attendanceSelection={[]}
        onAttendanceToggle={noop}
        lockedAttendanceRosterIds={[]}
        attendanceLoading={false}
        attendanceError={null}
        pendingAttendanceRosterId={null}
        seasonBattingStats={[]}
        seasonPitchingStats={[]}
        seasonLoading={false}
        seasonError={null}
        gameOutcome={null}
      />,
    );

    expect(screen.queryByRole('tab', { name: 'Attendance' })).not.toBeInTheDocument();
  });

  it('invokes onTabChange when switching tabs', () => {
    const onTabChange = vi.fn();

    render(
      <StatsTabsCard
        tab={'batting' satisfies TabKey}
        onTabChange={onTabChange}
        canManageStats
        enableAttendanceTracking
        loading={false}
        error={null}
        selectedGameId="game-1"
        battingStats={nullBatting}
        pitchingStats={nullPitching}
        battingTotals={null}
        pitchingTotals={null}
        availableBatters={emptyPlayers}
        availablePitchers={emptyPlayers}
        onCreateBattingStat={asyncNoop}
        onUpdateBattingStat={asyncNoop}
        onDeleteBattingStat={noop}
        onCreatePitchingStat={asyncNoop}
        onUpdatePitchingStat={asyncNoop}
        onDeletePitchingStat={noop}
        onProcessError={noop}
        attendanceOptions={emptyPlayers}
        attendanceSelection={[]}
        onAttendanceToggle={noop}
        lockedAttendanceRosterIds={[]}
        attendanceLoading={false}
        attendanceError={null}
        pendingAttendanceRosterId={null}
        seasonBattingStats={[]}
        seasonPitchingStats={[]}
        seasonLoading={false}
        seasonError={null}
        gameOutcome={null}
        onClearGameSelection={noop}
      />,
    );

    const pitchingTab = screen.getByRole('tab', { name: 'Pitching' });
    fireEvent.click(pitchingTab);

    expect(onTabChange).toHaveBeenCalledWith('pitching');
  });

  it('enters edit mode without crashing', () => {
    render(
      <StatsTabsCard
        tab={'batting' satisfies TabKey}
        onTabChange={noop}
        canManageStats
        enableAttendanceTracking
        loading={false}
        error={null}
        selectedGameId="game-1"
        battingStats={sampleBattingStats}
        pitchingStats={samplePitchingStats}
        battingTotals={sampleBattingStats.totals}
        pitchingTotals={samplePitchingStats.totals}
        availableBatters={sampleBattingStats.availablePlayers}
        availablePitchers={samplePitchingStats.availablePlayers}
        onCreateBattingStat={asyncNoop}
        onUpdateBattingStat={asyncNoop}
        onDeleteBattingStat={noop}
        onCreatePitchingStat={asyncNoop}
        onUpdatePitchingStat={asyncNoop}
        onDeletePitchingStat={noop}
        onProcessError={noop}
        attendanceOptions={emptyPlayers}
        attendanceSelection={[]}
        onAttendanceToggle={noop}
        lockedAttendanceRosterIds={[]}
        attendanceLoading={false}
        attendanceError={null}
        pendingAttendanceRosterId={null}
        seasonBattingStats={[]}
        seasonPitchingStats={[]}
        seasonLoading={false}
        seasonError={null}
        gameOutcome={null}
      />,
    );

    const editButton = screen.getByRole('button', { name: /edit stats/i });
    fireEvent.click(editButton);

    expect(screen.getByRole('button', { name: /exit edit mode/i })).toBeInTheDocument();
  });
});
