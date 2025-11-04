import React from 'react';
import ScoreboardBase from './ScoreboardBase';
import { Game } from './GameListDisplay';
import { createGamesLoader } from '../utils/gameTransformers';
import { useApiClient } from '../hooks/useApiClient';
import WidgetShell from './ui/WidgetShell';
import { Typography } from '@mui/material';

interface YesterdayScoreboardProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
  currentSeasonId: string;
  onGamesLoaded?: (games: Game[]) => void;
}

const YesterdayScoreboard: React.FC<YesterdayScoreboardProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
  currentSeasonId,
  onGamesLoaded,
}) => {
  const apiClient = useApiClient();
  const loadYesterdayGames = React.useCallback(async () => {
    // Calculate date range for yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const gamesLoader = createGamesLoader(apiClient, accountId, currentSeasonId, teamId);
    return await gamesLoader(yesterday, today);
  }, [accountId, apiClient, teamId, currentSeasonId]);

  const renderWrapper = (
    content: React.ReactNode,
    state: 'loading' | 'error' | 'empty' | 'content',
  ): React.ReactNode => {
    if (state === 'empty') {
      return null;
    }

    return (
      <WidgetShell
        title={
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Yesterday&apos;s Games
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Recap the action from yesterday.
          </Typography>
        }
        accent="primary"
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignSelf: 'flex-start',
          width: 'auto',
          maxWidth: '100%',
        }}
      >
        {content}
      </WidgetShell>
    );
  };

  return (
    <ScoreboardBase
      accountId={accountId}
      teamId={teamId}
      layout={layout}
      currentSeasonId={currentSeasonId}
      onGamesLoaded={onGamesLoaded}
      title="Yesterday"
      loadGames={loadYesterdayGames}
      renderWrapper={renderWrapper}
    />
  );
};

export default YesterdayScoreboard;
