import React from 'react';
import ScoreboardBase from './ScoreboardBase';
import { Game } from './GameListDisplay';
import { createGamesLoader } from '../utils/gameTransformers';

interface TodayScoreboardProps {
  accountId: string;
  teamId?: string;
  layout?: 'vertical' | 'horizontal';
  currentSeasonId: string;
  onGamesLoaded?: (games: Game[]) => void;
}

const TodayScoreboard: React.FC<TodayScoreboardProps> = ({
  accountId,
  teamId,
  layout = 'vertical',
  currentSeasonId,
  onGamesLoaded,
}) => {
  const loadTodayGames = React.useCallback(async () => {
    // Calculate date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const gamesLoader = createGamesLoader(accountId, currentSeasonId, teamId);
    return await gamesLoader(today, tomorrow);
  }, [accountId, teamId, currentSeasonId]);

  return (
    <ScoreboardBase
      accountId={accountId}
      teamId={teamId}
      layout={layout}
      currentSeasonId={currentSeasonId}
      onGamesLoaded={onGamesLoaded}
      title="Today"
      loadGames={loadTodayGames}
    />
  );
};

export default TodayScoreboard;
