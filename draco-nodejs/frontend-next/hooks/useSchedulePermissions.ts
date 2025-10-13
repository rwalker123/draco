import { useRole } from '../context/RoleContext';
import { GameStatus } from '../types/schedule';
import { GameCardData } from '../components/GameCard';

interface SchedulePermissionsContext {
  accountId: string;
  teamSeasonId?: string;
  leagueSeasonId?: string;
}

interface SchedulePermissions {
  canEditGames: boolean;
  canDeleteGames: boolean;
  canEditRecap: (game: GameCardData) => boolean;
  canViewRecap: (game: GameCardData) => boolean;
  canEnterGameResults: boolean;
}

/**
 * Centralized hook for schedule and game permissions
 * Consolidates permission logic that was duplicated across components
 */
export const useSchedulePermissions = (
  context: SchedulePermissionsContext,
): SchedulePermissions => {
  const { hasRoleInTeam, hasRoleInAccount, hasRole } = useRole();

  const canEditGames =
    hasRoleInAccount('AccountAdmin', context.accountId) || hasRole('Administrator');

  const canDeleteGames = canEditGames;

  const canEnterGameResults = canEditGames;

  const canEditRecap = (game: GameCardData): boolean => {
    // Only allow editing for completed games
    if (game.gameStatus !== GameStatus.Completed) {
      return false;
    }

    // Global administrators and account admins can edit all recaps
    if (hasRole('Administrator') || hasRoleInAccount('AccountAdmin', context.accountId)) {
      return true;
    }

    // Team admins can edit recaps for their team's games
    if (context.teamSeasonId) {
      const isTeamAdmin = hasRoleInTeam('TeamAdmin', context.teamSeasonId);
      const isTeamGame =
        game.homeTeamId === context.teamSeasonId || game.visitorTeamId === context.teamSeasonId;
      return isTeamAdmin && isTeamGame;
    }

    return false;
  };

  const canViewRecap = (game: GameCardData): boolean => {
    // Anyone can view recaps for games that have them
    return game.hasGameRecap;
  };

  return {
    canEditGames,
    canDeleteGames,
    canEditRecap,
    canViewRecap,
    canEnterGameResults,
  };
};
