import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfFlightWithTeamCountType } from '@draco/shared-schemas';

const mockDeleteFlight = vi.fn();

vi.mock('@/hooks/useGolfFlights', () => ({
  useGolfFlights: () => ({
    listFlights: vi.fn(),
    createFlight: vi.fn(),
    updateFlight: vi.fn(),
    deleteFlight: mockDeleteFlight,
  }),
}));

import DeleteFlightDialog from '../DeleteFlightDialog';

const createMockFlight = (
  overrides: Partial<GolfFlightWithTeamCountType> = {},
): GolfFlightWithTeamCountType => ({
  id: 'flight-1',
  name: 'Championship Flight',
  teamCount: 0,
  ...overrides,
});

describe('DeleteFlightDialog', () => {
  const mockFlight = createMockFlight();

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    accountId: 'account-1',
    flight: mockFlight,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteFlight.mockResolvedValue({
      success: true,
      data: undefined,
      message: 'Flight deleted successfully',
    });
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<DeleteFlightDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Delete Flight' })).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<DeleteFlightDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays the flight name in the confirmation text', () => {
      render(<DeleteFlightDialog {...defaultProps} />);

      expect(screen.getByText(/Championship Flight/)).toBeInTheDocument();
    });

    it('does not show team count warning when flight has no teams', () => {
      render(<DeleteFlightDialog {...defaultProps} />);

      expect(screen.queryByText(/team/i)).not.toBeInTheDocument();
    });

    it('shows team count warning when flight has teams assigned', () => {
      const flightWithTeams = createMockFlight({ teamCount: 3 });

      render(<DeleteFlightDialog {...defaultProps} flight={flightWithTeams} />);

      expect(screen.getByText(/3 teams assigned/)).toBeInTheDocument();
    });

    it('uses singular team wording when exactly one team is assigned', () => {
      const flightWithOneTeam = createMockFlight({ teamCount: 1 });

      render(<DeleteFlightDialog {...defaultProps} flight={flightWithOneTeam} />);

      expect(screen.getByText(/1 team assigned/)).toBeInTheDocument();
    });
  });

  describe('cancel button', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteFlightDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete action', () => {
    it('calls deleteFlight with the flight id when Delete Flight is clicked', async () => {
      const user = userEvent.setup();

      render(<DeleteFlightDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(mockDeleteFlight).toHaveBeenCalledWith('flight-1');
      });
    });

    it('calls onSuccess with the flight id and message on successful delete', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(<DeleteFlightDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          'flight-1',
          'Flight "Championship Flight" deleted successfully',
        );
      });
    });

    it('calls onClose after a successful delete', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteFlightDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('loading state', () => {
    it('disables Cancel and shows progress indicator while the delete request is in flight', async () => {
      let resolveDelete: (value: unknown) => void;
      mockDeleteFlight.mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
      );

      const user = userEvent.setup();

      render(<DeleteFlightDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        resolveDelete!({ success: true, data: undefined, message: '' });
      });
    });
  });

  describe('error state', () => {
    it('displays an error alert when the delete fails with a result error', async () => {
      mockDeleteFlight.mockResolvedValue({ success: false, error: 'Flight is in use' });

      const user = userEvent.setup();

      render(<DeleteFlightDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Flight is in use');
      });
    });

    it('calls onError with the error message on failure', async () => {
      mockDeleteFlight.mockResolvedValue({ success: false, error: 'Flight is in use' });

      const user = userEvent.setup();
      const onError = vi.fn();

      render(<DeleteFlightDialog {...defaultProps} onError={onError} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Flight is in use');
      });
    });

    it('displays an error alert when deleteFlight throws', async () => {
      mockDeleteFlight.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(<DeleteFlightDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Delete Flight' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });
  });
});
