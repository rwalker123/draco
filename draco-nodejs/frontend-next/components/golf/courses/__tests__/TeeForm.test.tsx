import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfCourseTeeType } from '@draco/shared-schemas';
import TeeForm from '../TeeForm';

const createMockTee = (overrides: Partial<GolfCourseTeeType> = {}): GolfCourseTeeType => ({
  id: 'tee-1',
  courseId: 'course-1',
  teeName: 'Blue Tees',
  teeColor: 'blue',
  priority: 1,
  mensRating: 72.5,
  mensSlope: 130,
  womansRating: 74.5,
  womansSlope: 135,
  mensRatingFront9: 36.5,
  mensSlopeFront9: 128,
  womansRatingFront9: 37.0,
  womansSlopeFront9: 130,
  mensRatingBack9: 36.0,
  mensSlopeBack9: 132,
  womansRatingBack9: 37.5,
  womansSlopeBack9: 140,
  distances: [
    420, 380, 175, 510, 410, 395, 165, 525, 400, 430, 370, 180, 490, 420, 385, 170, 515, 395,
  ],
  ...overrides,
});

describe('TeeForm', () => {
  const defaultProps = {
    numberOfHoles: 18,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering in create mode', () => {
    it('renders empty form when no tee is provided', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByLabelText(/tee name/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /add tee/i })).toBeInTheDocument();
    });

    it('displays Tee Information section', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByText('Tee Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/tee name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('displays Course Rating & Slope section', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByText('Course Rating & Slope (18 Holes)')).toBeInTheDocument();
      expect(screen.getAllByText(/Men.*s Rating/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Men.*s Slope/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Women.*s Rating/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Women.*s Slope/).length).toBeGreaterThan(0);
    });

    it('displays 9-Hole Ratings section', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByText('9-Hole Ratings (Optional)')).toBeInTheDocument();
    });

    it('displays Hole Distances section', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByText('Hole Distances (yards)')).toBeInTheDocument();
      expect(screen.getAllByText('Front 9').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Back 9').length).toBeGreaterThan(0);
    });

    it('shows fewer sections for 9-hole courses', () => {
      const { container } = render(<TeeForm {...defaultProps} numberOfHoles={9} />);

      const front9Tables = container.querySelectorAll('table');
      expect(front9Tables.length).toBeLessThan(3);
    });
  });

  describe('rendering in edit mode', () => {
    it('populates form with tee data', () => {
      const mockTee = createMockTee();
      render(<TeeForm {...defaultProps} tee={mockTee} />);

      expect(screen.getByLabelText(/tee name/i)).toHaveValue('Blue Tees');
      expect(screen.getByLabelText(/priority/i)).toHaveValue(1);
    });

    it('displays Save Changes button in edit mode', () => {
      const mockTee = createMockTee();
      render(<TeeForm {...defaultProps} tee={mockTee} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when tee name is empty', async () => {
      const user = userEvent.setup();
      render(<TeeForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add tee/i }));

      await waitFor(() => {
        expect(screen.getByText(/tee name is required/i)).toBeInTheDocument();
      });
    });

    it('does not submit form when validation fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TeeForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: /add tee/i }));

      await waitFor(() => {
        expect(screen.getByText(/tee name is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<TeeForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom submit label', () => {
    it('displays custom submit label when provided', () => {
      render(<TeeForm {...defaultProps} submitLabel="Create Tee" />);

      expect(screen.getByRole('button', { name: /create tee/i })).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables form inputs when disabled is true', () => {
      render(<TeeForm {...defaultProps} disabled />);

      expect(screen.getByLabelText(/tee name/i)).toBeDisabled();
      expect(screen.getByLabelText(/priority/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /add tee/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('tee color selection', () => {
    it('has White as default color', () => {
      render(<TeeForm {...defaultProps} />);

      expect(screen.getByText('White')).toBeInTheDocument();
    });

    it('displays available tee colors in dropdown', async () => {
      const user = userEvent.setup();
      render(<TeeForm {...defaultProps} />);

      const colorSelect = screen.getByRole('combobox');
      await user.click(colorSelect);

      expect(screen.getByRole('option', { name: /black/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /blue/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /gold/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /red/i })).toBeInTheDocument();
    });
  });
});
