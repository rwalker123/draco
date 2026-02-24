import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockGetGolfCourse } = vi.hoisted(() => ({
  mockGetGolfCourse: vi.fn(),
}));

const mockGetCourse = vi.fn();
const mockCreateScore = vi.fn();
const mockUpdateScore = vi.fn();

vi.mock('@draco/shared-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@draco/shared-api-client')>();
  return {
    ...actual,
    getGolfCourse: mockGetGolfCourse,
  };
});

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({ key: 'test-client' })),
}));

vi.mock('@/hooks/useGolfCourses', () => ({
  useGolfCourses: () => ({
    getCourse: mockGetCourse,
  }),
}));

vi.mock('@/hooks/useIndividualGolfAccountService', () => ({
  useIndividualGolfAccountService: () => ({
    createScore: mockCreateScore,
    updateScore: mockUpdateScore,
  }),
}));

vi.mock('@/components/schedule/dialogs/golf-score-entry/HoleScoreGrid', () => ({
  HoleScoreGrid: ({
    numberOfHoles,
    onChange,
  }: {
    numberOfHoles: number;
    onChange: (scores: number[]) => void;
  }) => (
    <div data-testid="hole-score-grid" data-holes={numberOfHoles}>
      <button onClick={() => onChange(Array(numberOfHoles).fill(4))}>Fill Scores</button>
    </div>
  ),
}));

