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
import type { StatsTab } from '../../components/GameStatisticsDialog';

vi.mock('../../components/GameStatisticsDialog', () => ({
  default: ({
    open,
    statsTabs,
    initialTeamSeasonId,
  }: {
    open: boolean;
    statsTabs?: StatsTab[];
    initialTeamSeasonId?: string;
  }) =>
    open ? (
      <div data-testid="stats-dialog" data-initial={initialTeamSeasonId}>
        {(statsTabs ?? []).map((tab) => (
          <span key={tab.teamSeasonId} data-testid={`stats-tab-${tab.teamSeasonId}`}>
            {tab.teamName}
          </span>
        ))}
      </div>
    ) : null,
}));

let userTeamIds: string[] = [];

vi.mock('../useUserTeams', () => ({
  useUserTeams: () => ({
    teams: [],
    loading: false,
    error: null,
    initialized: true,
    isUserTeam: (teamSeasonId: string) => userTeamIds.includes(teamSeasonId),
    refetch: () => {},
  }),
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

beforeEach(() => {
  userTeamIds = [];
});

describe('useGameStatisticsFlow', () => {
  it('reports an error and shows no dialog when no team has stats', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({ ...baseGame, teamsWithStats: [] });
    });

    expect(hookRef.current?.error).toBe('No statistics available for this game.');
    expect(screen.queryByTestId('stats-dialog')).not.toBeInTheDocument();
  });

  it('opens the stats dialog with a single tab when only one team has stats', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({
        ...baseGame,
        teamsWithStats: [baseGame.visitorTeamId],
      });
    });

    const dialog = screen.getByTestId('stats-dialog');
    expect(dialog).toHaveAttribute('data-initial', 'visitor-team');
    expect(screen.getByTestId('stats-tab-visitor-team')).toHaveTextContent('Visitor Team');
    expect(screen.queryByTestId('stats-tab-home-team')).not.toBeInTheDocument();
  });

  it('opens directly with both tabs (no selection dialog) when both teams have stats', async () => {
    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({
        ...baseGame,
        teamsWithStats: [baseGame.homeTeamId, baseGame.visitorTeamId],
      });
    });

    expect(screen.queryByText('Select Team Statistics to View')).not.toBeInTheDocument();
    const dialog = screen.getByTestId('stats-dialog');
    expect(screen.getByTestId('stats-tab-home-team')).toHaveTextContent('Home Team');
    expect(screen.getByTestId('stats-tab-visitor-team')).toHaveTextContent('Visitor Team');
    expect(dialog).toHaveAttribute('data-initial', 'home-team');
  });

  it("defaults to the authenticated user's team when both teams have stats", async () => {
    userTeamIds = ['visitor-team'];

    const hookRef = React.createRef<UseGameStatisticsFlowResult<Game>>();
    render(<HookHarness ref={hookRef} params={baseParams} />);

    await act(async () => {
      hookRef.current?.openViewStatistics({
        ...baseGame,
        teamsWithStats: [baseGame.homeTeamId, baseGame.visitorTeamId],
      });
    });

    expect(screen.getByTestId('stats-dialog')).toHaveAttribute('data-initial', 'visitor-team');
  });
});
