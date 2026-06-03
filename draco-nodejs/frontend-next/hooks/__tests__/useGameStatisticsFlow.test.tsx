import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../theme';
import type { Game } from '../../components/GameListDisplay';
import { GameStatus } from '../../types/schedule';
import {
  type UseGameStatisticsFlowParams,
  type UseGameStatisticsFlowResult,
  useGameStatisticsFlow,
} from '../useGameStatisticsFlow';

vi.mock('../../components/GameStatisticsDialog', () => ({
  default: ({ open, teamName }: { open: boolean; teamName?: string }) =>
    open ? <div data-testid="stats-dialog">StatsDialog:{teamName}</div> : null,
}));

const baseGame: Game = {
  id: 'game-1',
  date: '2024-01-20T18:00:00Z',
  homeTeamId: 'home-team',
  visitorTeamId: 'visitor-team',
  homeTeamName: 'Home Team',
  visitorTeamName: 'Visitor Team',
  homeScore: 3,
  visitorScore: 2,
  gameStatus: GameStatus.Completed,
  gameStatusText: 'Final',
  leagueName: 'League',
  fieldId: null,
  fieldName: null,
  fieldShortName: null,
  hasGameRecap: false,
  gameRecaps: [],
};

interface HookHarnessProps {
  params: UseGameStatisticsFlowParams<Game>;
}

const HookHarness = React.forwardRef<UseGameStatisticsFlowResult<Game>, HookHarnessProps>(
  ({ params }, ref) => {
    const result = useGameStatisticsFlow<Game>(params);
    React.useImperativeHandle(ref, () => result, [result]);

    return <ThemeProvider theme={dracoTheme}>{result.dialogs}</ThemeProvider>;
  },
);
HookHarness.displayName = 'HookHarness';

const baseParams: UseGameStatisticsFlowParams<Game> = {
  accountId: 'account-1',
  seasonId: 'season-1',
  getTeamName: (game, teamId) =>
    teamId === game.homeTeamId ? game.homeTeamName : game.visitorTeamName,
};

describe('useGameStatisticsFlow', () => {
  it('reports an error and shows neither dialog nor picker when no team has stats', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({ ...baseGame, teamsWithStats: [] });
    });

    expect(hookRef.current?.error).toBe('No statistics available for this game.');
    expect(screen.queryByTestId('stats-dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Select Team Statistics to View')).not.toBeInTheDocument();
  });

  it('opens the stats dialog directly when only one team has stats', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({
        ...baseGame,
        teamsWithStats: [baseGame.visitorTeamId],
      });
    });

    expect(screen.getByTestId('stats-dialog')).toHaveTextContent('StatsDialog:Visitor Team');
    expect(screen.queryByText('Select Team Statistics to View')).not.toBeInTheDocument();
  });

  it('prompts for team selection when both teams have stats, then opens the chosen team', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({
        ...baseGame,
        teamsWithStats: [baseGame.homeTeamId, baseGame.visitorTeamId],
      });
    });

    expect(screen.getByText('Select Team Statistics to View')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Visitor Team')).toBeInTheDocument();
    expect(screen.queryByTestId('stats-dialog')).not.toBeInTheDocument();

    await act(async () => {
      screen.getByText('Home Team').click();
    });

    expect(screen.getByTestId('stats-dialog')).toHaveTextContent('StatsDialog:Home Team');
  });
});
