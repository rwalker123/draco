'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  ZoomIn as ZoomInIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameDay } from 'date-fns/isSameDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfYear } from 'date-fns/startOfYear';
import { endOfYear } from 'date-fns/endOfYear';
import { useRole } from '../../../../context/RoleContext';
import { useAuth } from '../../../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { getGameStatusText, getGameStatusShortText } from '../../../../utils/gameUtils';
import GameCard, { GameCardData } from '../../../../components/GameCard';
import EnterGameResultsDialog, {
  GameResultData,
} from '../../../../components/EnterGameResultsDialog';

interface Game {
  id: string;
  gameDate: string;
  homeTeamId: string;
  visitorTeamId: string;
  homeScore: number;
  visitorScore: number;
  comment: string;
  fieldId?: string;
  field?: {
    id: string;
    name: string;
    shortName: string;
    address: string;
    city: string;
    state: string;
  };
  gameStatus: number;
  gameType: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
  league: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface Field {
  id: string;
  name: string;
  shortName: string;
  comment: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  directions: string;
  rainoutNumber: string;
  latitude: string;
  longitude: string;
}

interface ScheduleManagementProps {
  accountId: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ accountId }) => {
  const { hasRole } = useRole();
  const { user, token } = useAuth();

  // Check if user has edit permissions for schedule management
  // Only authenticated users can have edit permissions
  const canEditSchedule =
    user &&
    (hasRole('Administrator') ||
      hasRole('AccountAdmin', { accountId }) ||
      // TODO: LeagueAdmin should be tied to a leagueSeasonId
      hasRole('LeagueAdmin', { accountId }));

  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, Team[]>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameResultsDialogOpen, setGameResultsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGameForResults, setSelectedGameForResults] = useState<Game | null>(null);
  const [dialogLeagueSeason, setDialogLeagueSeason] = useState<string>('');

  // Dialog error states
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);

  // Form states
  const [gameDate, setGameDate] = useState<Date | null>(new Date());
  const [gameTime, setGameTime] = useState<Date | null>(new Date());
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [visitorTeamId, setVisitorTeamId] = useState<string>('');
  const [fieldId, setFieldId] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [gameType, setGameType] = useState<number>(0);

  // View states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));

  // Filter states
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [filterDate, setFilterDate] = useState<Date>(new Date());

  // Loading states
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStaticData, setLoadingStaticData] = useState(true);

  // Add a debounced navigation function to prevent excessive re-renders
  const [isNavigating, setIsNavigating] = useState(false);

  // Add state for league/team filters
  const [filterLeagueSeasonId, setFilterLeagueSeasonId] = useState<string>('');
  const [filterTeamSeasonId, setFilterTeamSeasonId] = useState<string>('');
  const [currentSeasonName, setCurrentSeasonName] = useState<string>('');

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

  const navigateToWeek = React.useCallback(
    (direction: 'prev' | 'next') => {
      if (isNavigating) return; // Prevent multiple rapid clicks

      setIsNavigating(true);

      const newStartDate = new Date(startDate);
      if (direction === 'prev') {
        newStartDate.setDate(newStartDate.getDate() - 7);
      } else {
        newStartDate.setDate(newStartDate.getDate() + 7);
      }

      const newStart = startOfWeek(newStartDate);
      const newEnd = endOfWeek(newStartDate);

      // Batch state updates to reduce re-renders
      setStartDate(newStart);
      setEndDate(newEnd);
      setFilterDate(newStartDate);

      // Reset navigation flag after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    },
    [startDate, isNavigating],
  );

  // Move loadStaticData and loadGamesData here, before the useEffect hooks that call them
  const loadStaticData = useCallback(async () => {
    try {
      setLoadingStaticData(true);
      setError('');

      // Get current season first
      const currentSeasonResponse = await fetch(`/api/accounts/${accountId}/seasons/current`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!currentSeasonResponse.ok) {
        throw new Error('Failed to load current season');
      }

      const currentSeasonData = await currentSeasonResponse.json();
      const currentSeasonId = currentSeasonData.data.season.id;
      setCurrentSeasonName(currentSeasonData.data.season.name);

      // Load static data in parallel
      const [leaguesResponse, fieldsResponse] = await Promise.all([
        fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/leagues?includeTeams`, {
          headers: { 'Content-Type': 'application/json' },
        }),

        fetch(`/api/accounts/${accountId}/fields`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      // Process leagues for current season (may fail for unauthenticated users)
      if (leaguesResponse.ok) {
        const leaguesData = await leaguesResponse.json();
        const leaguesList = leaguesData.data?.leagueSeasons || [];

        // Build the leagues array and cache teams for each league
        const newLeagueTeamsCache = new Map<string, Team[]>();
        const processedLeagues = leaguesList.map(
          (ls: {
            id: string;
            leagueName: string;
            divisions?: Array<{ teams: Team[] }>;
            unassignedTeams?: Team[];
          }) => {
            const allTeams: Team[] = [];

            // Add teams from divisions
            if (ls.divisions) {
              ls.divisions.forEach((division: { teams: Team[] }) => {
                division.teams.forEach((team: Team) => {
                  allTeams.push({
                    id: team.id,
                    name: team.name,
                  });
                });
              });
            }

            // Add unassigned teams
            if (ls.unassignedTeams) {
              ls.unassignedTeams.forEach((team: Team) => {
                allTeams.push({
                  id: team.id,
                  name: team.name,
                });
              });
            }

            // Cache the teams for this league
            newLeagueTeamsCache.set(ls.id, allTeams);

            return {
              id: ls.id,
              name: ls.leagueName,
            };
          },
        );

        setLeagues(processedLeagues);
        setLeagueTeamsCache(newLeagueTeamsCache);

        // Also set all teams (for backwards compatibility)
        const allTeamsSet = new Set<string>();
        const allTeamsArray: Team[] = [];
        newLeagueTeamsCache.forEach((teams) => {
          teams.forEach((team) => {
            if (!allTeamsSet.has(team.id)) {
              allTeamsSet.add(team.id);
              allTeamsArray.push(team);
            }
          });
        });
        setTeams(allTeamsArray);
      } else if (leaguesResponse.status === 401) {
        // For unauthenticated users, set empty leagues array
        setLeagues([]);
        setLeagueTeamsCache(new Map());
      } else {
        console.warn('Failed to load leagues:', leaguesResponse.status);
        setLeagues([]);
        setLeagueTeamsCache(new Map());
      }

      // Teams are now loaded from the leagues response above

      // Process fields (should work for all users)
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData.data.fields);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load static data');
    } finally {
      setLoadingStaticData(false);
    }
  }, [accountId]);

  const loadGamesData = useCallback(async () => {
    try {
      setLoadingGames(true);
      setError('');

      // Get current season first
      const currentSeasonResponse = await fetch(`/api/accounts/${accountId}/seasons/current`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!currentSeasonResponse.ok) {
        throw new Error('Failed to load current season');
      }

      const currentSeasonData = await currentSeasonResponse.json();
      const currentSeasonId = currentSeasonData.data.season.id;

      // Calculate date range based on filter type
      let startDate: Date;
      let endDate: Date;

      switch (filterType) {
        case 'day':
          startDate = new Date(filterDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(filterDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = startOfWeek(filterDate);
          endDate = endOfWeek(filterDate);
          break;
        case 'month':
          startDate = startOfMonth(filterDate);
          endDate = endOfMonth(filterDate);
          break;
        case 'year':
          startDate = startOfYear(filterDate);
          endDate = endOfYear(filterDate);
          break;
        default:
          startDate = startOfMonth(filterDate);
          endDate = endOfMonth(filterDate);
      }

      // Update view dates for calendar view
      setStartDate(startDate);
      setEndDate(endDate);

      // Load games for the current season (across all leagues)
      const gamesResponse = await fetch(
        `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!gamesResponse.ok) {
        throw new Error('Failed to load games');
      }

      const gamesData = await gamesResponse.json();
      setGames(gamesData.data.games);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  }, [accountId, filterType, filterDate]);

  useEffect(() => {
    loadStaticData();
  }, [accountId, loadStaticData]);

  useEffect(() => {
    if (filterType && filterDate) {
      loadGamesData();
    }
  }, [accountId, filterType, filterDate, loadGamesData]);

  const loadLeagueTeams = useCallback(
    (leagueSeasonId: string) => {
      // Use cached teams instead of making an API call
      const cachedTeams = leagueTeamsCache.get(leagueSeasonId);
      if (cachedTeams) {
        setLeagueTeams(cachedTeams);
      } else {
        setLeagueTeams([]);
      }
    },
    [leagueTeamsCache],
  );

  // Update leagueTeams when filterLeagueSeasonId changes (for filter dropdown)
  useEffect(() => {
    if (filterLeagueSeasonId) {
      loadLeagueTeams(filterLeagueSeasonId);
    } else {
      setLeagueTeams([]);
    }
    setFilterTeamSeasonId(''); // Reset team filter when league changes
  }, [filterLeagueSeasonId, loadLeagueTeams]);

  const handleCreateGame = async () => {
    try {
      setCreateDialogError(null); // Clear any previous errors

      if (!gameDate || !gameTime || !homeTeamId || !visitorTeamId || !dialogLeagueSeason) {
        setCreateDialogError('Please fill in all required fields');
        return;
      }

      // Get current season first
      const currentSeasonResponse = await fetch(`/api/accounts/${accountId}/seasons/current`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!currentSeasonResponse.ok) {
        throw new Error('Failed to load current season');
      }

      const currentSeasonData = await currentSeasonResponse.json();
      const currentSeasonId = currentSeasonData.data.season.id;

      // Combine date and time
      const combinedDateTime = new Date(gameDate);
      combinedDateTime.setHours(gameTime.getHours(), gameTime.getMinutes());

      const requestData = {
        leagueSeasonId: dialogLeagueSeason,
        gameDate: combinedDateTime.toISOString(),
        homeTeamId,
        visitorTeamId,
        fieldId: fieldId || null,
        comment,
        gameType,
      };

      const response = await fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create game (${response.status})`);
      }

      setSuccess('Game created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadGamesData();
    } catch (err) {
      setCreateDialogError(err instanceof Error ? err.message : 'Failed to create game');
    }
  };

  const handleUpdateGame = async () => {
    try {
      setEditDialogError(null); // Clear any previous errors

      if (!selectedGame || !gameDate || !gameTime || !homeTeamId || !visitorTeamId) {
        setEditDialogError('Please fill in all required fields');
        return;
      }

      // Combine date and time
      const combinedDateTime = new Date(gameDate);
      combinedDateTime.setHours(gameTime.getHours(), gameTime.getMinutes());

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${selectedGame.season.id}/games/${selectedGame.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameDate: combinedDateTime.toISOString(),
            homeTeamId,
            visitorTeamId,
            fieldId: fieldId || null,
            comment,
            gameType,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update game');
      }

      setSuccess('Game updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadGamesData();
    } catch (err) {
      setEditDialogError(err instanceof Error ? err.message : 'Failed to update game');
    }
  };

  const handleDeleteGame = async () => {
    try {
      if (!selectedGame) return;

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${selectedGame.season.id}/games/${selectedGame.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          setDeleteDialogOpen(false);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete game');
      }

      setSuccess('Game deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedGame(null);
      loadGamesData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      setDeleteDialogOpen(false);
    }
  };

  const resetForm = () => {
    setGameDate(new Date());
    setGameTime(new Date());
    setHomeTeamId('');
    setVisitorTeamId('');
    setFieldId('');
    setComment('');
    setGameType(0);
    setSelectedGame(null);
    setDialogLeagueSeason('');
    // Don't clear leagueTeams as they're used by filters
  };

  const initializeCreateForm = () => {
    // Use the selected filter date based on filter type
    let initialDate: Date;
    switch (filterType) {
      case 'day':
        // Use the exact selected day
        initialDate = filterDate;
        break;
      case 'week':
        // Use the start of the selected week
        initialDate = startDate;
        break;
      case 'month':
        // Use the first day of the selected month
        initialDate = startDate;
        break;
      case 'year':
        // Use the first day of the selected year
        initialDate = startDate;
        break;
      default:
        // Fallback to current date
        initialDate = new Date();
    }

    setGameDate(initialDate);
    setGameTime(initialDate);
    setHomeTeamId('');
    setVisitorTeamId('');
    setFieldId('');
    setComment('');
    setGameType(0);
    setDialogLeagueSeason('');
    setCreateDialogError(null);
  };

  const openEditDialog = useCallback(
    (game: Game) => {
      // Check if user can edit games
      if (!canEditSchedule) {
        setSelectedGame(game);
        setGameDate(parseISO(game.gameDate));
        setGameTime(parseISO(game.gameDate));
        setHomeTeamId(game.homeTeamId);
        setVisitorTeamId(game.visitorTeamId);
        setFieldId(game.fieldId || '');
        setComment(game.comment);
        const gameTypeValue = game.gameType || 0;
        setGameType(gameTypeValue);
        setEditDialogError(null);
        setDialogLeagueSeason(''); // No need to load league teams for view-only
        setEditDialogOpen(true);
        return;
      }

      setSelectedGame(game);
      setGameDate(parseISO(game.gameDate));
      setGameTime(parseISO(game.gameDate));
      setHomeTeamId(game.homeTeamId);
      setVisitorTeamId(game.visitorTeamId);
      setFieldId(game.fieldId || '');
      setComment(game.comment);
      const gameTypeValue = game.gameType || 0;
      setGameType(gameTypeValue);
      setEditDialogError(null); // Clear any previous errors

      // Load teams for the specific league of this game (only if user can edit)
      if (game.league?.id) {
        // Find the league season ID for this league
        // The game.league.id is the actual league ID, we need to find the league season ID
        const leagueSeason = leagues.find((l) => l.id === game.league.id);
        if (leagueSeason) {
          setDialogLeagueSeason(leagueSeason.id);
          loadLeagueTeams(leagueSeason.id);
        } else {
          // Try to find by league name as fallback
          const leagueByName = leagues.find((l) => l.name === game.league.name);
          if (leagueByName) {
            setDialogLeagueSeason(leagueByName.id);
            loadLeagueTeams(leagueByName.id);
          }
        }
      }

      setEditDialogOpen(true);
    },
    [leagues, loadLeagueTeams, canEditSchedule],
  );

  const openDeleteDialog = (game: Game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const openGameResultsDialog = useCallback((game: Game) => {
    setSelectedGameForResults(game);
    setGameResultsDialogOpen(true);
  }, []);

  const handleSaveGameResults = async (gameResultData: GameResultData) => {
    if (!selectedGameForResults) {
      throw new Error('No game selected for results');
    }

    const requestBody = {
      homeScore: gameResultData.homeScore,
      awayScore: gameResultData.awayScore,
      gameStatus: gameResultData.gameStatus,
      emailPlayers: gameResultData.emailPlayers,
      postToTwitter: gameResultData.postToTwitter,
      postToBluesky: gameResultData.postToBluesky,
      postToFacebook: gameResultData.postToFacebook,
    };

    const response = await fetch(
      `/api/accounts/${accountId}/seasons/${selectedGameForResults.season.id}/games/${selectedGameForResults.id}/results`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save game results');
    }

    // Only set success and close dialog on successful save
    setSuccess('Game results saved successfully');
    setGameResultsDialogOpen(false);
    setSelectedGameForResults(null);
    loadGamesData();
  };

  const getTeamName = useCallback(
    (teamId: string): string => {
      if (!teams || teams.length === 0) {
        return `Team ${teamId}`;
      }
      const team = teams.find((t) => t.id === teamId);
      return team ? team.name : `Team ${teamId}`;
    },
    [teams],
  );

  const getFieldName = useCallback(
    (fieldId?: string): string => {
      if (!fieldId) return 'TBD';
      const field = fields.find((f) => f.id === fieldId);
      return field ? field.name : 'Unknown Field';
    },
    [fields],
  );

  const getGameTypeText = (gameType: number | string): string => {
    const gameTypeNum = Number(gameType);
    switch (gameTypeNum) {
      case 0:
        return 'Regular Season';
      case 1:
        return 'Playoff';
      case 2:
        return 'Exhibition';
      default:
        return `Unknown (${gameType})`;
    }
  };

  // Convert ScheduleManagement Game format to GameCardData format
  const convertGameToGameCardData = useCallback(
    (game: Game): GameCardData => {
      return {
        id: game.id,
        date: game.gameDate,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.visitorTeamId,
        homeTeamName: getTeamName(game.homeTeamId),
        awayTeamName: getTeamName(game.visitorTeamId),
        homeScore: game.homeScore,
        awayScore: game.visitorScore,
        gameStatus: game.gameStatus,
        gameStatusText: getGameStatusText(game.gameStatus),
        gameStatusShortText: getGameStatusShortText(game.gameStatus),
        leagueName: game.league?.name || 'Unknown League',
        fieldId: game.fieldId || null,
        fieldName: game.field?.name || null,
        fieldShortName: game.field?.shortName || null,
        hasGameRecap: false, // ScheduleManagement doesn't have game recaps
        gameRecaps: [], // ScheduleManagement doesn't have game recaps
        comment: game.comment,
      };
    },
    [getTeamName],
  );

  const renderWeekView = React.useCallback(() => {
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box
        sx={{
          border: '3px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          overflowX: 'auto', // Allow horizontal scrolling if needed
          minWidth: 'fit-content', // Ensure minimum width based on content
        }}
      >
        {/* Month Header - Clickable to go to month view */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            backgroundColor: 'primary.main',
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
          onClick={() => {
            setFilterType('month');
            setFilterDate(filterDate);
          }}
          title={`View ${format(filterDate, 'MMMM yyyy')} in month view`}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            {format(filterDate, 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Week Navigation Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2,
            backgroundColor: 'grey.100',
            borderBottom: '2px solid',
            borderBottomColor: 'primary.main',
          }}
        >
          <IconButton
            size="small"
            onClick={() => navigateToWeek('prev')}
            disabled={isNavigating}
            sx={{ color: 'primary.main' }}
            title="Previous week"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const today = new Date();
                const todayStart = startOfWeek(today);
                const todayEnd = endOfWeek(today);
                setStartDate(todayStart);
                setEndDate(todayEnd);
                setFilterDate(today);
              }}
              sx={{
                ml: 1,
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.50',
                  borderColor: 'primary.dark',
                },
              }}
              title="Go to today's week"
            >
              Today
            </Button>
          </Box>

          <IconButton
            size="small"
            onClick={() => navigateToWeek('next')}
            disabled={isNavigating}
            sx={{ color: 'primary.main' }}
            title="Next week"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Week Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '2px solid',
            borderBottomColor: 'primary.main',
            backgroundColor: 'primary.50',
            minWidth: '700px', // Ensure minimum width for 7 columns
          }}
        >
          {dayNames.map((dayName, index) => (
            <Box
              key={dayName}
              sx={{
                textAlign: 'center',
                py: 1.5,
                fontWeight: 'bold',
                backgroundColor: 'primary.50',
                borderRight: index < 6 ? '2px solid' : 'none',
                borderRightColor: index < 6 ? 'primary.main' : 'transparent',
                minWidth: 0, // Allow shrinking
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                {dayName}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Week Content */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            opacity: isNavigating ? 0.7 : 1,
            transition: 'opacity 0.2s ease-in-out',
            minHeight: '300px',
            minWidth: '700px', // Ensure minimum width for 7 columns
          }}
        >
          {weekDays.map((day, index) => {
            const dayGames = filteredGames.filter(
              (game) => game?.gameDate && isSameDay(parseISO(game.gameDate), day),
            );

            return (
              <Box
                key={day.toISOString()}
                sx={{
                  minHeight: '300px',
                  borderRight: index < 6 ? '2px solid' : 'none',
                  borderRightColor: index < 6 ? 'primary.main' : 'transparent',
                  backgroundColor: 'background.paper',
                  cursor: 'pointer',
                  minWidth: 0, // Allow shrinking
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  },
                }}
                onClick={() => {
                  setFilterType('day');
                  setFilterDate(day);
                }}
                title={`View ${format(day, 'EEEE, MMMM d, yyyy')} in day view`}
              >
                {/* Day Header */}
                <Box
                  sx={{
                    py: 1,
                    px: 1,
                    backgroundColor: 'grey.50',
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {format(day, 'd')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {format(day, 'MMM')}
                  </Typography>
                </Box>

                {/* Games for this day */}
                <Box sx={{ p: 1, height: 'calc(100% - 60px)', overflow: 'auto' }}>
                  {dayGames.length > 0 ? (
                    dayGames.map((game) => (
                      <Box
                        key={game.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering day view
                          openEditDialog(game);
                        }}
                      >
                        <GameCard
                          game={convertGameToGameCardData(game)}
                          layout="horizontal"
                          compact={true}
                          calendar={true}
                          canEditGames={!!canEditSchedule}
                          onEnterGameResults={
                            canEditSchedule
                              ? (gameCardData) => {
                                  // Find the original game by ID and call openGameResultsDialog
                                  const originalGame = dayGames.find(
                                    (g) => g.id === gameCardData.id,
                                  );
                                  if (originalGame) {
                                    openGameResultsDialog(originalGame);
                                  }
                                }
                              : undefined
                          }
                          showActions={!!canEditSchedule}
                          onClick={() => openEditDialog(game)}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ textAlign: 'center', mt: 2 }}
                    >
                      No games
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }, [
    startDate,
    endDate,
    filterDate,
    isNavigating,
    navigateToWeek,
    filteredGames,
    openEditDialog,
    openGameResultsDialog,
    canEditSchedule,
    convertGameToGameCardData,
  ]);

  const renderListView = () => {
    // Sort games by date ascending (if not already sorted)
    const sortedGames = [...filteredGames].sort((a, b) => {
      const aDate = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const bDate = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return aDate - bDate;
    });

    let lastWeekMonday: string | null = null;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '700px',
          mx: 'auto',
          px: 2,
          py: 1,
        }}
      >
        {sortedGames.map((game, idx) => {
          const gameDate = game.gameDate ? parseISO(game.gameDate) : null;
          // Get the Monday of this week
          const weekMonday = gameDate ? startOfWeek(gameDate, { weekStartsOn: 1 }) : null;
          const weekMondayStr = weekMonday ? weekMonday.toISOString().slice(0, 10) : '';
          let showWeekLabel = false;
          if (weekMondayStr && weekMondayStr !== lastWeekMonday) {
            showWeekLabel = true;
            lastWeekMonday = weekMondayStr;
          }
          return (
            <React.Fragment key={game.id}>
              {showWeekLabel && weekMonday && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{
                    mt: idx === 0 ? 0 : 0.1,
                    mb: 0.1,
                    fontWeight: 500,
                    alignSelf: 'flex-start',
                  }}
                >
                  {`Week of ${format(weekMonday, 'MMMM d, yyyy')}`}
                </Typography>
              )}
              <Box sx={{ width: '100%', maxWidth: 600, mb: 0.25 }}>
                <GameCard
                  game={convertGameToGameCardData(game)}
                  layout="vertical"
                  canEditGames={!!canEditSchedule}
                  onEnterGameResults={
                    canEditSchedule
                      ? (gameCardData) => {
                          // Find the original game by ID and call openGameResultsDialog
                          const originalGame = sortedGames.find((g) => g.id === gameCardData.id);
                          if (originalGame) {
                            openGameResultsDialog(originalGame);
                          }
                        }
                      : undefined
                  }
                  showActions={!!canEditSchedule}
                  onClick={() => openEditDialog(game)}
                  showDate={true}
                />
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  const renderMonthCalendarView = () => {
    // Get the first day of the month and the last day
    const firstDayOfMonth = startOfMonth(filterDate);
    const lastDayOfMonth = endOfMonth(filterDate);

    // Get the first day of the week that contains the first day of the month
    const firstDayOfWeek = startOfWeek(firstDayOfMonth);
    // Get the last day of the week that contains the last day of the month
    const lastDayOfWeek = endOfWeek(lastDayOfMonth);

    // Generate all days for the calendar grid
    const allDays = eachDayOfInterval({
      start: firstDayOfWeek,
      end: lastDayOfWeek,
    });

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box
        sx={{
          border: '3px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          overflowX: 'auto', // Allow horizontal scrolling if needed
          minWidth: 'fit-content', // Ensure minimum width based on content
        }}
      >
        {/* Year Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            backgroundColor: 'primary.main',
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
          onClick={() => {
            setFilterType('year');
            setFilterDate(filterDate);
          }}
          title={`View all games for ${format(filterDate, 'yyyy')}`}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            {format(filterDate, 'yyyy')}
          </Typography>
        </Box>

        {/* Month Header with Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2,
            backgroundColor: 'grey.100',
            borderBottom: '2px solid',
            borderBottomColor: 'primary.main',
          }}
        >
          <IconButton
            size="small"
            onClick={() => {
              const prevMonth = new Date(filterDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setFilterDate(prevMonth);
            }}
            sx={{ color: 'primary.main' }}
            title="Previous month"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              {format(filterDate, 'MMMM yyyy')}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const today = new Date();
                setFilterDate(today);
              }}
              sx={{
                ml: 1,
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.50',
                  borderColor: 'primary.dark',
                },
              }}
              title="Go to today's month"
            >
              Today
            </Button>
          </Box>

          <IconButton
            size="small"
            onClick={() => {
              const nextMonth = new Date(filterDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setFilterDate(nextMonth);
            }}
            sx={{ color: 'primary.main' }}
            title="Next month"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Calendar Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '50px repeat(7, 1fr)',
            borderBottom: '3px solid primary.main',
            backgroundColor: 'grey.100',
            minWidth: '750px', // Ensure minimum width for 8 columns (1 week + 7 days)
          }}
        >
          {/* Week Zoom Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '2px solid primary.main',
              backgroundColor: 'primary.50',
            }}
          >
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Week
            </Typography>
          </Box>

          {dayNames.map((dayName, index) => (
            <Box
              key={dayName}
              sx={{
                textAlign: 'center',
                py: 1.5,
                fontWeight: 'bold',
                backgroundColor: 'primary.50',
                borderLeft: index === 0 ? '2px solid' : 'none',
                borderLeftColor: index === 0 ? 'primary.main' : 'transparent',
                borderRight: index < 6 ? '2px solid' : 'none',
                borderRightColor: index < 6 ? 'primary.main' : 'transparent',
                minWidth: 0, // Allow shrinking
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                {dayName}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        {weeks.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: 'grid',
              gridTemplateColumns: '50px repeat(7, 1fr)',
              minHeight: 120,
              borderTop: weekIndex === 0 ? '2px solid' : 'none',
              borderTopColor: weekIndex === 0 ? 'primary.main' : 'transparent',
              borderBottom: weekIndex < weeks.length - 1 ? '2px solid' : 'none',
              borderBottomColor: weekIndex < weeks.length - 1 ? 'primary.main' : 'transparent',
              minWidth: '750px', // Ensure minimum width for 8 columns (1 week + 7 days)
            }}
          >
            {/* Week Zoom Button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '2px solid primary.main',
                backgroundColor: 'grey.50',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'primary.50',
                },
              }}
              onClick={() => {
                setFilterType('week');
                setStartDate(startOfWeek(week[0]));
                setEndDate(endOfWeek(week[0]));
                setFilterDate(week[0]);
              }}
              title={`View week of ${format(week[0], 'MMM d')} - ${format(week[6], 'MMM d')}`}
            >
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <ZoomInIcon />
              </IconButton>
            </Box>

            {week.map((day, dayIndex) => {
              const isCurrentMonth = day.getMonth() === filterDate.getMonth();
              const dayGames = filteredGames.filter(
                (game) => game?.gameDate && isSameDay(parseISO(game.gameDate), day),
              );

              return (
                <Box
                  key={day.toISOString()}
                  sx={{
                    borderLeft: dayIndex === 0 ? '2px solid' : 'none',
                    borderLeftColor: dayIndex === 0 ? 'primary.main' : 'transparent',
                    borderRight: dayIndex < 6 ? '2px solid' : 'none',
                    borderRightColor: dayIndex < 6 ? 'primary.main' : 'transparent',
                    p: 1,
                    backgroundColor: isCurrentMonth ? 'white' : 'grey.50',
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    minWidth: 0, // Allow shrinking
                    '&:hover': {
                      backgroundColor: isCurrentMonth ? 'primary.50' : 'grey.100',
                      boxShadow: 'inset 0 0 0 2px primary.main',
                    },
                  }}
                  onClick={() => {
                    setFilterType('day');
                    setFilterDate(day);
                  }}
                  title={`View ${format(day, 'EEEE, MMMM d, yyyy')} in day view`}
                >
                  {/* Date Header */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentMonth ? 'bold' : 'normal',
                      color: isCurrentMonth ? 'text.primary' : 'text.secondary',
                      mb: 1,
                      textAlign: 'center',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>

                  {/* Games for this day */}
                  <Box sx={{ flex: 1, overflow: 'hidden', pt: 0.5 }}>
                    {dayGames.map((game) => (
                      <Box
                        key={game.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(game);
                        }}
                      >
                        <GameCard
                          game={convertGameToGameCardData(game)}
                          layout="horizontal"
                          compact={true}
                          calendar={true}
                          canEditGames={!!canEditSchedule}
                          onEnterGameResults={
                            canEditSchedule
                              ? (gameCardData) => {
                                  // Find the original game by ID and call openGameResultsDialog
                                  const originalGame = dayGames.find(
                                    (g) => g.id === gameCardData.id,
                                  );
                                  if (originalGame) {
                                    openGameResultsDialog(originalGame);
                                  }
                                }
                              : undefined
                          }
                          showActions={!!canEditSchedule}
                          onClick={() => openEditDialog(game)}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  const renderDayView = () => {
    const dayGames = filteredGames.filter(
      (game) => game?.gameDate && isSameDay(parseISO(game.gameDate), filterDate),
    );

    return (
      <Box
        sx={{
          border: '3px solid primary.main',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Month Header - Clickable to go to month view */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            backgroundColor: 'primary.main',
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
          onClick={() => {
            setFilterType('month');
            setFilterDate(filterDate);
          }}
          title={`View ${format(filterDate, 'MMMM yyyy')} in month view`}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            {format(filterDate, 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Week Header - Clickable to go to week view */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 1.5,
            px: 2,
            backgroundColor: 'grey.100',
            borderBottom: '2px solid primary.main',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.50',
            },
          }}
          onClick={() => {
            setFilterType('week');
            setStartDate(startOfWeek(filterDate));
            setEndDate(endOfWeek(filterDate));
          }}
          title={`View week of ${format(startOfWeek(filterDate), 'MMM d')} - ${format(endOfWeek(filterDate), 'MMM d')}`}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
            }}
          >
            {format(startOfWeek(filterDate), 'MMM dd')} -{' '}
            {format(endOfWeek(filterDate), 'MMM dd, yyyy')}
          </Typography>
        </Box>

        {/* Day Header with Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2,
            backgroundColor: 'primary.50',
            borderBottom: '2px solid primary.main',
          }}
        >
          <IconButton
            size="small"
            onClick={() => {
              const prevDay = new Date(filterDate);
              prevDay.setDate(prevDay.getDate() - 1);
              setFilterDate(prevDay);
            }}
            sx={{ color: 'primary.main' }}
            title="Previous day"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              {format(filterDate, 'EEEE, MMMM d, yyyy')}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const today = new Date();
                setFilterDate(today);
              }}
              sx={{
                ml: 1,
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.50',
                  borderColor: 'primary.dark',
                },
              }}
              title="Go to today"
            >
              Today
            </Button>
          </Box>

          <IconButton
            size="small"
            onClick={() => {
              const nextDay = new Date(filterDate);
              nextDay.setDate(nextDay.getDate() + 1);
              setFilterDate(nextDay);
            }}
            sx={{ color: 'primary.main' }}
            title="Next day"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Day Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '700px',
            mx: 'auto',
            px: 1,
            py: 0,
            backgroundColor: 'white',
            minHeight: '300px',
          }}
        >
          {dayGames.length > 0 ? (
            dayGames.map((game) => (
              <Box key={game.id} sx={{ width: '100%', maxWidth: 600, mb: 0.25 }}>
                <GameCard
                  game={convertGameToGameCardData(game)}
                  layout="vertical"
                  canEditGames={!!canEditSchedule}
                  onEnterGameResults={
                    canEditSchedule
                      ? (gameCardData) => {
                          // Find the original game by ID and call openGameResultsDialog
                          const originalGame = dayGames.find((g) => g.id === gameCardData.id);
                          if (originalGame) {
                            openGameResultsDialog(originalGame);
                          }
                        }
                      : undefined
                  }
                  showActions={!!canEditSchedule}
                  onClick={() => openEditDialog(game)}
                />
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No games scheduled for this day
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderYearView = () => {
    const year = filterDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthName = format(monthStart, 'MMMM');

      // Get games for this month
      const monthGames = filteredGames.filter((game) => {
        if (!game.gameDate) return false;
        const gameDate = parseISO(game.gameDate);
        return gameDate >= monthStart && gameDate <= monthEnd;
      });

      // Group games by day
      const gamesByDay = new Map<number, Game[]>();
      monthGames.forEach((game) => {
        if (game.gameDate) {
          const gameDate = parseISO(game.gameDate);
          const day = gameDate.getDate();
          if (!gamesByDay.has(day)) {
            gamesByDay.set(day, []);
          }
          gamesByDay.get(day)!.push(game);
        }
      });

      // Create calendar days for this month
      const days: React.ReactElement[] = [];
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const startDate = startOfWeek(firstDayOfMonth);
      const endDate = endOfWeek(lastDayOfMonth);

      const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });

      calendarDays.forEach((day, index) => {
        const isCurrentMonth = day.getMonth() === month;
        const dayNumber = day.getDate();
        const dayGames = isCurrentMonth ? gamesByDay.get(dayNumber) || [] : [];
        const gameCount = dayGames.length;

        days.push(
          <Box
            key={index}
            sx={{
              width: '14.28%',
              height: '60px',
              border: '1px solid divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isCurrentMonth ? 'white' : 'grey.100',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isCurrentMonth ? 'primary.50' : 'grey.200',
                '& .game-count': {
                  transform: 'scale(1.1)',
                },
              },
            }}
            onClick={() => {
              setFilterType('day');
              setFilterDate(day);
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
                fontSize: '0.75rem',
              }}
            >
              {dayNumber}
            </Typography>
            {gameCount > 0 && (
              <Box
                className="game-count"
                sx={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                {gameCount}
              </Box>
            )}
          </Box>,
        );
      });

      months.push(
        <Box key={month} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark',
                textDecoration: 'underline',
              },
            }}
            onClick={() => {
              setFilterType('month');
              setFilterDate(new Date(year, month, 1));
            }}
            title={`View ${monthName} ${year} in month view`}
          >
            {monthName}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Box
                key={index}
                sx={{
                  width: '14.28%',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  borderBottom: '1px solid divider',
                }}
              >
                {day}
              </Box>
            ))}
            {/* Calendar days */}
            {days}
          </Box>
        </Box>,
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            {year}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                const newYear = year - 1;
                setFilterDate(new Date(newYear, 0, 1));
              }}
            >
              {year - 1}
            </Button>
            <Button variant="contained" onClick={() => setFilterDate(new Date())}>
              Today
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const newYear = year + 1;
                setFilterDate(new Date(newYear, 0, 1));
              }}
            >
              {year + 1}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {months}
        </Box>
      </Box>
    );
  };

  if (loadingStaticData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <main className="min-h-screen bg-background">
        <AccountPageHeader
          accountId={accountId}
          style={{ marginBottom: 1 }}
          seasonName={currentSeasonName}
          showSeasonInfo={true}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Schedule
              </Typography>

              {user && !canEditSchedule && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
                  Read-only mode - Contact an administrator for editing permissions
                </Typography>
              )}
            </Box>
          </Box>
        </AccountPageHeader>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={viewMode}
            onChange={(_, newValue: string) => setViewMode(newValue as 'calendar' | 'list')}
          >
            <Tab label="Calendar View" value="calendar" />
            <Tab label="List View" value="list" />
          </Tabs>
        </Paper>

        {/* Filter Controls */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
              Time Period:
            </Typography>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'day' | 'week' | 'month' | 'year')}
                label="Time Period"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {filterType === 'day' && (
                <DatePicker
                  label="Select Date"
                  value={filterDate}
                  onChange={(newValue) => setFilterDate(newValue || new Date())}
                  slotProps={{ textField: { sx: { minWidth: 150 } } }}
                />
              )}
              {filterType === 'week' && (
                <DatePicker
                  label="Select Week"
                  value={filterDate}
                  onChange={(newValue) => setFilterDate(newValue || new Date())}
                  slotProps={{ textField: { sx: { minWidth: 150 } } }}
                />
              )}
              {filterType === 'month' && (
                <DatePicker
                  label="Select Month"
                  value={filterDate}
                  onChange={(newValue) => setFilterDate(newValue || new Date())}
                  slotProps={{ textField: { sx: { minWidth: 150 } } }}
                />
              )}
              {filterType === 'year' && (
                <DatePicker
                  label="Select Year"
                  value={filterDate}
                  onChange={(newValue) => setFilterDate(newValue || new Date())}
                  slotProps={{ textField: { sx: { minWidth: 150 } } }}
                />
              )}
            </LocalizationProvider>

            {/* League Filter Dropdown */}
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>League</InputLabel>
              <Select
                value={filterLeagueSeasonId}
                onChange={(e) => setFilterLeagueSeasonId(e.target.value)}
                label="League"
              >
                <MenuItem value="">All Leagues</MenuItem>
                {leagues.map((league) => (
                  <MenuItem key={league.id} value={league.id}>
                    {league.name || 'Unknown League'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Team Filter Dropdown */}
            <FormControl sx={{ minWidth: 160 }} disabled={!filterLeagueSeasonId}>
              <InputLabel>Team</InputLabel>
              <Select
                value={filterTeamSeasonId}
                onChange={(e) => setFilterTeamSeasonId(e.target.value)}
                label="Team"
              >
                <MenuItem value="">All Teams</MenuItem>
                {leagueTeams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {canEditSchedule ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  initializeCreateForm();
                  setCreateDialogOpen(true);
                }}
                sx={{ ml: 'auto' }}
              >
                Add Game
              </Button>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
                {filterType === 'day' && `Showing games for ${format(filterDate, 'MMMM d, yyyy')}`}
                {filterType === 'week' &&
                  `Showing games for week of ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`}
                {filterType === 'month' && `Showing games for ${format(filterDate, 'MMMM yyyy')}`}
                {filterType === 'year' && `Showing games for ${format(filterDate, 'yyyy')}`}
              </Typography>
            )}
          </Box>
        </Paper>

        {viewMode === 'calendar' || viewMode === 'list' ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {viewMode === 'calendar' ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={
                      filterType +
                      '-' +
                      (filterType === 'day'
                        ? format(filterDate, 'yyyy-MM-dd')
                        : filterType === 'week'
                          ? format(startDate, 'yyyy-MM-dd')
                          : filterType === 'month'
                            ? format(filterDate, 'yyyy-MM')
                            : filterType === 'year'
                              ? format(filterDate, 'yyyy')
                              : '')
                    }
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35 }}
                  >
                    {filterType === 'month' ? (
                      <Box>
                        {loadingGames && (
                          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Loading games...
                            </Typography>
                          </Box>
                        )}
                        {renderMonthCalendarView()}
                      </Box>
                    ) : filterType === 'week' ? (
                      <Box>
                        {loadingGames && (
                          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Loading games...
                            </Typography>
                          </Box>
                        )}
                        {renderWeekView()}
                      </Box>
                    ) : filterType === 'day' ? (
                      <Box>
                        {loadingGames && (
                          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Loading games...
                            </Typography>
                          </Box>
                        )}
                        {renderDayView()}
                      </Box>
                    ) : (
                      <Box>
                        {loadingGames && (
                          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Loading games...
                            </Typography>
                          </Box>
                        )}
                        {renderYearView()}
                      </Box>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={
                      filterType +
                      '-' +
                      (filterType === 'day'
                        ? format(filterDate, 'yyyy-MM-dd')
                        : filterType === 'week'
                          ? format(startOfWeek(filterDate), 'yyyy-MM-dd')
                          : filterType === 'month'
                            ? format(filterDate, 'yyyy-MM')
                            : filterType === 'year'
                              ? format(filterDate, 'yyyy')
                              : '')
                    }
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35 }}
                  >
                    {loadingGames && (
                      <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Loading games...
                        </Typography>
                      </Box>
                    )}
                    {renderListView()}
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* Create Game Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Game</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {createDialogError && (
                <Alert severity="error" onClose={() => setCreateDialogError(null)}>
                  {createDialogError}
                </Alert>
              )}

              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {filterDate.getFullYear()} Season
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Game Date"
                      value={gameDate}
                      onChange={(newValue) => setGameDate(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Game Time"
                      value={gameTime}
                      onChange={(newValue) => setGameTime(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>League</InputLabel>
                    <Select
                      value={dialogLeagueSeason}
                      onChange={(e) => {
                        setDialogLeagueSeason(e.target.value);
                        setHomeTeamId('');
                        setVisitorTeamId('');
                        if (e.target.value) {
                          loadLeagueTeams(e.target.value);
                        } else {
                          setLeagueTeams([]);
                        }
                      }}
                      label="League"
                    >
                      {leagues.map((league) => (
                        <MenuItem key={league.id} value={league.id}>
                          {league.name || 'Unknown League'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Home Team</InputLabel>
                    <Select
                      value={homeTeamId}
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      label="Home Team"
                      disabled={!canEditSchedule}
                    >
                      {leagueTeams.length === 0 ? (
                        <MenuItem disabled>No teams available</MenuItem>
                      ) : (
                        leagueTeams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Visitor Team</InputLabel>
                    <Select
                      value={visitorTeamId}
                      onChange={(e) => setVisitorTeamId(e.target.value)}
                      label="Visitor Team"
                      disabled={!canEditSchedule}
                    >
                      {leagueTeams.length === 0 ? (
                        <MenuItem disabled>No teams available</MenuItem>
                      ) : (
                        leagueTeams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={fieldId}
                      onChange={(e) => setFieldId(e.target.value)}
                      label="Field"
                      disabled={!canEditSchedule}
                    >
                      <MenuItem value="">No field assigned</MenuItem>
                      {fields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
                disabled={!canEditSchedule}
                slotProps={
                  !canEditSchedule
                    ? {
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }
                    : undefined
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGame} variant="contained">
              Create Game
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Game Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{canEditSchedule ? 'Edit Game' : 'View Game'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {editDialogError && (
                <Alert severity="error" onClose={() => setEditDialogError(null)}>
                  {editDialogError}
                </Alert>
              )}

              {selectedGame && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {selectedGame.league?.name || 'Unknown League'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedGame.season?.name || 'Unknown Season'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Game Date"
                        value={gameDate}
                        onChange={(newValue) => setGameDate(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  ) : (
                    <TextField
                      fullWidth
                      label="Game Date"
                      value={selectedGame && gameDate ? format(gameDate, 'EEEE, MMMM d, yyyy') : ''}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <TimePicker
                        label="Game Time"
                        value={gameTime}
                        onChange={(newValue) => setGameTime(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  ) : (
                    <TextField
                      fullWidth
                      label="Game Time"
                      value={selectedGame && gameTime ? format(gameTime, 'h:mm a') : ''}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <FormControl fullWidth>
                      <InputLabel>Home Team</InputLabel>
                      <Select
                        value={homeTeamId}
                        onChange={(e) => setHomeTeamId(e.target.value)}
                        label="Home Team"
                        disabled={false}
                      >
                        {leagueTeams.length === 0 ? (
                          <MenuItem disabled>No teams available</MenuItem>
                        ) : (
                          leagueTeams.map((team) => (
                            <MenuItem key={team.id} value={team.id}>
                              {team.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Home Team"
                      value={selectedGame ? getTeamName(selectedGame.homeTeamId) : ''}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <FormControl fullWidth>
                      <InputLabel>Visitor Team</InputLabel>
                      <Select
                        value={visitorTeamId}
                        onChange={(e) => setVisitorTeamId(e.target.value)}
                        label="Visitor Team"
                        disabled={false}
                      >
                        {leagueTeams.length === 0 ? (
                          <MenuItem disabled>No teams available</MenuItem>
                        ) : (
                          leagueTeams.map((team) => (
                            <MenuItem key={team.id} value={team.id}>
                              {team.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Visitor Team"
                      value={selectedGame ? getTeamName(selectedGame.visitorTeamId) : ''}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <FormControl fullWidth>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={fieldId}
                        onChange={(e) => setFieldId(e.target.value)}
                        label="Field"
                      >
                        <MenuItem value="">No field assigned</MenuItem>
                        {fields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Field"
                      value={selectedGame ? getFieldName(selectedGame.fieldId) : ''}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  {canEditSchedule ? (
                    <FormControl fullWidth>
                      <InputLabel>Game Type</InputLabel>
                      <Select
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value as number)}
                        label="Game Type"
                      >
                        <MenuItem value={0}>Regular Season</MenuItem>
                        <MenuItem value={1}>Playoff</MenuItem>
                        <MenuItem value={2}>Exhibition</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Game Type"
                      value={getGameTypeText(gameType)}
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
                disabled={!canEditSchedule}
                slotProps={
                  !canEditSchedule
                    ? {
                        input: {
                          readOnly: true,
                          sx: {
                            color: 'text.primary',
                          },
                        },
                      }
                    : undefined
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            {canEditSchedule && (
              <Button
                onClick={() => {
                  setEditDialogOpen(false);
                  openDeleteDialog(selectedGame!);
                }}
                color="error"
              >
                Delete Game
              </Button>
            )}
            {canEditSchedule && (
              <Button onClick={handleUpdateGame} variant="contained">
                Update Game
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Game</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this game? This action cannot be undone.
            </Typography>
            {selectedGame && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  {getTeamName(selectedGame.visitorTeamId)} @ {getTeamName(selectedGame.homeTeamId)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedGame.gameDate
                    ? format(parseISO(selectedGame.gameDate), 'EEEE, MMMM d, yyyy h:mm a')
                    : 'TBD'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteGame} variant="contained" color="error">
              Delete Game
            </Button>
          </DialogActions>
        </Dialog>

        {/* Game Results Dialog */}
        {canEditSchedule && (
          <EnterGameResultsDialog
            open={gameResultsDialogOpen}
            onClose={() => {
              setGameResultsDialogOpen(false);
              setSelectedGameForResults(null);
            }}
            game={
              selectedGameForResults
                ? {
                    id: selectedGameForResults.id,
                    date: selectedGameForResults.gameDate,
                    homeTeamId: selectedGameForResults.homeTeamId,
                    awayTeamId: selectedGameForResults.visitorTeamId,
                    homeTeamName: getTeamName(selectedGameForResults.homeTeamId),
                    awayTeamName: getTeamName(selectedGameForResults.visitorTeamId),
                    homeScore: selectedGameForResults.homeScore,
                    awayScore: selectedGameForResults.visitorScore,
                    gameStatus: selectedGameForResults.gameStatus,
                    gameStatusText: getGameStatusText(selectedGameForResults.gameStatus),
                    leagueName: selectedGameForResults.league?.name || 'Unknown League',
                    fieldId: selectedGameForResults.fieldId || null,
                    fieldName: selectedGameForResults.field?.name || null,
                    fieldShortName: selectedGameForResults.field?.shortName || null,
                    hasGameRecap: false,
                    gameRecaps: [],
                  }
                : null
            }
            onSave={handleSaveGameResults}
          />
        )}
      </main>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;
