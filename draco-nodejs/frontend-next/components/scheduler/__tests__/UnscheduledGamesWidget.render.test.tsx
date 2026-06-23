import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import { dracoTheme } from '../../../theme';
import { UnscheduledGamesWidget } from '../UnscheduledGamesWidget';

type GameRequest = SchedulerProblemSpecPreview['games'][number];

const gameRequestById = new Map<string, GameRequest>([
  ['g1', { id: 'g1', leagueSeasonId: 'L1', homeTeamSeasonId: 't1', visitorTeamSeasonId: 't2' }],
]);
const teamNameById = new Map([
  ['t1', 'Aces'],
  ['t2', 'Bats'],
]);
const leagueNameById = new Map([['L1', 'Adult']]);

const renderWidget = (unscheduled: SchedulerSolveResult['unscheduled']) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <UnscheduledGamesWidget
        unscheduled={unscheduled}
        gameRequestById={gameRequestById}
        teamNameById={teamNameById}
        leagueNameById={leagueNameById}
      />
    </ThemeProvider>,
  );

describe('UnscheduledGamesWidget', () => {
  it('renders nothing when there are no unscheduled games', () => {
    const { container } = renderWidget([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count and reveals matchup labels and reasons when expanded', () => {
    renderWidget([{ gameId: 'g1', reason: 'No field available' }]);

    expect(screen.getByText('1 game could not be scheduled.')).toBeInTheDocument();
    expect(screen.queryByText('[Adult] Aces vs Bats')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Unscheduled Games'));

    expect(screen.getByText('[Adult] Aces vs Bats')).toBeInTheDocument();
    expect(screen.getByText('No field available')).toBeInTheDocument();
  });
});
