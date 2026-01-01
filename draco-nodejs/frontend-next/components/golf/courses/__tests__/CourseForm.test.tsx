import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfCourseWithTeesType } from '@draco/shared-schemas';
import CourseForm from '../CourseForm';

vi.mock('../ImportCourseDialog', () => ({
  default: vi.fn(({ open, onClose }) =>
    open ? (
      <div data-testid="import-dialog">
        <button onClick={onClose}>Close Import Dialog</button>
      </div>
    ) : null,
  ),
}));

const createMockCourse = (
  overrides: Partial<GolfCourseWithTeesType> = {},
): GolfCourseWithTeesType => ({
  id: 'course-1',
  name: 'Test Golf Course',
  designer: 'Robert Trent Jones',
  yearBuilt: 1960,
  numberOfHoles: 18,
  address: '123 Fairway Dr',
  city: 'San Diego',
  state: 'CA',
  zip: '92101',
  country: 'USA',
  mensPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  womansPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
  mensHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
  womansHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
  externalId: null,
  tees: [],
  ...overrides,
});

describe('CourseForm', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering in create mode', () => {
    it('renders empty form when no course is provided', () => {
      render(<CourseForm {...defaultProps} />);

      expect(screen.getByLabelText(/course name/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
    });

    it('displays Course Information section', () => {
      render(<CourseForm {...defaultProps} />);

      expect(screen.getByText('Course Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/course name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/designer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year built/i)).toBeInTheDocument();
    });

    it('displays Location section', () => {
      render(<CourseForm {...defaultProps} />);

      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
    });

    it('displays Par & Handicap section with Front 9 table', () => {
      render(<CourseForm {...defaultProps} />);

      expect(screen.getByText('Par & Handicap by Hole')).toBeInTheDocument();
      expect(screen.getByText('Front 9')).toBeInTheDocument();
      expect(screen.getByText('Back 9')).toBeInTheDocument();
    });

    it('shows import button when showImportButton is true and accountId provided', () => {
      render(<CourseForm {...defaultProps} showImportButton accountId="test-account" />);

      expect(screen.getByRole('button', { name: /search & import/i })).toBeInTheDocument();
    });

    it('does not show import button when showImportButton is false', () => {
      render(<CourseForm {...defaultProps} showImportButton={false} accountId="test-account" />);

      expect(screen.queryByRole('button', { name: /search & import/i })).not.toBeInTheDocument();
    });

    it('does not show import button when accountId is not provided', () => {
      render(<CourseForm {...defaultProps} showImportButton />);

      expect(screen.queryByRole('button', { name: /search & import/i })).not.toBeInTheDocument();
    });
  });

  describe('rendering in edit mode', () => {
    it('populates form with course data', () => {
      const mockCourse = createMockCourse();
      render(<CourseForm {...defaultProps} course={mockCourse} />);

      expect(screen.getByLabelText(/course name/i)).toHaveValue('Test Golf Course');
      expect(screen.getByLabelText(/designer/i)).toHaveValue('Robert Trent Jones');
      expect(screen.getByLabelText(/year built/i)).toHaveValue(1960);
      expect(screen.getByLabelText(/^address$/i)).toHaveValue('123 Fairway Dr');
      expect(screen.getByLabelText(/city/i)).toHaveValue('San Diego');
      expect(screen.getByLabelText(/state/i)).toHaveValue('CA');
    });

    it('displays Save Changes button in edit mode', () => {
      const mockCourse = createMockCourse();
      render(<CourseForm {...defaultProps} course={mockCourse} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('does not show import button in edit mode', () => {
      const mockCourse = createMockCourse();
      render(
        <CourseForm
          {...defaultProps}
          course={mockCourse}
          showImportButton
          accountId="test-account"
        />,
      );

      expect(screen.queryByRole('button', { name: /search & import/i })).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when course name is empty', async () => {
      const user = userEvent.setup();
      render(<CourseForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        expect(screen.getByText(/course name is required/i)).toBeInTheDocument();
      });
    });

    it('does not submit form when validation fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CourseForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        expect(screen.getByText(/course name is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CourseForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/course name/i), 'New Golf Course');
      await user.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.name).toBe('New Golf Course');
      expect(submittedData.numberOfHoles).toBe(18);
      expect(submittedData.mensPar).toHaveLength(18);
    });

    it('displays error alert when submission fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<CourseForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/course name/i), 'New Golf Course');
      await user.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });

    it('displays generic error when non-Error is thrown', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue('Unknown error');
      render(<CourseForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/course name/i), 'New Golf Course');
      await user.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to save course');
      });
    });
  });

  describe('cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<CourseForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom submit label', () => {
    it('displays custom submit label when provided', () => {
      render(<CourseForm {...defaultProps} submitLabel="Add Course" />);

      expect(screen.getByRole('button', { name: /add course/i })).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables form inputs when disabled is true', () => {
      render(<CourseForm {...defaultProps} disabled />);

      expect(screen.getByLabelText(/course name/i)).toBeDisabled();
      expect(screen.getByLabelText(/designer/i)).toBeDisabled();
      expect(screen.getByLabelText(/year built/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /create course/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('9-hole course', () => {
    it('shows only Front 9 table when 9 holes is selected', async () => {
      const user = userEvent.setup();
      render(<CourseForm {...defaultProps} />);

      const holesSelect = screen.getByRole('combobox');
      await user.click(holesSelect);
      await user.click(screen.getByRole('option', { name: '9 Holes' }));

      expect(screen.getByText('Front 9')).toBeInTheDocument();
      expect(screen.queryByText('Back 9')).not.toBeInTheDocument();
    });
  });

  describe('import dialog', () => {
    it('opens import dialog when Search & Import button is clicked', async () => {
      const user = userEvent.setup();
      render(<CourseForm {...defaultProps} showImportButton accountId="test-account" />);

      expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /search & import/i }));

      expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
    });
  });
});
