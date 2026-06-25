import { useApiClient } from '../../../hooks/useApiClient';
import { getSportAdapter } from '../adapters';
import { Game } from '@/types/schedule';
import type { ScheduleAccessMode } from '../types/sportAdapter';

interface UseSeasonGamesLoaderProps {
  accountId: string;
  accountType?: string;
  mode?: ScheduleAccessMode;
}

interface UseSeasonGamesLoaderReturn {
  loadSeasonGames: (seasonId: string, signal?: AbortSignal) => Promise<Game[]>;
}

export const useSeasonGamesLoader = ({
  accountId,
  accountType,
  mode = 'public',
}: UseSeasonGamesLoaderProps): UseSeasonGamesLoaderReturn => {
  const apiClient = useApiClient();
  const adapter = getSportAdapter(accountType);

  const loadSeasonGames = async (seasonId: string, signal?: AbortSignal): Promise<Game[]> => {
    return adapter.loadGames({ accountId, seasonId, apiClient, mode, signal });
  };

  return { loadSeasonGames };
};
