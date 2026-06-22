import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { ProposalAssignmentRow } from '../ProposalAssignmentRow';
import type { SchedulerSolveResult } from '@draco/shared-schemas';

const assignment: SchedulerSolveResult['assignments'][number] = {
  gameId: 'game-1',
  fieldId: 'field-1',
  startTime: '2026-05-07T21:45:00.000Z',
  endTime: '2026-05-07T22:45:00.000Z',
  umpireIds: [],
};

const renderRow = (maxUmpires: number) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <ProposalAssignmentRow
        assignment={assignment}
        game={undefined}
        timeZone="America/New_York"
        selected
        expanded={false}
        fields={[{ id: 'field-1', name: 'Allen Park' }]}
        umpires={[{ id: 'u1', name: 'Alice' }]}
        maxUmpires={maxUmpires}
        fieldNameById={new Map([['field-1', 'Allen Park']])}
        teamNameById={new Map()}
        umpireNameById={new Map()}
        schedulerUmpireNameById={new Map()}
        leagueNameById={new Map()}
        onToggleSelection={vi.fn()}
        onToggleExpanded={vi.fn()}
        onAssignmentChange={vi.fn()}
      />
      ,
    </ThemeProvider>,
  );

describe('ProposalAssignmentRow umpire display', () => {
  it('hides the umpire field when umpire scheduling is off (maxUmpires = 0)', () => {
    renderRow(0);
    expect(screen.queryByText(/Umpire: Unassigned/)).not.toBeInTheDocument();
  });

  it('shows "Umpire: Unassigned" when umpire scheduling is on and none assigned', () => {
    renderRow(2);
    expect(screen.getByText(/Umpire: Unassigned/)).toBeInTheDocument();
  });
});
