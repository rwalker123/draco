import React from 'react';
import { render, screen } from '@testing-library/react';
import GameListDisplay, { GameListSection, Game } from '../GameListDisplay';
import { GameStatus } from '../../types/schedule';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../theme';

// Mock the gameUtils module
vi.mock('../../utils/gameUtils', () => ({
  getGameStatusShortText: vi.fn((status: number) => {
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

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={dracoTheme}>{component}</ThemeProvider>);
};

const mockGame: Game = {
  id: '1',
  date: '2024-01-15T18:00:00Z',
  homeTeamId: 'home1',
  visitorTeamId: 'visitor1',
  homeTeamName: 'Home Team',
  visitorTeamName: 'Visitor Team',
  homeScore: 5,
  visitorScore: 3,
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
    renderWithTheme(<GameListDisplay sections={mockSections} />);

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Visitor Team')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders with horizontal layout when specified', () => {
    renderWithTheme(<GameListDisplay sections={mockSections} layout="horizontal" />);

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Visitor Team')).toBeInTheDocument();
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

    renderWithTheme(<GameListDisplay sections={emptySections} emptyMessage="No games found" />);

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

    renderWithTheme(<GameListDisplay sections={scheduledSections} />);

    expect(screen.getByText('Scheduled Games')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Visitor Team')).toBeInTheDocument();
    expect(screen.getByText('TF')).toBeInTheDocument();
  });

  it('applies the provided timezone when formatting scheduled game times', () => {
    const pacificGame: Game = {
      ...mockGame,
      gameStatus: GameStatus.Scheduled,
      gameStatusText: 'Scheduled',
    };

    const pacificSections: GameListSection[] = [
      {
        title: 'Scheduled Games',
        games: [pacificGame],
      },
    ];

    renderWithTheme(<GameListDisplay sections={pacificSections} timeZone="America/Los_Angeles" />);

    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });
});
