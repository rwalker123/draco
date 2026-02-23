import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IndividualLiveScoringState } from '@/context/IndividualLiveScoringContext';

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSubmitScore = vi.fn();
const mockAdvanceHole = vi.fn();
const mockFinalizeSession = vi.fn();
const mockStopSession = vi.fn();
const mockClearError = vi.fn();

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

type MockOperationsValue = {
  isLoading: boolean;
  error: string | null;
  submitScore: typeof mockSubmitScore;
  advanceHole: typeof mockAdvanceHole;
  finalizeSession: typeof mockFinalizeSession;
  stopSession: typeof mockStopSession;
  clearError: typeof mockClearError;
  checkSessionStatus: ReturnType<typeof vi.fn>;
  getSessionState: ReturnType<typeof vi.fn>;
  startSession: ReturnType<typeof vi.fn>;
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

const defaultOperationsValue: MockOperationsValue = {
  isLoading: false,
  error: null,
  submitScore: mockSubmitScore,
  advanceHole: mockAdvanceHole,
  finalizeSession: mockFinalizeSession,
  stopSession: mockStopSession,
  clearError: mockClearError,
  checkSessionStatus: vi.fn(),
  getSessionState: vi.fn(),
  startSession: vi.fn(),
};

let operationsValue: MockOperationsValue = { ...defaultOperationsValue };

vi.mock('@/hooks/useIndividualLiveScoringOperations', () => ({
  useIndividualLiveScoringOperations: () => operationsValue,
}));

import IndividualLiveScoringDialog from '../IndividualLiveScoringDialog';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accountId: 'account-1',
  hasActiveSession: false,
  onSessionEnded: vi.fn(),
};

const mockActiveSessionState: IndividualLiveScoringState = {
  sessionId: 'session-1',
  accountId: 'account-1',
  status: 'active',
  currentHole: 1,
  holesPlayed: 18,
  courseId: 'course-1',
  courseName: 'Pebble Beach',
  teeId: 'tee-1',
  teeName: 'Blue',
  datePlayed: '2026-02-22',
  startedAt: '2026-02-22T10:00:00Z',
  startedBy: 'user-1',
  scores: [],
};

describe('IndividualLiveScoringDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = { ...defaultContextValue };
    operationsValue = { ...defaultOperationsValue };
  });

  describe('rendering', () => {
    it('renders the dialog when open is true', () => {
      render(<IndividualLiveScoringDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Live Scoring')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      render(<IndividualLiveScoringDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Live Scoring')).not.toBeInTheDocument();
    });

    it('shows connecting state when isConnecting is true', () => {
      contextValue = { ...defaultContextValue, isConnecting: true };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
    });

    it('shows connecting state when hasActiveSession with no sessionState and no error', () => {
      contextValue = {
        ...defaultContextValue,
        isConnecting: false,
        sessionState: null,
        connectionError: null,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
    });

    it('shows LIVE chip when session status is active', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('shows connection error alert', () => {
      contextValue = {
        ...defaultContextValue,
        connectionError: 'Connection failed',
      };
      render(<IndividualLiveScoringDialog {...defaultProps} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('shows operation error alert', () => {
      operationsValue = { ...defaultOperationsValue, error: 'Score submission failed' };
      render(<IndividualLiveScoringDialog {...defaultProps} />);

      expect(screen.getByText('Score submission failed')).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<IndividualLiveScoringDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X icon button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<IndividualLiveScoringDialog {...defaultProps} onClose={onClose} />);

      const closeIconButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('svg[data-testid="CloseIcon"]'));
      if (closeIconButton) {
        await user.click(closeIconButton);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('session actions', () => {
    it('shows Stop Round and Save Round buttons when session is active', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByRole('button', { name: /stop round/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save round/i })).toBeInTheDocument();
    });

    it('shows Stop Round button when hasActiveSession is true but session not yet finalized', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: false,
        sessionState: null,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByRole('button', { name: /stop round/i })).toBeInTheDocument();
    });

    it('opens confirmation dialog when Stop Round is clicked', async () => {
      const user = userEvent.setup();
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      await user.click(screen.getByRole('button', { name: /stop round/i }));

      expect(
        screen.getByText(
          'Are you sure you want to stop this round? Your scores will NOT be saved.',
        ),
      ).toBeInTheDocument();
    });

    it('opens confirmation dialog when Save Round is clicked', async () => {
      const user = userEvent.setup();
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      await user.click(screen.getByRole('button', { name: /save round/i }));

      expect(screen.getByText('Finalize Round')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to finalize this round? This will save your scores permanently.',
        ),
      ).toBeInTheDocument();
    });

    it('calls stopSession and onSessionEnded when stop is confirmed', async () => {
      const user = userEvent.setup();
      const onSessionEnded = vi.fn();
      const onClose = vi.fn();
      mockStopSession.mockResolvedValue(true);
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(
        <IndividualLiveScoringDialog
          {...defaultProps}
          hasActiveSession
          onSessionEnded={onSessionEnded}
          onClose={onClose}
        />,
      );

      const stopButtons = screen.getAllByRole('button', { name: /stop round/i });
      await user.click(stopButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Are you sure you want to stop this round? Your scores will NOT be saved.',
          ),
        ).toBeInTheDocument();
      });

      const allStopButtons = screen.getAllByRole('button', { name: /stop round/i });
      const confirmButton = allStopButtons[allStopButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockStopSession).toHaveBeenCalledWith('account-1');
        expect(onSessionEnded).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('score selection', () => {
    it('renders score buttons when session state is present', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('Select Score')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '12' })).toBeInTheDocument();
    });

    it('displays course name and tee name when session state is present', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('Pebble Beach - Blue')).toBeInTheDocument();
    });

    it('shows viewer count chip when connected and viewerCount > 0', () => {
      contextValue = {
        ...defaultContextValue,
        isConnected: true,
        viewerCount: 15,
        sessionState: mockActiveSessionState,
      };
      render(<IndividualLiveScoringDialog {...defaultProps} hasActiveSession />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
