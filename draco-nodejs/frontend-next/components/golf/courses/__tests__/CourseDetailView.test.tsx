import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfCourseWithTeesType, GolfCourseTeeType } from '@draco/shared-schemas';
import CourseDetailView from '../CourseDetailView';

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
  distances: [
    420, 380, 175, 510, 410, 395, 165, 525, 400, 430, 370, 180, 490, 420, 385, 170, 515, 395,
  ],
  ...overrides,
});

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
  tees: [createMockTee()],
  ...overrides,
});

describe('CourseDetailView', () => {
  const defaultProps = {
    course: createMockCourse(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the course scorecard', () => {
      render(<CourseDetailView {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Test Golf Course' })).toBeInTheDocument();
    });

    it('renders within a Paper container', () => {
      const { container } = render(<CourseDetailView {...defaultProps} />);

      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
    });

    it('does not render edit controls when editMode is false', () => {
      render(<CourseDetailView {...defaultProps} editMode={false} onSave={vi.fn()} />);

      expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset Changes' })).not.toBeInTheDocument();
    });

    it('does not render edit controls when editMode is true but onSave is not provided', () => {
      render(<CourseDetailView {...defaultProps} editMode={true} />);

      expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset Changes' })).not.toBeInTheDocument();
    });

    it('renders edit controls when editMode is true and onSave is provided', () => {
      render(<CourseDetailView {...defaultProps} editMode={true} onSave={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset Changes' })).toBeInTheDocument();
    });

    it('displays tee ratings section', () => {
      render(<CourseDetailView {...defaultProps} />);

      expect(screen.getByText('Tee Ratings & Slopes')).toBeInTheDocument();
    });

    it('displays scorecard section', () => {
      render(<CourseDetailView {...defaultProps} />);

      expect(screen.getByText('Scorecard')).toBeInTheDocument();
    });
  });

  describe('edit mode button states', () => {
    it('save button is disabled when there are no changes', () => {
      render(<CourseDetailView {...defaultProps} editMode={true} onSave={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });

    it('reset button is disabled when there are no changes', () => {
      render(<CourseDetailView {...defaultProps} editMode={true} onSave={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Reset Changes' })).toBeDisabled();
    });
  });

  describe('course prop update', () => {
    it('updates displayed course when course prop changes', () => {
      const { rerender } = render(<CourseDetailView {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Test Golf Course' })).toBeInTheDocument();

      const updatedCourse = createMockCourse({ name: 'Updated Course Name' });
      rerender(<CourseDetailView course={updatedCourse} />);

      expect(screen.getByRole('heading', { name: 'Updated Course Name' })).toBeInTheDocument();
    });
  });

  describe('save behavior', () => {
    it('calls onSave with correct data when save button is clicked after field change', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={onSave} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'Updated Course');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Course',
        }),
      );
    });

    it('save button shows saving state while onSave is in progress', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const onSave = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={onSave} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'Saving Course');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving/i })).toBeInTheDocument();
      });

      resolvePromise!();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });
    });

    it('does not call onSave when there are no changes', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(<CourseDetailView {...defaultProps} editMode={true} onSave={onSave} />);

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('resets hasChanges state after successful save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={onSave} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'New Name');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
      });
    });
  });

  describe('reset behavior', () => {
    it('enables reset button after making changes', async () => {
      const user = userEvent.setup();
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={vi.fn()} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'Modified');

      expect(screen.getByRole('button', { name: 'Reset Changes' })).not.toBeDisabled();
    });

    it('resets form to original values when reset button is clicked', async () => {
      const user = userEvent.setup();
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={vi.fn()} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'Temporary Name');

      await user.click(screen.getByRole('button', { name: 'Reset Changes' }));

      expect(screen.getByDisplayValue('Test Golf Course')).toBeInTheDocument();
    });

    it('disables reset button after resetting', async () => {
      const user = userEvent.setup();
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={vi.fn()} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'Changed');

      await user.click(screen.getByRole('button', { name: 'Reset Changes' }));

      expect(screen.getByRole('button', { name: 'Reset Changes' })).toBeDisabled();
    });
  });

  describe('showEditControls prop', () => {
    it('does not render edit/delete tee buttons when showEditControls is false', () => {
      render(
        <CourseDetailView
          {...defaultProps}
          showEditControls={false}
          onEditTee={vi.fn()}
          onDeleteTee={vi.fn()}
        />,
      );

      expect(screen.queryByRole('button', { name: /Edit Blue Tees/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete Blue Tees/ })).not.toBeInTheDocument();
    });

    it('renders edit tee button when showEditControls is true and onEditTee is provided', () => {
      render(
        <CourseDetailView
          {...defaultProps}
          showEditControls={true}
          onEditTee={vi.fn()}
          onDeleteTee={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Edit Blue Tees' })).toBeInTheDocument();
    });

    it('renders delete tee button when showEditControls is true and onDeleteTee is provided', () => {
      render(
        <CourseDetailView
          {...defaultProps}
          showEditControls={true}
          onEditTee={vi.fn()}
          onDeleteTee={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Delete Blue Tees' })).toBeInTheDocument();
    });

    it('calls onEditTee with correct tee when edit tee button is clicked', async () => {
      const user = userEvent.setup();
      const onEditTee = vi.fn();
      const tee = createMockTee();
      const course = createMockCourse({ tees: [tee] });

      render(
        <CourseDetailView
          course={course}
          showEditControls={true}
          onEditTee={onEditTee}
          onDeleteTee={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Edit Blue Tees' }));

      expect(onEditTee).toHaveBeenCalledTimes(1);
      expect(onEditTee).toHaveBeenCalledWith(tee);
    });

    it('calls onDeleteTee with correct tee when delete tee button is clicked', async () => {
      const user = userEvent.setup();
      const onDeleteTee = vi.fn();
      const tee = createMockTee();
      const course = createMockCourse({ tees: [tee] });

      render(
        <CourseDetailView
          course={course}
          showEditControls={true}
          onEditTee={vi.fn()}
          onDeleteTee={onDeleteTee}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Delete Blue Tees' }));

      expect(onDeleteTee).toHaveBeenCalledTimes(1);
      expect(onDeleteTee).toHaveBeenCalledWith(tee);
    });
  });

  describe('onSave payload', () => {
    it('includes all expected fields in onSave payload', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const course = createMockCourse();

      render(<CourseDetailView course={course} editMode={true} onSave={onSave} />);

      const courseNameInput = screen.getByDisplayValue('Test Golf Course');
      await user.clear(courseNameInput);
      await user.type(courseNameInput, 'My Course');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            mensPar: expect.any(Array),
            womansPar: expect.any(Array),
            mensHandicap: expect.any(Array),
            womansHandicap: expect.any(Array),
          }),
        );
      });
    });
  });
});
