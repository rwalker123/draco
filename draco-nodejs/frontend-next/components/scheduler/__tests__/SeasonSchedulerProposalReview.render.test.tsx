import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { SeasonSchedulerProposalReview } from '../SeasonSchedulerProposalReview';
import type { SchedulerSolveResult } from '@draco/shared-schemas';

const baseProposal: SchedulerSolveResult = {
  runId: 'r1',
  status: 'partial',
  metrics: { totalGames: 1, scheduledGames: 0, unscheduledGames: 1, objectiveValue: 0 },
  assignments: [],
  unscheduled: [{ gameId: 'gen-264-2284-2288-5', reason: 'No field capacity remaining' }],
};

const renderReview = (
  overrides: Partial<React.ComponentProps<typeof SeasonSchedulerProposalReview>> = {},
) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <SeasonSchedulerProposalReview
        proposal={baseProposal}
        specPreview={null}
        specPreviewOpen={false}
        loading={false}
        timeZone="America/New_York"
        selectedGameIds={new Set()}
        fields={[]}
        umpires={[]}
        maxUmpires={0}
        fieldNameById={new Map()}
        teamNameById={
          new Map([
            ['2284', "Blue Collar A's"],
            ['2288', 'Giants'],
          ])
        }
        umpireNameById={new Map()}
        leagueNameById={new Map([['264', '30+']])}
        generatedMatchups={[
          {
            id: 'gen-264-2284-2288-5',
            leagueSeasonId: '264',
            homeTeamSeasonId: '2284',
            visitorTeamSeasonId: '2288',
          },
        ]}
        getGameSummaryLabel={(id) => `Game ${id}`}
        onToggleSelection={vi.fn()}
        onToggleAll={vi.fn()}
        onApply={vi.fn()}
        onAssignmentChange={vi.fn()}
        onCloseSpecPreview={vi.fn()}
        {...overrides}
      />
    </ThemeProvider>,
  );

describe('SeasonSchedulerProposalReview unscheduled labels', () => {
  it('shows the league prefix and team names for an unscheduled generated matchup', () => {
    renderReview();
    expect(screen.getByText("[30+] Blue Collar A's vs Giants")).toBeInTheDocument();
    expect(screen.queryByText(/gen-264-2284-2288-5/)).not.toBeInTheDocument();
    expect(screen.getByText('No field capacity remaining')).toBeInTheDocument();
  });

  it('falls back to the game summary label when the matchup is not found', () => {
    renderReview({ generatedMatchups: null });
    expect(screen.getByText('Game gen-264-2284-2288-5')).toBeInTheDocument();
  });
});
