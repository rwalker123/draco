import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import { SchedulerConstraintsConfig } from '../SchedulerConstraintsConfig';
import { DEFAULT_CONSTRAINT_CONFIG } from '../../../utils/schedulerConstraintStorage';

const renderConfig = (onChange = vi.fn()) => {
  render(
    <ThemeProvider theme={dracoTheme}>
      <SchedulerConstraintsConfig
        seasonId="2026"
        config={DEFAULT_CONSTRAINT_CONFIG}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  return onChange;
};

const expandSection = () =>
  fireEvent.click(screen.getByRole('button', { name: /Scheduling Constraints/ }));

describe('SchedulerConstraintsConfig', () => {
  it('shows all constraints disabled by default', () => {
    renderConfig();
    expect(screen.getByText('None enabled')).toBeInTheDocument();

    expandSection();
    const labels = [
      'Avoid back-to-back games',
      'Spread games across days',
      'Balance early vs. late games',
      'Limit games per team per day',
      'Require lights after a set hour',
    ];
    for (const label of labels) {
      expect((screen.getByLabelText(label) as HTMLInputElement).checked).toBe(false);
    }
  });

  it('emits an enabled soft constraint when toggled on', () => {
    const onChange = renderConfig();
    expandSection();

    fireEvent.click(screen.getByLabelText('Avoid back-to-back games'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        avoidBackToBackGames: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it('reveals the team-per-day limit field only when enabled', () => {
    const onChange = renderConfig();
    expandSection();

    expect(screen.queryByLabelText('Max games/team/day')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Limit games per team per day'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        maxGamesPerTeamPerDay: expect.objectContaining({ enabled: true }),
      }),
    );
  });
});
