import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfLeagueCourseType } from '@draco/shared-schemas';
import CourseList from '../CourseList';

const createMockCourse = (
  overrides: Partial<GolfLeagueCourseType['course']> = {},
): GolfLeagueCourseType => ({
  accountId: 'account-1',
  course: {
    id: 'course-1',
    name: 'Test Golf Course',
    city: 'San Diego',
    state: 'CA',
    country: 'USA',
    numberOfHoles: 18,
    mensPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
    womansPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
    mensHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    womansHandicap: [1, 3, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    externalId: null,
    ...overrides,
  },
});

describe('CourseList', () => {
  const mockCourses: GolfLeagueCourseType[] = [
    createMockCourse(),
    createMockCourse({
      id: 'course-2',
      name: 'Pebble Beach',
      city: 'Pebble Beach',
      state: 'CA',
    }),
  ];

  const defaultProps = {
    courses: mockCourses,
    loading: false,
    error: null,
    onRetry: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders list of courses with names', () => {
      render(<CourseList {...defaultProps} />);

      expect(screen.getByText('Test Golf Course')).toBeInTheDocument();
      expect(screen.getByText('Pebble Beach')).toBeInTheDocument();
    });

    it('displays par and hole count for each course', () => {
      render(<CourseList {...defaultProps} />);

      expect(screen.getAllByText(/Par 72 · 18 holes/)).toHaveLength(2);
    });

    it('displays location for courses with city and state', () => {
      render(<CourseList {...defaultProps} />);

      expect(screen.getByText('San Diego, CA')).toBeInTheDocument();
      expect(screen.getByText('Pebble Beach, CA')).toBeInTheDocument();
    });

    it('handles course with only city', () => {
      const coursesWithPartialLocation = [createMockCourse({ city: 'Austin', state: null })];

      render(<CourseList {...defaultProps} courses={coursesWithPartialLocation} />);

      expect(screen.getByText('Austin')).toBeInTheDocument();
    });

    it('handles course with only state', () => {
      const coursesWithPartialLocation = [createMockCourse({ city: null, state: 'TX' })];

      render(<CourseList {...defaultProps} courses={coursesWithPartialLocation} />);

      expect(screen.getByText('TX')).toBeInTheDocument();
    });

    it('does not display location when city and state are null', () => {
      const coursesWithNoLocation = [createMockCourse({ city: null, state: null })];

      render(<CourseList {...defaultProps} courses={coursesWithNoLocation} />);

      expect(screen.getByText('Test Golf Course')).toBeInTheDocument();
      expect(screen.queryByText('San Diego, CA')).not.toBeInTheDocument();
    });

    it('calculates par correctly for 9-hole course', () => {
      const nineHoleCourses = [
        createMockCourse({
          numberOfHoles: 9,
          mensPar: [4, 4, 3, 5, 4, 4, 3, 5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
      ];

      render(<CourseList {...defaultProps} courses={nineHoleCourses} />);

      expect(screen.getByText('Par 36 · 9 holes')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('displays skeleton loaders when loading', () => {
      render(<CourseList {...defaultProps} loading={true} />);

      expect(screen.queryByText('Test Golf Course')).not.toBeInTheDocument();
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render course list when loading', () => {
      render(<CourseList {...defaultProps} loading={true} />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message when error is provided', () => {
      render(<CourseList {...defaultProps} error="Failed to load courses" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load courses');
    });

    it('displays retry button when onRetry is provided', () => {
      render(<CourseList {...defaultProps} error="Failed to load courses" />);

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<CourseList {...defaultProps} error="Failed to load courses" onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not display retry button when onRetry is not provided', () => {
      render(<CourseList {...defaultProps} error="Failed to load courses" onRetry={undefined} />);

      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('does not display course list when error is present', () => {
      render(<CourseList {...defaultProps} error="Failed to load courses" />);

      expect(screen.queryByText('Test Golf Course')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('displays default empty message when courses array is empty', () => {
      render(<CourseList {...defaultProps} courses={[]} />);

      expect(screen.getByText('No courses available.')).toBeInTheDocument();
    });

    it('displays custom empty message when provided', () => {
      render(
        <CourseList
          {...defaultProps}
          courses={[]}
          emptyMessage="No courses have been added yet."
        />,
      );

      expect(screen.getByText('No courses have been added yet.')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    const getViewButtons = () =>
      screen.getAllByTestId('VisibilityIcon').map((icon) => icon.closest('button')!);
    const getEditButtons = () =>
      screen.getAllByTestId('EditIcon').map((icon) => icon.closest('button')!);
    const getDeleteButtons = () =>
      screen.getAllByTestId('DeleteIcon').map((icon) => icon.closest('button')!);

    it('renders view button when onView is provided', () => {
      render(<CourseList {...defaultProps} />);

      expect(getViewButtons()).toHaveLength(2);
    });

    it('does not render view button when onView is not provided', () => {
      render(<CourseList {...defaultProps} onView={undefined} />);

      expect(screen.queryByTestId('VisibilityIcon')).not.toBeInTheDocument();
    });

    it('calls onView with correct course when view button is clicked', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();

      render(<CourseList {...defaultProps} onView={onView} />);

      const viewButtons = getViewButtons();
      await user.click(viewButtons[0]);

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onView).toHaveBeenCalledWith(mockCourses[0]);
    });

    it('renders edit button when onEdit is provided', () => {
      render(<CourseList {...defaultProps} />);

      expect(getEditButtons()).toHaveLength(2);
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<CourseList {...defaultProps} onEdit={undefined} />);

      expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
    });

    it('calls onEdit with correct course when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<CourseList {...defaultProps} onEdit={onEdit} />);

      const editButtons = getEditButtons();
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockCourses[0]);
    });

    it('renders delete button when onDelete is provided', () => {
      render(<CourseList {...defaultProps} />);

      expect(getDeleteButtons()).toHaveLength(2);
    });

    it('does not render delete button when onDelete is not provided', () => {
      render(<CourseList {...defaultProps} onDelete={undefined} />);

      expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });

    it('disables all action buttons when actionsDisabled is true', () => {
      render(<CourseList {...defaultProps} actionsDisabled={true} />);

      const viewButtons = getViewButtons();
      const editButtons = getEditButtons();
      const deleteButtons = getDeleteButtons();

      viewButtons.forEach((button) => expect(button).toBeDisabled());
      editButtons.forEach((button) => expect(button).toBeDisabled());
      deleteButtons.forEach((button) => expect(button).toBeDisabled());
    });
  });

  describe('delete confirmation dialog', () => {
    const getDeleteButtons = () =>
      screen.getAllByTestId('DeleteIcon').map((icon) => icon.closest('button')!);

    it('opens confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<CourseList {...defaultProps} />);

      const deleteButtons = getDeleteButtons();
      await user.click(deleteButtons[0]);

      expect(
        screen.getByRole('heading', { name: 'Remove Course from League' }),
      ).toBeInTheDocument();
    });

    it('displays course name in confirmation dialog', async () => {
      const user = userEvent.setup();

      render(<CourseList {...defaultProps} />);

      const deleteButtons = getDeleteButtons();
      await user.click(deleteButtons[0]);

      expect(
        screen.getByText(/Are you sure you want to remove "Test Golf Course"/),
      ).toBeInTheDocument();
    });

    it('calls onDelete when confirmation is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<CourseList {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = getDeleteButtons();
      await user.click(deleteButtons[0]);

      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: 'Remove' });
      await user.click(confirmButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockCourses[0]);
    });

    it('closes dialog without calling onDelete when cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<CourseList {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = getDeleteButtons();
      await user.click(deleteButtons[0]);

      const dialog = screen.getByRole('dialog');
      const cancelButton = within(dialog).getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(onDelete).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes dialog after confirming delete', async () => {
      const user = userEvent.setup();

      render(<CourseList {...defaultProps} />);

      const deleteButtons = getDeleteButtons();
      await user.click(deleteButtons[0]);

      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: 'Remove' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
