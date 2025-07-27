import React from 'react';
import ScoreboardBase from './ScoreboardBase';
import { Game } from './GameListDisplay';
import { createGamesLoader } from '../utils/gameTransformers';

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
  const loadYesterdayGames = React.useCallback(async () => {
    // Calculate date range for yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const gamesLoader = createGamesLoader(accountId, currentSeasonId, teamId);
    return await gamesLoader(yesterday, today);
  }, [accountId, teamId, currentSeasonId]);

  return (
    <ScoreboardBase
      accountId={accountId}
      teamId={teamId}
      layout={layout}
      currentSeasonId={currentSeasonId}
      onGamesLoaded={onGamesLoaded}
      title="Yesterday"
      loadGames={loadYesterdayGames}
    />
  );
};

export default YesterdayScoreboard;
