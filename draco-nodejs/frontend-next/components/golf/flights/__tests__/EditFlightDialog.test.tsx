import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfFlightType, GolfFlightWithTeamCountType } from '@draco/shared-schemas';

const mockUpdateFlight = vi.fn();

vi.mock('@/hooks/useGolfFlights', () => ({
  useGolfFlights: () => ({
    listFlights: vi.fn(),
    createFlight: vi.fn(),
    updateFlight: mockUpdateFlight,
    deleteFlight: vi.fn(),
  }),
}));

import EditFlightDialog from '../EditFlightDialog';

const createMockFlight = (
  overrides: Partial<GolfFlightWithTeamCountType> = {},
): GolfFlightWithTeamCountType => ({
  id: 'flight-1',
  name: 'Championship Flight',
  teamCount: 0,
  ...overrides,
});

const createMockUpdatedFlight = (overrides: Partial<GolfFlightType> = {}): GolfFlightType => ({
  id: 'flight-1',
  name: 'Championship Flight',
  ...overrides,
});

describe('EditFlightDialog', () => {
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
    mockUpdateFlight.mockResolvedValue({
      success: true,
      data: createMockUpdatedFlight({ name: 'Updated Flight' }),
      message: 'Flight updated successfully',
    });
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<EditFlightDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Flight' })).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<EditFlightDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('pre-populates the Flight Name field with the current flight name', () => {
      render(<EditFlightDialog {...defaultProps} />);

      expect(screen.getByLabelText('Flight Name')).toHaveValue('Championship Flight');
    });

    it('renders Cancel and Save Changes buttons', () => {
      render(<EditFlightDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });

    it('disables Save Changes when the name has not changed', () => {
      render(<EditFlightDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });

    it('enables Save Changes when the flight name is changed', async () => {
      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'A Flight');

      expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled();
    });

    it('disables Save Changes when the name is cleared to blank', async () => {
      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      await user.clear(screen.getByLabelText('Flight Name'));

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });
  });

  describe('cancel button', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditFlightDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets the flight name to the original value when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Temporary Name');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(input).toHaveValue('Championship Flight');
    });
  });

  describe('submit action', () => {
    it('calls updateFlight with the flight id and trimmed name', async () => {
      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, '  Updated Flight  ');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(mockUpdateFlight).toHaveBeenCalledWith('flight-1', { name: 'Updated Flight' });
      });
    });

    it('calls onSuccess with the updated flight and success message', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const updatedFlight = createMockUpdatedFlight({ name: 'Updated Flight' });
      mockUpdateFlight.mockResolvedValue({
        success: true,
        data: updatedFlight,
        message: 'Flight updated successfully',
      });

      render(<EditFlightDialog {...defaultProps} onSuccess={onSuccess} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(updatedFlight, 'Flight renamed to "Updated Flight"');
      });
    });

    it('calls onClose after a successful update', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditFlightDialog {...defaultProps} onClose={onClose} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('loading state', () => {
    it('disables Cancel and shows progress indicator while the update request is in flight', async () => {
      let resolveUpdate: (value: unknown) => void;
      mockUpdateFlight.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
      );

      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        resolveUpdate!({ success: true, data: createMockUpdatedFlight(), message: '' });
      });
    });

    it('disables the text field while the update request is in flight', async () => {
      let resolveUpdate: (value: unknown) => void;
      mockUpdateFlight.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
      );

      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(screen.getByLabelText('Flight Name')).toBeDisabled();

      await waitFor(() => {
        resolveUpdate!({ success: true, data: createMockUpdatedFlight(), message: '' });
      });
    });
  });

  describe('error state', () => {
    it('displays an error alert when update fails with a result error', async () => {
      mockUpdateFlight.mockResolvedValue({ success: false, error: 'Flight name already exists' });

      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Flight name already exists');
      });
    });

    it('calls onError with the error message on failure', async () => {
      mockUpdateFlight.mockResolvedValue({ success: false, error: 'Flight name already exists' });

      const user = userEvent.setup();
      const onError = vi.fn();

      render(<EditFlightDialog {...defaultProps} onError={onError} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Flight name already exists');
      });
    });

    it('displays an error alert when updateFlight throws', async () => {
      mockUpdateFlight.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(<EditFlightDialog {...defaultProps} />);

      const input = screen.getByLabelText('Flight Name');
      await user.clear(input);
      await user.type(input, 'Updated Flight');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });
  });
});
