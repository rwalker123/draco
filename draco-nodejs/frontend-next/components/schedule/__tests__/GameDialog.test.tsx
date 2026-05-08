import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateGame = vi.fn();
const mockUpdateGame = vi.fn();
const mockGetGameTeamRecipientCount = vi.fn();

vi.mock('../hooks/useGameOperations', () => ({
  useGameOperations: vi.fn(() => ({
    createGame: mockCreateGame,
    updateGame: mockUpdateGame,
    loading: false,
  })),
}));

vi.mock('@draco/shared-api-client', () => ({
  getGameTeamRecipientCount: (...args: unknown[]) => mockGetGameTeamRecipientCount(...args),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock('@/utils/apiResult', () => ({
  unwrapApiResult: vi.fn((result: { data: unknown }) => result.data),
}));

vi.mock('@/hooks/useCurrentSeason', () => ({
  useCurrentSeason: vi.fn(() => ({
    fetchCurrentSeason: vi.fn().mockResolvedValue('season-1'),
    currentSeasonId: 'season-1',
  })),
}));

vi.mock('../forms/GameFormFields', () => ({
  default: () => <div data-testid="game-form-fields" />,
}));

vi.mock('../contexts/GameFormContext', () => ({
  GameFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import GameDialog from '../dialogs/GameDialog';
import type { GameDialogProps } from '../types/sportAdapter';
import type { Game } from '@/types/schedule';
import { GameStatus, GameType } from '@/types/schedule';

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'game-1',
  gameDate: '2025-06-15T19:00:00Z',
  homeTeamId: 'team-home',
  visitorTeamId: 'team-visitor',
  homeTeamName: 'Home Team',
  visitorTeamName: 'Visitor Team',
  homeScore: 0,
  visitorScore: 0,
  comment: '',
  gameStatus: GameStatus.Scheduled,
  gameStatusText: 'Scheduled',
  gameStatusShortText: 'Sched',
  gameType: GameType.RegularSeason,
  league: { id: 'league-1', name: 'Test League' },
  season: { id: 'season-1', name: '2025 Season' },
  ...overrides,
});

const defaultLeagueTeamsCache = new Map([
  [
    'league-1',
    [
      { id: 'team-home', teamSeasonId: 'ts-home', name: 'Home Team' } as never,
      { id: 'team-visitor', teamSeasonId: 'ts-visitor', name: 'Visitor Team' } as never,
    ],
  ],
]);

const defaultCreateProps: GameDialogProps = {
  open: true,
  mode: 'create',
  accountId: 'account-1',
  seasonId: 'season-1',
  timeZone: 'UTC',
  leagues: [{ id: 'league-1', name: 'Test League' }],
  locations: [],
  leagueTeamsCache: defaultLeagueTeamsCache,
  scheduleVisible: true,
  canEditSchedule: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  onError: vi.fn(),
};

const defaultEditProps: GameDialogProps = {
  ...defaultCreateProps,
  mode: 'edit',
  selectedGame: makeGame(),
};

describe('GameDialog — email notification checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGame.mockResolvedValue({ message: 'Game created successfully', game: makeGame() });
    mockUpdateGame.mockResolvedValue({ message: 'Game updated successfully', game: makeGame() });
    mockGetGameTeamRecipientCount.mockResolvedValue({ data: { count: 4 } });
  });

  describe('default checkbox state per mode', () => {
    it('defaults checkbox to unchecked in create mode', () => {
      render(<GameDialog {...defaultCreateProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      expect(checkbox).not.toBeChecked();
    });

    it('defaults checkbox to checked in edit mode', () => {
      render(<GameDialog {...defaultEditProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe('disabled state when schedule is hidden', () => {
    it('disables the checkbox when scheduleVisible is false', () => {
      render(<GameDialog {...defaultCreateProps} scheduleVisible={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      expect(checkbox).toBeDisabled();
    });

    it('forces checkbox to unchecked when scheduleVisible is false even in edit mode', () => {
      render(<GameDialog {...defaultEditProps} scheduleVisible={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      expect(checkbox).not.toBeChecked();
    });

    it('enables the checkbox when scheduleVisible is true', () => {
      render(<GameDialog {...defaultCreateProps} scheduleVisible={true} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('save without notification (edit mode)', () => {
    it('saves directly without confirmation dialog when checkbox is unchecked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      await userEvent.click(checkbox);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGame).toHaveBeenCalledTimes(1);
      });

      const [, , notifyTeams] = mockUpdateGame.mock.calls[0];
      expect(notifyTeams).toBe(false);
      expect(mockGetGameTeamRecipientCount).not.toHaveBeenCalled();
    });

    it('saves directly without confirmation dialog when scheduleVisible is false', async () => {
      render(<GameDialog {...defaultEditProps} scheduleVisible={false} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGame).toHaveBeenCalledTimes(1);
      });

      const [, , notifyTeams] = mockUpdateGame.mock.calls[0];
      expect(notifyTeams).toBe(false);
      expect(mockGetGameTeamRecipientCount).not.toHaveBeenCalled();
    });
  });

  describe('confirmation dialog (edit mode, checkbox checked)', () => {
    it('shows confirmation dialog when checkbox is checked and save is clicked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockGetGameTeamRecipientCount).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByText(/send to approximately 4 people/i)).toBeInTheDocument();
    });

    it('does not save when confirmation cancel is clicked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/send to approximately/i)).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /^cancel$/i });
      await userEvent.click(cancelButtons[cancelButtons.length - 1]);

      expect(mockUpdateGame).not.toHaveBeenCalled();
    });

    it('saves after confirmation send is clicked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/send to approximately/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /^send$/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockUpdateGame).toHaveBeenCalledTimes(1);
      });

      const [, , notifyTeams] = mockUpdateGame.mock.calls[0];
      expect(notifyTeams).toBe(true);
    });

    it('shows singular person when recipient count is 1', async () => {
      mockGetGameTeamRecipientCount.mockResolvedValue({ data: { count: 1 } });

      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/send to approximately 1 person\?/i)).toBeInTheDocument();
      });
    });

    it('shows fallback message when recipient count cannot be fetched', async () => {
      mockGetGameTeamRecipientCount.mockRejectedValue(new Error('Network error'));

      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/send schedule update emails to both teams\?/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('notifyTeams payload flag', () => {
    it('passes notifyTeams=true to updateGame when checkbox is checked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/send to approximately/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /^send$/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockUpdateGame).toHaveBeenCalledTimes(1);
      });

      const [, , notifyTeams] = mockUpdateGame.mock.calls[0];
      expect(notifyTeams).toBe(true);
    });

    it('passes notifyTeams=false to updateGame when checkbox is unchecked', async () => {
      render(<GameDialog {...defaultEditProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /email teams about this change/i });
      await userEvent.click(checkbox);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateGame).toHaveBeenCalledTimes(1);
      });

      const [, , notifyTeams] = mockUpdateGame.mock.calls[0];
      expect(notifyTeams).toBe(false);
    });
  });
});
