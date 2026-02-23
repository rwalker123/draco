import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfFlightType } from '@draco/shared-schemas';

const mockCreateFlight = vi.fn();

vi.mock('@/hooks/useGolfFlights', () => ({
  useGolfFlights: () => ({
    listFlights: vi.fn(),
    createFlight: mockCreateFlight,
    updateFlight: vi.fn(),
    deleteFlight: vi.fn(),
  }),
}));

import CreateFlightDialog from '../CreateFlightDialog';

const createMockFlight = (overrides: Partial<GolfFlightType> = {}): GolfFlightType => ({
  id: 'flight-1',
  name: 'Championship Flight',
  ...overrides,
});

describe('CreateFlightDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    accountId: 'account-1',
    seasonId: 'season-1',
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFlight.mockResolvedValue({
      success: true,
      data: createMockFlight(),
      message: 'Flight created successfully',
    });
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<CreateFlightDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create New Flight' })).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<CreateFlightDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the Flight Name text field', () => {
      render(<CreateFlightDialog {...defaultProps} />);

      expect(screen.getByLabelText('Flight Name')).toBeInTheDocument();
    });

    it('renders Cancel and Create Flight buttons', () => {
      render(<CreateFlightDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Flight' })).toBeInTheDocument();
    });

    it('disables Create Flight button when flight name is empty', () => {
      render(<CreateFlightDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Create Flight' })).toBeDisabled();
    });

    it('enables Create Flight button when flight name has content', async () => {
      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');

      expect(screen.getByRole('button', { name: 'Create Flight' })).not.toBeDisabled();
    });
  });

  describe('cancel button', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateFlightDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears the flight name when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      rerender(<CreateFlightDialog {...defaultProps} open={true} />);

      expect(screen.getByLabelText('Flight Name')).toHaveValue('');
    });
  });

  describe('submit action', () => {
    it('calls createFlight with the season id and trimmed flight name', async () => {
      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), '  A Flight  ');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(mockCreateFlight).toHaveBeenCalledWith('season-1', { name: 'A Flight' });
      });
    });

    it('calls onSuccess with the created flight and success message', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const newFlight = createMockFlight({ name: 'A Flight' });
      mockCreateFlight.mockResolvedValue({
        success: true,
        data: newFlight,
        message: 'Flight created successfully',
      });

      render(<CreateFlightDialog {...defaultProps} onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(newFlight, 'Flight "A Flight" created successfully');
      });
    });

    it('calls onClose after a successful create', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateFlightDialog {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('keeps Create Flight disabled when flight name is only whitespace', async () => {
      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), '   ');

      expect(screen.getByRole('button', { name: 'Create Flight' })).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('disables Cancel and shows progress indicator while the create request is in flight', async () => {
      let resolveCreate: (value: unknown) => void;
      mockCreateFlight.mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
      );

      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        resolveCreate!({ success: true, data: createMockFlight(), message: '' });
      });
    });

    it('disables the text field while the create request is in flight', async () => {
      let resolveCreate: (value: unknown) => void;
      mockCreateFlight.mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
      );

      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      expect(screen.getByLabelText('Flight Name')).toBeDisabled();

      await waitFor(() => {
        resolveCreate!({ success: true, data: createMockFlight(), message: '' });
      });
    });
  });

  describe('error state', () => {
    it('displays an error alert when create fails with a result error', async () => {
      mockCreateFlight.mockResolvedValue({ success: false, error: 'Flight name already exists' });

      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Flight name already exists');
      });
    });

    it('calls onError with the error message on failure', async () => {
      mockCreateFlight.mockResolvedValue({ success: false, error: 'Flight name already exists' });

      const user = userEvent.setup();
      const onError = vi.fn();

      render(<CreateFlightDialog {...defaultProps} onError={onError} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Flight name already exists');
      });
    });

    it('displays an error alert when createFlight throws', async () => {
      mockCreateFlight.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(<CreateFlightDialog {...defaultProps} />);

      await user.type(screen.getByLabelText('Flight Name'), 'A Flight');
      await user.click(screen.getByRole('button', { name: 'Create Flight' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });
  });
});
