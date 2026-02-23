import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getGolfMatchWithScoresMock, getGolfCourseMock, getGolfTeamWithRosterMock } = vi.hoisted(
  () => ({
    getGolfMatchWithScoresMock: vi.fn(),
    getGolfCourseMock: vi.fn(),
    getGolfTeamWithRosterMock: vi.fn(),
  }),
);

vi.mock('@draco/shared-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@draco/shared-api-client')>();
  return {
    ...actual,
    getGolfMatchWithScores: getGolfMatchWithScoresMock,
    getGolfCourse: getGolfCourseMock,
    getGolfTeamWithRoster: getGolfTeamWithRosterMock,
  };
});

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({ key: 'test-client' })),
}));

vi.mock('@/context/AccountContext', () => ({
  useAccountTimezone: vi.fn(() => 'America/Chicago'),
}));

vi.mock('@/components/golf/ScorecardTable', () => ({
  default: () => <div data-testid="scorecard-table" />,
}));

vi.mock('@/components/golf/courses/CourseScorecard', () => ({
  default: () => <div data-testid="course-scorecard" />,
}));

const defaultMatchData = {
  id: 'match-1',
  matchDateTime: '2024-06-15T10:00:00Z',
  matchStatus: 1,
  team1: { id: 'team-1', name: 'Eagles' },
  team2: { id: 'team-2', name: 'Hawks' },
  team1Scores: [],
  team2Scores: [],
  team1TotalScore: 72,
  team2TotalScore: 75,
  team1Points: 2,
  team2Points: 0,
  team1NetScore: 70,
  team2NetScore: 73,
  course: { id: 'course-1', name: 'Pebble Beach', city: 'Pebble Beach', state: 'CA' },
  tee: null,
  comment: null,
};

describe('GolfScorecardDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGolfMatchWithScoresMock.mockResolvedValue({ data: defaultMatchData });
    getGolfCourseMock.mockResolvedValue({ data: { id: 'course-1', tees: [] } });
  });

  it('does not render dialog content when open is false', async () => {
    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog
        open={false}
        onClose={vi.fn()}
        matchId="match-1"
        accountId="account-1"
      />,
    );

    expect(screen.queryByText('Scorecard')).not.toBeInTheDocument();
  });

  it('renders the dialog title when open is true', async () => {
    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog open={true} onClose={vi.fn()} matchId="match-1" accountId="account-1" />,
    );

    expect(screen.getByText('Scorecard')).toBeInTheDocument();
  });

  it('shows a loading spinner initially before data resolves', async () => {
    getGolfMatchWithScoresMock.mockImplementation(() => new Promise(() => {}));

    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog open={true} onClose={vi.fn()} matchId="match-1" accountId="account-1" />,
    );

    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog open={true} onClose={onClose} matchId="match-1" accountId="account-1" />,
    );

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays an error alert when the match fetch fails', async () => {
    getGolfMatchWithScoresMock.mockRejectedValue(new Error('Network error'));

    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog open={true} onClose={vi.fn()} matchId="match-1" accountId="account-1" />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('hides the spinner after data has loaded', async () => {
    const { default: GolfScorecardDialog } = await import('../GolfScorecardDialog');

    render(
      <GolfScorecardDialog open={true} onClose={vi.fn()} matchId="match-1" accountId="account-1" />,
    );

    await waitFor(() => {
      expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
    });
  });
});
