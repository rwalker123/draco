import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GolfLeagueCourseType, GolfCourseWithTeesType } from '@draco/shared-schemas';

const mockSearch = vi.fn();
const mockLoading = { current: false };

vi.mock('@/hooks/useExternalCourseSearch', () => ({
  useExternalCourseSearch: () => ({
    search: mockSearch,
    getDetails: vi.fn(),
    get loading() {
      return mockLoading.current;
    },
  }),
}));

import CourseSearchDialog from '../CourseSearchDialog';

describe('CourseSearchDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSelectCourse: vi.fn().mockResolvedValue({
      success: true,
      data: {} as GolfCourseWithTeesType,
    }),
    onCreateManually: vi.fn(),
    accountId: 'account-1',
    leagueCourses: [] as GolfLeagueCourseType[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading.current = false;
    mockSearch.mockResolvedValue({
      success: true,
      data: [
        {
          externalId: 'ext-1',
          name: 'Pebble Beach Golf Links',
          city: 'Pebble Beach',
          state: 'CA',
          country: 'USA',
          numberOfHoles: 18,
        },
        {
          externalId: 'ext-2',
          name: 'Augusta National Golf Club',
          city: 'Augusta',
          state: 'GA',
          country: 'USA',
          numberOfHoles: 18,
        },
      ],
    });
  });

  describe('rendering', () => {
    it('renders dialog when open', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Find a Golf Course')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      render(<CourseSearchDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays search instructions', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(
        screen.getByText(/Search our database of 30,000\+ golf courses worldwide/),
      ).toBeInTheDocument();
    });

    it('displays search input field', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByLabelText(/search courses/i)).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Enter course or club name/i)).toBeInTheDocument();
    });

    it('displays Search button', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('displays Cancel button', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays manual create option', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByText(/Can't find your course\? Create it manually/i)).toBeInTheDocument();
    });

    it('has disabled import button initially', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /import & add to league/i })).toBeDisabled();
    });
  });

  describe('search functionality', () => {
    it('disables search button when query is too short', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeDisabled();
    });

    it('keeps search button disabled when query has only 1 character', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'a');

      expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
    });

    it('enables search button when query has 2+ characters', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'pe');

      expect(screen.getByRole('button', { name: /search/i })).not.toBeDisabled();
    });

    it('displays initial prompt when no search has been performed', () => {
      render(<CourseSearchDialog {...defaultProps} />);

      expect(
        screen.getByText(/Enter a course or club name and press Search to find courses/i),
      ).toBeInTheDocument();
    });
  });

  describe('search results', () => {
    it('displays external search results', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });
      expect(screen.getByText('Augusta National Golf Club')).toBeInTheDocument();
    });

    it('displays location info for search results', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText(/Pebble Beach, CA, USA/)).toBeInTheDocument();
      });
    });

    it('displays number of holes for search results', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/18 holes/).length).toBeGreaterThan(0);
      });
    });

    it('shows Import chip for external courses', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getAllByText('Import').length).toBeGreaterThan(0);
      });
    });
  });

  describe('custom course display', () => {
    it('shows Custom chip for courses without external ID', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            externalId: '',
            courseId: 'custom-1',
            name: 'My Custom Course',
            city: 'Test City',
            state: 'CA',
            country: 'USA',
            numberOfHoles: 18,
          },
        ],
      });
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Custom');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });
    });
  });

  describe('course selection', () => {
    it('highlights selected course', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pebble Beach Golf Links'));

      const listItem = screen.getByText('Pebble Beach Golf Links').closest('div[role="button"]');
      expect(listItem).toHaveClass('Mui-selected');
    });

    it('enables import button when course is selected', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pebble Beach Golf Links'));

      expect(screen.getByRole('button', { name: /import & add to league/i })).not.toBeDisabled();
    });

    it('changes button text when custom course is selected', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            externalId: '',
            courseId: 'custom-1',
            name: 'My Custom Course',
            city: 'Test City',
            state: 'CA',
            country: 'USA',
            numberOfHoles: 18,
          },
        ],
      });
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Custom');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('My Custom Course')).toBeInTheDocument();
      });

      await user.click(screen.getByText('My Custom Course'));

      expect(screen.getByRole('button', { name: /add to league/i })).toBeInTheDocument();
    });
  });

  describe('import course', () => {
    it('calls onSelectCourse when import button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectCourse = vi.fn().mockResolvedValue({ success: true });
      render(<CourseSearchDialog {...defaultProps} onSelectCourse={onSelectCourse} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pebble Beach Golf Links'));
      await user.click(screen.getByRole('button', { name: /import & add to league/i }));

      await waitFor(() => {
        expect(onSelectCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            externalId: 'ext-1',
            name: 'Pebble Beach Golf Links',
            isCustom: false,
          }),
        );
      });
    });

    it('closes dialog on successful import', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSelectCourse = vi.fn().mockResolvedValue({ success: true });
      render(
        <CourseSearchDialog {...defaultProps} onClose={onClose} onSelectCourse={onSelectCourse} />,
      );

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pebble Beach Golf Links'));
      await user.click(screen.getByRole('button', { name: /import & add to league/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error on import failure', async () => {
      const user = userEvent.setup();
      const onSelectCourse = vi.fn().mockResolvedValue({
        success: false,
        error: 'Import failed',
      });
      render(<CourseSearchDialog {...defaultProps} onSelectCourse={onSelectCourse} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pebble Beach Golf Links'));
      await user.click(screen.getByRole('button', { name: /import & add to league/i }));

      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
      });
    });
  });

  describe('dialog actions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CourseSearchDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close icon is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CourseSearchDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onCreateManually when create manually link is clicked', async () => {
      const user = userEvent.setup();
      const onCreateManually = vi.fn();
      render(<CourseSearchDialog {...defaultProps} onCreateManually={onCreateManually} />);

      await user.click(screen.getByText(/Create it manually/i));

      expect(onCreateManually).toHaveBeenCalled();
    });

    it('resets state when dialog closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      rerender(<CourseSearchDialog {...defaultProps} open={true} />);

      expect(screen.getByLabelText(/search courses/i)).toHaveValue('');
      expect(screen.getByText(/Enter a course or club name and press Search/i)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('triggers search when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Pebble{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Pebble Beach Golf Links')).toBeInTheDocument();
      });
    });

    it('does not trigger search on Enter when query is too short', async () => {
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'a{Enter}');

      expect(screen.queryByText('Pebble Beach Golf Links')).not.toBeInTheDocument();
    });
  });

  describe('search error handling', () => {
    it('shows error when no courses found', async () => {
      mockSearch.mockResolvedValue({ success: true, data: [] });
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'NoMatch');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText(/No courses found matching your search/i)).toBeInTheDocument();
      });
    });

    it('shows error when search fails', async () => {
      mockSearch.mockResolvedValue({ success: false, error: 'Network error' });
      const user = userEvent.setup();
      render(<CourseSearchDialog {...defaultProps} />);

      const input = screen.getByLabelText(/search courses/i);
      await user.type(input, 'Test');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
