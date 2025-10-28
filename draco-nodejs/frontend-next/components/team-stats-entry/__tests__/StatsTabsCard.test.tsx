import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type {
  GameBattingStatsType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import StatsTabsCard, { type TabKey } from '../StatsTabsCard';

const noop = () => {};

const emptyPlayers: TeamStatsPlayerSummaryType[] = [];

const nullBatting = null as unknown as GameBattingStatsType | null;
const nullPitching = null as unknown as GamePitchingStatsType | null;

describe('StatsTabsCard', () => {
  it('hides attendance tab for non-admin viewers', () => {
    render(
      <StatsTabsCard
        tab={'batting' satisfies TabKey}
        onTabChange={noop}
        canManageStats={false}
        loading={false}
        error={null}
        selectedGameId="game-1"
        battingStats={nullBatting}
        pitchingStats={nullPitching}
        battingTotals={null}
        pitchingTotals={null}
        availableBatters={emptyPlayers}
        availablePitchers={emptyPlayers}
        onAddBatter={noop}
        onEditBatter={noop}
        onDeleteBatter={noop}
        onAddPitcher={noop}
        onEditPitcher={noop}
        onDeletePitcher={noop}
        attendanceOptions={emptyPlayers}
        attendanceSelection={[]}
        onAttendanceSelectionChange={noop}
        lockedAttendanceRosterIds={[]}
        attendanceLoading={false}
        attendanceError={null}
        attendanceSaving={false}
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
        loading={false}
        error={null}
        selectedGameId="game-1"
        battingStats={nullBatting}
        pitchingStats={nullPitching}
        battingTotals={null}
        pitchingTotals={null}
        availableBatters={emptyPlayers}
        availablePitchers={emptyPlayers}
        onAddBatter={noop}
        onEditBatter={noop}
        onDeleteBatter={noop}
        onAddPitcher={noop}
        onEditPitcher={noop}
        onDeletePitcher={noop}
        attendanceOptions={emptyPlayers}
        attendanceSelection={[]}
        onAttendanceSelectionChange={noop}
        lockedAttendanceRosterIds={[]}
        attendanceLoading={false}
        attendanceError={null}
        attendanceSaving={false}
      />,
    );

    const pitchingTab = screen.getByRole('tab', { name: 'Pitching' });
    fireEvent.click(pitchingTab);

    expect(onTabChange).toHaveBeenCalledWith('pitching');
  });
});
