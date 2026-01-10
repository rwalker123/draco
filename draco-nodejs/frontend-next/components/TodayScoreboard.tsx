import React from 'react';
import ScoreboardBase from './ScoreboardBase';
import { Game } from './GameListDisplay';
import { createGamesLoader } from '../utils/gameTransformers';
import { useApiClient } from '../hooks/useApiClient';
import WidgetShell from './ui/WidgetShell';
import { Typography } from '@mui/material';

interface TodayScoreboardProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
  currentSeasonId: string;
  onGamesLoaded?: (games: Game[]) => void;
  liveSessionGameIds?: Set<string>;
  canStartLiveScoring?: (game: Game) => boolean;
  onStartLiveScoring?: (game: Game) => void;
  onWatchLiveScoring?: (game: Game) => void;
  refreshTrigger?: number;
}

const TodayScoreboard: React.FC<TodayScoreboardProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
  currentSeasonId,
  onGamesLoaded,
  liveSessionGameIds,
  canStartLiveScoring,
  onStartLiveScoring,
  onWatchLiveScoring,
  refreshTrigger,
}) => {
  const apiClient = useApiClient();
  const loadTodayGames = React.useCallback(async () => {
    // Calculate date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const gamesLoader = createGamesLoader(apiClient, accountId, currentSeasonId, teamId);
    return await gamesLoader(today, tomorrow);
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
            Today&apos;s Games
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Latest scores and results from today.
          </Typography>
        }
        accent="primary"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
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
      title="Today"
      loadGames={loadTodayGames}
      renderWrapper={renderWrapper}
      liveSessionGameIds={liveSessionGameIds}
      canStartLiveScoring={canStartLiveScoring}
      onStartLiveScoring={onStartLiveScoring}
      onWatchLiveScoring={onWatchLiveScoring}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default TodayScoreboard;
