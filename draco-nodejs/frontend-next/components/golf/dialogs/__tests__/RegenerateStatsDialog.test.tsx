import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockRegenerateGolfStats = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  regenerateGolfStats: (...args: unknown[]) => mockRegenerateGolfStats(...args),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock('@/utils/apiResult', () => ({
  unwrapApiResult: vi.fn((result: { data: unknown }) => result.data),
}));

vi.mock('@/context/AccountContext', () => ({
  useAccountTimezone: vi.fn(() => 'America/New_York'),
}));

import { RegenerateStatsDialog } from '../RegenerateStatsDialog';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accountId: 'account-1',
  leagueSeasonId: 'season-42',
};

describe('RegenerateStatsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<RegenerateStatsDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Regenerate Statistics')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      render(<RegenerateStatsDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Regenerate Statistics')).not.toBeInTheDocument();
    });

    it('shows all three switch options', () => {
      render(<RegenerateStatsDialog {...defaultProps} />);

      expect(screen.getByText('Regenerate Greens in Regulation')).toBeInTheDocument();
      expect(screen.getByText('Assign Week Numbers')).toBeInTheDocument();
      expect(screen.getByText('Recalculate Match Points')).toBeInTheDocument();
    });

    it('hides week boundary selector when Assign Week Numbers is not enabled', () => {
      render(<RegenerateStatsDialog {...defaultProps} />);

      expect(screen.queryByLabelText(/week boundary/i)).not.toBeInTheDocument();
    });
  });

  describe('week boundary selector', () => {
    it('shows week boundary selector when Assign Week Numbers is enabled', async () => {
      const user = userEvent.setup();
      render(<RegenerateStatsDialog {...defaultProps} />);

      const switches = screen.getAllByRole('switch');
      const weekNumbersSwitch = switches[1];
      await user.click(weekNumbersSwitch);

      expect(screen.getByLabelText(/week boundary/i)).toBeInTheDocument();
    });
  });

  describe('regenerate button state', () => {
    it('disables Regenerate button when no options are selected', () => {
      render(<RegenerateStatsDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /^regenerate$/i })).toBeDisabled();
    });

    it('enables Regenerate button when at least one option is selected', async () => {
      const user = userEvent.setup();
      render(<RegenerateStatsDialog {...defaultProps} />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      expect(screen.getByRole('button', { name: /^regenerate$/i })).toBeEnabled();
    });
  });

  describe('API interaction', () => {
    it('calls regenerateGolfStats with correct options when regenerate is clicked', async () => {
      const user = userEvent.setup();
      mockRegenerateGolfStats.mockResolvedValue({
        data: { girScoresUpdated: 5, weekNumbersAssigned: 0, matchPointsRecalculated: 0 },
      });

      render(<RegenerateStatsDialog {...defaultProps} />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      await user.click(screen.getByRole('button', { name: /^regenerate$/i }));

      await waitFor(() => {
        expect(mockRegenerateGolfStats).toHaveBeenCalledWith(
          expect.objectContaining({
            path: { accountId: 'account-1' },
            body: expect.objectContaining({
              leagueSeasonId: 'season-42',
              regenerateGir: true,
              regenerateWeekNumbers: false,
              recalculateMatchPoints: false,
            }),
          }),
        );
      });
    });

    it('does not include weekBoundary in body when Assign Week Numbers is disabled', async () => {
      const user = userEvent.setup();
      mockRegenerateGolfStats.mockResolvedValue({
        data: { girScoresUpdated: 3, weekNumbersAssigned: 0, matchPointsRecalculated: 0 },
      });

      render(<RegenerateStatsDialog {...defaultProps} />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      await user.click(screen.getByRole('button', { name: /^regenerate$/i }));

      await waitFor(() => {
        const body = mockRegenerateGolfStats.mock.calls[0][0].body;
        expect(body.weekBoundary).toBeUndefined();
      });
    });

    it('calls onSuccess with result message and closes dialog on success', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockRegenerateGolfStats.mockResolvedValue({
        data: { girScoresUpdated: 10, weekNumbersAssigned: 3, matchPointsRecalculated: 2 },
      });

      render(<RegenerateStatsDialog {...defaultProps} onSuccess={onSuccess} />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      await user.click(screen.getByRole('button', { name: /^regenerate$/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          'Updated 10 GIR scores, assigned 3 week numbers, recalculated 2 matches',
        );
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('shows error message on API failure', async () => {
      const user = userEvent.setup();
      mockRegenerateGolfStats.mockRejectedValue(new Error('Server error'));

      render(<RegenerateStatsDialog {...defaultProps} />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      await user.click(screen.getByRole('button', { name: /^regenerate$/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<RegenerateStatsDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
