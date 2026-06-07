import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../theme';
import type { Game } from '../../components/GameListDisplay';
import { GameStatus } from '../../types/schedule';
import {
  type UseGameRecapFlowParams,
  type UseGameRecapFlowResult,
  useGameRecapFlow,
} from '../useGameRecapFlow';

vi.mock('../../context/RoleContext', () => ({
  useRole: () => ({
    hasRole: () => false,
    hasRoleInAccount: () => false,
    hasRoleInTeam: () => false,
  }),
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

vi.mock('../useApiClient', () => ({
  useApiClient: () => ({}),
}));

vi.mock('@draco/shared-api-client', () => ({
  getGameLineScore: vi.fn().mockResolvedValue({ data: null }),
  upsertGameRecap: vi.fn(),
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
  params: UseGameRecapFlowParams<Game>;
}

const HookHarness = React.forwardRef<UseGameRecapFlowResult<Game>, HookHarnessProps>(
  ({ params }, ref) => {
    const result = useGameRecapFlow<Game>(params);
    React.useImperativeHandle(ref, () => result, [result]);

    return <ThemeProvider theme={dracoTheme}>{result.dialogs}</ThemeProvider>;
  },
);
HookHarness.displayName = 'HookHarness';

const teamNameResolver = (game: Game, teamId: string) =>
  teamId === game.homeTeamId ? game.homeTeamName : game.visitorTeamName;

beforeEach(() => {
  userTeamIds = [];
});

describe('useGameRecapFlow', () => {
  it('prompts for team selection when editing with multiple editable teams and no existing recaps', async () => {
    const determineEditableTeams = vi
      .fn<(game: Game) => string[]>()
      .mockReturnValue([baseGame.homeTeamId, baseGame.visitorTeamId]);

    const params: UseGameRecapFlowParams<Game> = {
      accountId: 'account-1',
      seasonId: 'season-1',
      fetchRecap: vi.fn().mockResolvedValue(null),
      determineEditableTeams,
      getTeamName: teamNameResolver,
    };

    const hookRef = React.createRef<UseGameRecapFlowResult<Game>>();

    render(<HookHarness ref={hookRef} params={params} />);

    await act(async () => {
      await hookRef.current?.openEditRecap({ ...baseGame, hasGameRecap: false });
    });

    expect(determineEditableTeams).toHaveBeenCalled();
    expect(screen.getByText('Select Team Recap')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Visitor Team')).toBeInTheDocument();
  });

  it('shows both recaps as tabs in the view dialog without a selection dialog', async () => {
    const fetchRecap = vi
      .fn<(game: Game, teamSeasonId: string) => Promise<string | null>>()
      .mockImplementation(async (_game, teamSeasonId) => `<p>${teamSeasonId} recap</p>`);

    const params: UseGameRecapFlowParams<Game> = {
      accountId: 'account-1',
      seasonId: 'season-1',
      fetchRecap,
      getTeamName: teamNameResolver,
    };

    const hookRef = React.createRef<UseGameRecapFlowResult<Game>>();

    render(<HookHarness ref={hookRef} params={params} />);

    await act(async () => {
      await hookRef.current?.openViewRecap({ ...baseGame, hasGameRecap: true });
    });

    expect(screen.queryByText('Select Team Recap to View')).not.toBeInTheDocument();
    expect(screen.getByText('Game Recap')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Home Team' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visitor Team' })).toBeInTheDocument();
  });

  it('shows the team name without tabs when only one team has a recap', async () => {
    const fetchRecap = vi
      .fn<(game: Game, teamSeasonId: string) => Promise<string | null>>()
      .mockImplementation(async (_game, teamSeasonId) =>
        teamSeasonId === 'home-team' ? '<p>home-team recap</p>' : null,
      );

    const params: UseGameRecapFlowParams<Game> = {
      accountId: 'account-1',
      seasonId: 'season-1',
      fetchRecap,
      getTeamName: teamNameResolver,
    };

    const hookRef = React.createRef<UseGameRecapFlowResult<Game>>();

    render(<HookHarness ref={hookRef} params={params} />);

    await act(async () => {
      await hookRef.current?.openViewRecap({ ...baseGame, hasGameRecap: true });
    });

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('Game Recap')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByTestId('game-summary-readonly')).toHaveTextContent('home-team recap');
  });

  it("defaults the active tab to the authenticated user's team", async () => {
    userTeamIds = ['visitor-team'];

    const fetchRecap = vi
      .fn<(game: Game, teamSeasonId: string) => Promise<string | null>>()
      .mockImplementation(async (_game, teamSeasonId) => `<p>${teamSeasonId} recap</p>`);

    const params: UseGameRecapFlowParams<Game> = {
      accountId: 'account-1',
      seasonId: 'season-1',
      fetchRecap,
      getTeamName: teamNameResolver,
    };

    const hookRef = React.createRef<UseGameRecapFlowResult<Game>>();

    render(<HookHarness ref={hookRef} params={params} />);

    await act(async () => {
      await hookRef.current?.openViewRecap({ ...baseGame, hasGameRecap: true });
    });

    expect(screen.getByRole('tab', { name: 'Visitor Team' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Home Team' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByTestId('game-summary-readonly')).toHaveTextContent('visitor-team recap');
  });
});