vi.mock('@/components/golf/dialogs/CourseSearchDialog', () => ({
  CourseSearchDialog: ({
    open,
    onSelectCourse,
    onClose,
  }: {
    open: boolean;
    onSelectCourse: (courseId: string) => Promise<{ success: boolean }>;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="course-search-dialog">
        <button onClick={() => onSelectCourse('course-99')}>Select Test Course</button>
        <button onClick={onClose}>Close Search</button>
      </div>
    ) : null,
}));

import { IndividualRoundEntryDialog } from '../IndividualRoundEntryDialog';
import type { IndividualRoundEntryDialogProps } from '../IndividualRoundEntryDialog';

const defaultProps: IndividualRoundEntryDialogProps = {
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  onError: vi.fn(),
  accountId: 'account-1',
};

const mockCourseData = {
  id: 'course-1',
  name: 'Pebble Beach',
  tees: [
    { id: 'tee-1', teeName: 'Blue' },
    { id: 'tee-2', teeName: 'White' },
  ],
};

const mockCourseResult = {
  success: true as const,
  data: mockCourseData,
  message: 'OK',
};

const mockApiCourseResult = {
  data: mockCourseData,
};

describe('IndividualRoundEntryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCourse.mockResolvedValue(mockCourseResult);
    mockGetGolfCourse.mockResolvedValue(mockApiCourseResult);
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Enter a Round')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders Edit Round title when editScore is provided', () => {
      const editScore = {
        id: 'score-1',
        courseId: 'course-1',
        golferId: 'golfer-1',
        teeId: 'tee-1',
        datePlayed: '2026-02-22T00:00:00Z',
        holesPlayed: 18,
        totalsOnly: true,
        totalScore: 90,
        holeScores: [] as number[],
      };
      render(<IndividualRoundEntryDialog {...defaultProps} editScore={editScore} />);

      expect(screen.getByText('Edit Round')).toBeInTheDocument();
    });

    it('renders date played field', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByLabelText(/date played/i)).toBeInTheDocument();
    });

    it('renders holes played toggle buttons', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /9 holes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /18 holes/i })).toBeInTheDocument();
    });

    it('renders total score field by default (totals only mode)', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByLabelText(/total score/i)).toBeInTheDocument();
    });

    it('renders course selection area', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByText('No course selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select course/i })).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<IndividualRoundEntryDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close icon button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<IndividualRoundEntryDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('save button enabled/disabled logic', () => {
    it('Save Round button is disabled when no course is selected', () => {
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save round/i })).toBeDisabled();
    });

    it('Save Round button is disabled when total score is missing', async () => {
      mockGetCourse.mockResolvedValue(mockCourseResult);
      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /save round/i })).toBeDisabled();
    });

    it('Save Round button is enabled when course, tee and valid score are provided', async () => {
      const user = userEvent.setup();
      mockGetCourse.mockResolvedValue(mockCourseResult);
      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const totalScoreInput = screen.getByLabelText(/total score/i);
      await user.clear(totalScoreInput);
      await user.type(totalScoreInput, '90');

      expect(screen.getByRole('button', { name: /save round/i })).not.toBeDisabled();
    });

    it('Save Round button is disabled when total score is below minimum (18)', async () => {
      const user = userEvent.setup();
      mockGetCourse.mockResolvedValue(mockCourseResult);
      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const totalScoreInput = screen.getByLabelText(/total score/i);
      await user.clear(totalScoreInput);
      await user.type(totalScoreInput, '10');

      expect(screen.getByRole('button', { name: /save round/i })).toBeDisabled();
    });
  });

  describe('holes toggle', () => {
    it('switches to hole-by-hole entry when toggle is checked', async () => {
      const user = userEvent.setup();
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      const toggle = screen.getByText('Enter hole-by-hole scores');
      await user.click(toggle);

      expect(screen.getByTestId('hole-score-grid')).toBeInTheDocument();
      expect(screen.queryByLabelText(/total score/i)).not.toBeInTheDocument();
    });

    it('switches back to total score entry when toggle is unchecked', async () => {
      const user = userEvent.setup();
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      const toggle = screen.getByText('Enter hole-by-hole scores');
      await user.click(toggle);
      await user.click(toggle);

      expect(screen.getByLabelText(/total score/i)).toBeInTheDocument();
      expect(screen.queryByTestId('hole-score-grid')).not.toBeInTheDocument();
    });

    it('renders HoleScoreGrid with 9 holes when 9 is selected', async () => {
      const user = userEvent.setup();
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /9 holes/i }));

      const toggle = screen.getByText('Enter hole-by-hole scores');
      await user.click(toggle);

      expect(screen.getByTestId('hole-score-grid')).toHaveAttribute('data-holes', '9');
    });
  });

  describe('course loading', () => {
    it('shows loading spinner when loading course data', async () => {
      let resolve: (value: typeof mockApiCourseResult) => void;
      const pendingPromise = new Promise<typeof mockApiCourseResult>((res) => {
        resolve = res;
      });
      mockGetGolfCourse.mockReturnValue(pendingPromise);

      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      resolve!(mockApiCourseResult);
    });

    it('loads and displays home course tees on open', async () => {
      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach')).toBeInTheDocument();
      });

      expect(screen.getByText('Blue')).toBeInTheDocument();
    });

    it('opens course search dialog when Select Course is clicked', async () => {
      const user = userEvent.setup();
      render(<IndividualRoundEntryDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /select course/i }));

      expect(screen.getByTestId('course-search-dialog')).toBeInTheDocument();
    });
  });

  describe('save operation', () => {
    it('calls createScore and onSuccess on successful save', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const savedScore = { id: 'score-new', totalScore: 90 };
      mockCreateScore.mockResolvedValue({ success: true, data: savedScore });
      mockGetCourse.mockResolvedValue(mockCourseResult);

      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
          onSuccess={onSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const totalScoreInput = screen.getByLabelText(/total score/i);
      await user.type(totalScoreInput, '90');
      await user.click(screen.getByRole('button', { name: /save round/i }));

      await waitFor(() => {
        expect(mockCreateScore).toHaveBeenCalledWith(
          'account-1',
          expect.objectContaining({
            courseId: 'course-1',
            teeId: 'tee-1',
            totalScore: 90,
            holesPlayed: 18,
            totalsOnly: true,
          }),
        );
        expect(onSuccess).toHaveBeenCalledWith(savedScore);
      });
    });

    it('shows error when save fails', async () => {
      const user = userEvent.setup();
      mockCreateScore.mockResolvedValue({ success: false, error: 'Server error' });
      mockGetCourse.mockResolvedValue(mockCourseResult);

      render(
        <IndividualRoundEntryDialog
          {...defaultProps}
          homeCourse={{ id: 'course-1', name: 'Pebble Beach' }}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const totalScoreInput = screen.getByLabelText(/total score/i);
      await user.type(totalScoreInput, '90');
      await user.click(screen.getByRole('button', { name: /save round/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });
});
