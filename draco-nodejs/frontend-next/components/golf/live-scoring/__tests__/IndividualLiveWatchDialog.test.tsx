import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IndividualLiveScoringState } from '@/context/IndividualLiveScoringContext';

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

type MockContextValue = {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionState: IndividualLiveScoringState | null;
  viewerCount: number;
  connect: typeof mockConnect;
  disconnect: typeof mockDisconnect;
  onScoreUpdate: ReturnType<typeof vi.fn>;
  onSessionStarted: ReturnType<typeof vi.fn>;
  onSessionFinalized: ReturnType<typeof vi.fn>;
  onSessionStopped: ReturnType<typeof vi.fn>;
  onHoleAdvanced: ReturnType<typeof vi.fn>;
};

const defaultContextValue: MockContextValue = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  sessionState: null,
  viewerCount: 0,
  connect: mockConnect,
  disconnect: mockDisconnect,
  onScoreUpdate: vi.fn(() => vi.fn()),
  onSessionStarted: vi.fn(() => vi.fn()),
  onSessionFinalized: vi.fn(() => vi.fn()),
  onSessionStopped: vi.fn(() => vi.fn()),
  onHoleAdvanced: vi.fn(() => vi.fn()),
};

let contextValue: MockContextValue = { ...defaultContextValue };

vi.mock('@/context/IndividualLiveScoringContext', () => ({
  useIndividualLiveScoring: () => contextValue,
  IndividualLiveScoringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockApiClient = {};

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApiClient,
}));

const mockGetGolfCourse = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  getGolfCourse: (...args: unknown[]) => mockGetGolfCourse(...args),
}));

vi.mock('../ScorecardTable', () => ({
  default: ({ playerScores }: { playerScores: { playerName: string }[] }) => (
    <div data-testid="scorecard-table">
      {playerScores.map((p) => (
        <span key={p.playerName}>{p.playerName}</span>
      ))}
    </div>
  ),
}));

import IndividualLiveWatchDialog from '../IndividualLiveWatchDialog';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accountId: 'account-1',
};

const mockActiveSessionState: IndividualLiveScoringState = {
  sessionId: 'session-1',
  accountId: 'account-1',
  status: 'active',
  currentHole: 5,
  holesPlayed: 18,
  courseId: 'course-1',
  courseName: 'Augusta National',
  teeId: 'tee-1',
  teeName: 'Masters',
  datePlayed: '2026-02-22',
  startedAt: '2026-02-22T10:00:00Z',
  startedBy: 'user-1',
  scores: [
    { id: 'score-1', holeNumber: 1, score: 4, enteredBy: 'user-1', enteredAt: '' },
    { id: 'score-2', holeNumber: 2, score: 3, enteredBy: 'user-1', enteredAt: '' },
  ],
};

const mockCourseData = {
  mensPar: Array(18).fill(4),
  mensHandicap: Array(18).fill(1),
};

describe('IndividualLiveWatchDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = { ...defaultContextValue };
    mockGetGolfCourse.mockResolvedValue({ data: null });
  });

  describe('rendering', () => {
    it('renders the dialog when open is true', () => {
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Watch Live')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      render(<IndividualLiveWatchDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Watch Live')).not.toBeInTheDocument();
    });

    it('shows connecting state when isConnecting is true', () => {
      contextValue = { ...defaultContextValue, isConnecting: true };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
    });

    it('shows connecting state when no sessionState and no connectionError', () => {
      contextValue = {
        ...defaultContextValue,
        isConnecting: false,
        sessionState: null,
        connectionError: null,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
    });

    it('shows LIVE chip when session status is active', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('shows Completed chip when session status is finalized', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: { ...mockActiveSessionState, status: 'finalized' },
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('shows Stopped chip when session status is stopped', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: { ...mockActiveSessionState, status: 'stopped' },
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });
  });

  describe('connection error', () => {
    it('shows connection error alert', () => {
      contextValue = {
        ...defaultContextValue,
        connectionError: 'Unable to connect',
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Unable to connect')).toBeInTheDocument();
    });

    it('shows Retry button in error alert when not connecting', () => {
      contextValue = {
        ...defaultContextValue,
        isConnecting: false,
        connectionError: 'Unable to connect',
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<IndividualLiveWatchDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /^close$/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('shows Cancel button during connecting state', () => {
      contextValue = { ...defaultContextValue, isConnecting: true };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls disconnect and onClose when Cancel is clicked during connecting', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      contextValue = { ...defaultContextValue, isConnecting: true };
      render(<IndividualLiveWatchDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockDisconnect).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('session content', () => {
    it('displays course name and tee name when session is active', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('Augusta National')).toBeInTheDocument();
      expect(screen.getByText(/masters/i)).toBeInTheDocument();
    });

    it('displays current hole when session is active', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText(/currently on hole 5/i)).toBeInTheDocument();
    });

    it('fetches course data when courseId is present', async () => {
      mockGetGolfCourse.mockResolvedValue({ data: mockCourseData });
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetGolfCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            client: mockApiClient,
            path: { accountId: 'account-1', courseId: 'course-1' },
          }),
        );
      });
    });

    it('shows viewer count when connected and viewerCount > 0', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        viewerCount: 5,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveWatchDialog {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
