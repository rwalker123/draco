import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCourseDialog from '../CreateCourseDialog';

describe('CreateCourseDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering when open', () => {
    it('renders the dialog when open is true', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays the dialog title', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Create Golf Course' })).toBeInTheDocument();
    });

    it('renders Course Name field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Course Name/i)).toBeInTheDocument();
    });

    it('renders Holes select field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders Designer field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('Designer')).toBeInTheDocument();
    });

    it('renders Year Built field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('Year Built')).toBeInTheDocument();
    });

    it('renders Address field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('Address')).toBeInTheDocument();
    });

    it('renders City field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('City')).toBeInTheDocument();
    });

    it('renders State / Province field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('State / Province')).toBeInTheDocument();
    });

    it('renders ZIP / Postal Code field', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByLabelText('ZIP / Postal Code')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders Create Course submit button', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Create Course' })).toBeInTheDocument();
    });

    it('defaults numberOfHoles to 18', () => {
      render(<CreateCourseDialog {...defaultProps} />);

      expect(screen.getByRole('combobox')).toHaveTextContent('18 Holes');
    });
  });

  describe('rendering when closed', () => {
    it('does not render dialog content when open is false', () => {
      render(<CreateCourseDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateCourseDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets form fields after cancel', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { rerender } = render(<CreateCourseDialog {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Temp Course');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      rerender(<CreateCourseDialog {...defaultProps} open={true} onClose={onClose} />);

      expect(screen.getByLabelText(/Course Name/i)).toHaveValue('');
    });
  });

  describe('form validation', () => {
    it('shows validation error when submitting without a course name', async () => {
      render(<CreateCourseDialog {...defaultProps} />);

      fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });
    });

    it('does not call onSubmit when course name is missing', async () => {
      const onSubmit = vi.fn();

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears validation error after entering a course name', async () => {
      const user = userEvent.setup();

      render(<CreateCourseDialog {...defaultProps} />);

      fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Course Name/i), 'Valid Name');

      await waitFor(() => {
        expect(screen.queryByText('Course name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful submission', () => {
    it('calls onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Pebble Beach');

      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pebble Beach',
          numberOfHoles: 18,
        }),
      );
    });

    it('submits with default par arrays when not specified', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');

      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.mensPar).toHaveLength(18);
      expect(submittedData.womansPar).toHaveLength(18);
      expect(submittedData.mensHandicap).toHaveLength(18);
      expect(submittedData.womansHandicap).toHaveLength(18);
      expect(submittedData.mensPar.every((v: number) => v === 4)).toBe(true);
    });

    it('submits with optional fields filled in', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Augusta National');
      await user.type(screen.getByLabelText('Designer'), 'Alister MacKenzie');
      await user.type(screen.getByLabelText('Address'), '2604 Washington Rd');
      await user.type(screen.getByLabelText('City'), 'Augusta');
      await user.type(screen.getByLabelText('State / Province'), 'GA');
      await user.type(screen.getByLabelText('ZIP / Postal Code'), '30904');

      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Augusta National',
            designer: 'Alister MacKenzie',
            address: '2604 Washington Rd',
            city: 'Augusta',
            state: 'GA',
            zip: '30904',
          }),
        );
      });
    });

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onClose={onClose} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('resets the form after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { rerender } = render(
        <CreateCourseDialog {...defaultProps} onClose={onClose} onSubmit={onSubmit} />,
      );

      await user.type(screen.getByLabelText(/Course Name/i), 'First Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      rerender(<CreateCourseDialog open={true} onClose={onClose} onSubmit={onSubmit} />);

      expect(screen.getByLabelText(/Course Name/i)).toHaveValue('');
    });
  });

  describe('error handling', () => {
    it('displays error alert when onSubmit rejects', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue(new Error('Server error occurred'));

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred');
      });
    });

    it('displays fallback error message when rejection is not an Error instance', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue('unexpected failure');

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to create course');
      });
    });

    it('does not call onClose when submission fails', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockRejectedValue(new Error('Failed'));

      render(<CreateCourseDialog {...defaultProps} onClose={onClose} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('dismisses error alert when close icon is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const alert = screen.getByRole('alert');
      const closeButton = within(alert).getByRole('button');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('clears submit error when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));

      const { rerender } = render(
        <CreateCourseDialog {...defaultProps} onClose={onClose} onSubmit={onSubmit} />,
      );

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      rerender(
        <CreateCourseDialog
          open={true}
          onClose={onClose}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
        />,
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('submitting state', () => {
    it('disables form fields while submitting', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve;
          }),
      );

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/i)).toBeDisabled();
      });

      resolveSubmit!();

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/i)).not.toBeDisabled();
      });
    });

    it('disables Cancel button while submitting', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve;
          }),
      );

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      });

      resolveSubmit!();
    });

    it('shows Saving indicator on submit button while submitting', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve;
          }),
      );

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
      });

      resolveSubmit!();
    });
  });

  describe('holes selection', () => {
    it('allows selecting 9 holes', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '9 Holes' }));

      await user.type(screen.getByLabelText(/Course Name/i), 'Par 3 Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            numberOfHoles: 9,
          }),
        );
      });
    });

    it('allows selecting 18 holes', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<CreateCourseDialog {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '18 Holes' }));

      await user.type(screen.getByLabelText(/Course Name/i), 'Full Course');
      await user.click(screen.getByRole('button', { name: 'Create Course' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            numberOfHoles: 18,
          }),
        );
      });
    });
  });
});
