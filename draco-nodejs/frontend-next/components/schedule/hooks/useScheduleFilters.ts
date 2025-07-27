import { useState, useCallback, useEffect } from 'react';
import { Game, Team, FilterType, NavigationDirection } from '@/types/schedule';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

interface UseScheduleFiltersProps {
  games: Game[];
  leagues: { id: string; name: string }[];
  leagueTeams: Team[];
  loadLeagueTeams: (leagueSeasonId: string) => void;
  filterDate: Date;
  setFilterDate: (date: Date) => void;
}

interface UseScheduleFiltersReturn {
  // Filter states
  filterType: FilterType;
  filterDate: Date;
  filterLeagueSeasonId: string;
  filterTeamSeasonId: string;

  // View states
  viewMode: 'calendar' | 'list';
  startDate: Date;
  endDate: Date;
  isNavigating: boolean;

  // Actions
  setFilterType: (type: FilterType) => void;
  setFilterLeagueSeasonId: (leagueId: string) => void;
  setFilterTeamSeasonId: (teamId: string) => void;
  setViewMode: (mode: 'calendar' | 'list') => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;

  // Navigation
  navigateToWeek: (direction: NavigationDirection) => void;
  navigate: (direction: NavigationDirection, type?: FilterType) => void;

  // Computed values
  filteredGames: Game[];
}

export const useScheduleFilters = ({
  games,
  leagues: _leagues,
  leagueTeams: _leagueTeams,
  loadLeagueTeams,
  filterDate,
  setFilterDate,
}: UseScheduleFiltersProps): UseScheduleFiltersReturn => {
  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterLeagueSeasonId, setFilterLeagueSeasonId] = useState<string>('');
  const [filterTeamSeasonId, setFilterTeamSeasonId] = useState<string>('');

  // View states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));
  const [isNavigating, setIsNavigating] = useState(false);

  // Filter games based on league/team filter
  const filteredGames = games.filter((game) => {
    let leagueMatch = true;
    let teamMatch = true;

    if (filterLeagueSeasonId) {
      leagueMatch = game.league && game.league.id === filterLeagueSeasonId;
    }

    if (filterTeamSeasonId) {
      teamMatch =
        game.homeTeamId === filterTeamSeasonId || game.visitorTeamId === filterTeamSeasonId;
    }

    return leagueMatch && teamMatch;
  });

  // Comprehensive navigation function
  const navigate = useCallback(
    (direction: NavigationDirection, type?: FilterType) => {
      if (isNavigating) return; // Prevent multiple rapid clicks

      setIsNavigating(true);

      const currentType = type || filterType;
      let newDate = new Date(filterDate);
      let newStartDate: Date;
      let newEndDate: Date;

      switch (currentType) {
        case 'day':
          newDate = direction === 'prev' ? subDays(newDate, 1) : addDays(newDate, 1);
          newStartDate = new Date(newDate);
          newStartDate.setHours(0, 0, 0, 0);
          newEndDate = new Date(newDate);
          newEndDate.setHours(23, 59, 59, 999);
          break;

        case 'week':
          newDate = direction === 'prev' ? subWeeks(newDate, 1) : addWeeks(newDate, 1);
          newStartDate = startOfWeek(newDate);
          newEndDate = endOfWeek(newDate);
          break;

        case 'month':
          newDate = direction === 'prev' ? subMonths(newDate, 1) : addMonths(newDate, 1);
          newStartDate = startOfMonth(newDate);
          newEndDate = endOfMonth(newDate);
          break;

        case 'year':
          newDate = direction === 'prev' ? subYears(newDate, 1) : addYears(newDate, 1);
          newStartDate = startOfYear(newDate);
          newEndDate = endOfYear(newDate);
          break;

        default:
          return;
      }

      // Update states
      setFilterDate(newDate);
      setStartDate(newStartDate);
      setEndDate(newEndDate);

      // Reset navigation flag after data loads
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    },
    [filterType, filterDate, isNavigating, setFilterDate],
  );

  // Week navigation function (legacy support)
  const navigateToWeek = useCallback(
    (direction: NavigationDirection) => {
      navigate(direction, 'week');
    },
    [navigate],
  );

  // Handle league filter change
  const handleFilterLeagueChange = useCallback((leagueId: string) => {
    setFilterLeagueSeasonId(leagueId);
    setFilterTeamSeasonId(''); // Reset team filter when league changes
  }, []);

  // Update leagueTeams when filterLeagueSeasonId changes
  useEffect(() => {
    if (filterLeagueSeasonId) {
      loadLeagueTeams(filterLeagueSeasonId);
    } else {
      // Clear league teams when no league is selected
      // This will be handled by the parent component
    }
  }, [filterLeagueSeasonId, loadLeagueTeams]);

  return {
    // Filter states
    filterType,
    filterDate,
    filterLeagueSeasonId,
    filterTeamSeasonId,

    // View states
    viewMode,
    startDate,
    endDate,
    isNavigating,

    // Actions
    setFilterType,
    setFilterLeagueSeasonId: handleFilterLeagueChange,
    setFilterTeamSeasonId,
    setViewMode,
    setStartDate,
    setEndDate,

    // Navigation
    navigateToWeek,
    navigate,

    // Computed values
    filteredGames,
  };
};
