import { Game } from '@/types/schedule';
import { buildScheduleSummary } from './buildScheduleSummary';
import type { SeasonSummary } from '../hooks/useTeamSeasonSummary';

interface GetFilteredScheduleSummaryProps {
  games: Game[];
  timeZone: string;
  teamSeasonId?: string;
  ready: boolean;
}

export const getFilteredScheduleSummary = ({
  games,
  timeZone,
  teamSeasonId,
  ready,
}: GetFilteredScheduleSummaryProps): SeasonSummary | null => {
  if (!ready || games.length === 0) {
    return null;
  }

  return buildScheduleSummary(games, { timeZone, teamSeasonId });
};
