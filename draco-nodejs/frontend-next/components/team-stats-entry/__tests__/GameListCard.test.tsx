import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TeamCompletedGameType } from '@draco/shared-schemas';

import GameListCard, { type SortOrder } from '../GameListCard';

const buildGame = (overrides: Partial<TeamCompletedGameType> = {}): TeamCompletedGameType =>
  ({
    gameId: 'game-1',
    gameDate: '2024-01-01T18:00:00Z',
    homeScore: 5,
    visitorScore: 3,
    isHomeTeam: true,
    opponentTeamName: 'Opponents',
    ...overrides,
  }) as TeamCompletedGameType;

describe('GameListCard', () => {
  it('renders completed games and allows selection', () => {
    const onSelect = vi.fn();
    const games = [buildGame(), buildGame({ gameId: 'game-2', opponentTeamName: 'Rivals' })];

    render(
      <GameListCard
        games={games}
        selectedGameId="game-1"
        onSelectGame={onSelect}
        sortOrder={'desc' satisfies SortOrder}
        onSortOrderChange={() => {}}
        loading={false}
        error={null}
        canManageStats={false}
      />,
    );

    expect(screen.getByText(/Opponents/i)).toBeInTheDocument();
    expect(screen.getByText(/Rivals/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: /Select game/i });
    fireEvent.click(buttons[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no games are provided', () => {
    render(
      <GameListCard
        games={[]}
        selectedGameId={null}
        onSelectGame={() => {}}
        sortOrder={'desc' satisfies SortOrder}
        onSortOrderChange={() => {}}
        loading={false}
        error={null}
        canManageStats={false}
      />,
    );

    expect(screen.getByText('No completed games are available yet.')).toBeInTheDocument();
  });
});
