import { useState } from 'react';
import { Game, FilterType, NavigationDirection } from '@/types/schedule';
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
  filterDate: Date;
  setFilterDate: (date: Date) => void;
}

interface UseScheduleFiltersReturn {
  filterType: FilterType;
  filterDate: Date;
  filterLeagueSeasonId: string;
  filterTeamSeasonId: string;

  viewMode: 'calendar' | 'list';
  startDate: Date;
  endDate: Date;
  isNavigating: boolean;

  setFilterType: (type: FilterType) => void;
  setFilterLeagueSeasonId: (leagueId: string) => void;
  setFilterTeamSeasonId: (teamId: string) => void;
  setViewMode: (mode: 'calendar' | 'list') => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;

  navigateToWeek: (direction: NavigationDirection) => void;
  navigate: (direction: NavigationDirection, type?: FilterType) => void;

  filteredGames: Game[];
}

export const useScheduleFilters = ({
  games,
  filterDate,
  setFilterDate,
}: UseScheduleFiltersProps): UseScheduleFiltersReturn => {
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [filterLeagueSeasonId, setFilterLeagueSeasonId] = useState<string>('');
  const [filterTeamSeasonId, setFilterTeamSeasonId] = useState<string>('');

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));
  const [isNavigating, setIsNavigating] = useState(false);

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

  const navigate = (direction: NavigationDirection, type?: FilterType) => {
    if (isNavigating) return;

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

    setFilterDate(newDate);
    setStartDate(newStartDate);
    setEndDate(newEndDate);

    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  const navigateToWeek = (direction: NavigationDirection) => {
    navigate(direction, 'week');
  };

  const handleFilterLeagueChange = (leagueId: string) => {
    setFilterLeagueSeasonId(leagueId);
    setFilterTeamSeasonId('');
  };

  return {
    filterType,
    filterDate,
    filterLeagueSeasonId,
    filterTeamSeasonId,

    viewMode,
    startDate,
    endDate,
    isNavigating,

    setFilterType,
    setFilterLeagueSeasonId: handleFilterLeagueChange,
    setFilterTeamSeasonId,
    setViewMode,
    setStartDate,
    setEndDate,

    navigateToWeek,
    navigate,

    filteredGames,
  };
};
