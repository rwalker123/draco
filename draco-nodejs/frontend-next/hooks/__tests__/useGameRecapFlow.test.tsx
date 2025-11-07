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
      getTeamName: (game, teamId) =>
        teamId === game.homeTeamId ? game.homeTeamName : game.visitorTeamName,
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
});
