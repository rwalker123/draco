import React from 'react';
import { render, screen } from '@testing-library/react';
import GameListDisplay, { GameListSection, Game } from '../GameListDisplay';
import { GameStatus } from '../../types/schedule';

// Mock the gameUtils module
jest.mock('../../utils/gameUtils', () => ({
  getGameStatusShortText: jest.fn((status: number) => {
    const statusMap: Record<number, string> = {
      0: 'Scheduled',
      1: 'Final',
      2: 'Cancelled',
      3: 'Postponed',
      4: 'In Progress',
      5: 'Suspended',
    };
    return statusMap[status] || 'Unknown';
  }),
}));

const mockGame: Game = {
  id: '1',
  date: '2024-01-15T18:00:00Z',
  homeTeamId: 'home1',
  awayTeamId: 'away1',
  homeTeamName: 'Home Team',
  awayTeamName: 'Away Team',
  homeScore: 5,
  awayScore: 3,
  gameStatus: GameStatus.Completed,
  gameStatusText: 'Final',
  leagueName: 'Test League',
  fieldId: null,
  fieldName: null,
  fieldShortName: null,
  hasGameRecap: false,
  gameRecaps: [],
};

const mockSections: GameListSection[] = [
  {
    title: 'Test Section',
    games: [mockGame],
  },
];

describe('GameListDisplay', () => {
  it('renders with vertical layout by default', () => {
    render(<GameListDisplay sections={mockSections} />);

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders with horizontal layout when specified', () => {
    render(<GameListDisplay sections={mockSections} layout="horizontal" />);

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders empty message when no games', () => {
    const emptySections: GameListSection[] = [
      {
        title: 'Empty Section',
        games: [],
      },
    ];

    render(<GameListDisplay sections={emptySections} emptyMessage="No games found" />);

    expect(screen.getByText('Empty Section')).toBeInTheDocument();
    expect(screen.getByText('No games found')).toBeInTheDocument();
  });

  it('renders scheduled game with time and field', () => {
    const scheduledGame: Game = {
      ...mockGame,
      gameStatus: GameStatus.Scheduled,
      gameStatusText: 'Scheduled',
      fieldName: 'Test Field',
      fieldShortName: 'TF',
    };

    const scheduledSections: GameListSection[] = [
      {
        title: 'Scheduled Games',
        games: [scheduledGame],
      },
    ];

    render(<GameListDisplay sections={scheduledSections} />);

    expect(screen.getByText('Scheduled Games')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('TF')).toBeInTheDocument();
  });
});
