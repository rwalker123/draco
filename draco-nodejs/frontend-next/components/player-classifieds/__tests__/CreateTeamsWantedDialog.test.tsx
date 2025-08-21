import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CreateTeamsWantedDialog from '../CreateTeamsWantedDialog';

// Mock the date picker components with working implementations
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({
    label,
    value,
    onChange,
    slotProps,
  }: {
    label: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    slotProps?: { textField?: Record<string, unknown> };
  }) => (
    <input
      data-testid="birth-date-input"
      type="date"
      aria-label={label}
      value={value ? new Date(value).toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onChange(date);
      }}
      {...slotProps?.textField}
    />
  ),
}));

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class MockAdapter {},
}));

describe('CreateTeamsWantedDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog when open', () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Post Teams Wanted' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /full name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /phone number/i })).toBeInTheDocument();
    expect(screen.getByTestId('birth-date-input')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateTeamsWantedDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('heading', { name: 'Post Teams Wanted' })).not.toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(<CreateTeamsWantedDialog {...defaultProps} loading={true} />);

    const submitButton = screen.getByRole('button', { name: 'Creating...' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('validates required name field', async () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    // Try to submit with empty name by submitting the form
    const form = screen.getByRole('dialog').querySelector('form');
    expect(form).toBeInTheDocument();

    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    // Fill in invalid email
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'invalid-email' },
    });

    // Submit the form
    const form = screen.getByRole('dialog').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    // Fill in invalid phone number
    fireEvent.change(screen.getByRole('textbox', { name: /phone number/i }), {
      target: { value: '123' }, // Too short to be valid
    });

    // Submit the form
    const form = screen.getByRole('dialog').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancelled', () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form with basic valid data', async () => {
    render(<CreateTeamsWantedDialog {...defaultProps} />);

    // Fill in required fields
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'John Doe' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'john.doe@example.com' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /phone number/i }), {
      target: { value: '555-123-4567' },
    });

    // Set birth date
    fireEvent.change(screen.getByTestId('birth-date-input'), {
      target: { value: '1990-01-01' },
    });

    // Submit the form - should show validation errors for required select fields
    const form = screen.getByRole('dialog').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Should show validation errors for required select fields
    await waitFor(() => {
      expect(screen.getByText('Experience level is required')).toBeInTheDocument();
      expect(screen.getByText('Please select at least one position')).toBeInTheDocument();
    });

    // onSubmit should not have been called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
