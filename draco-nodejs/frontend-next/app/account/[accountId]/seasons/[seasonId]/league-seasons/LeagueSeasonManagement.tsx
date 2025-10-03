import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Remove as RemoveIcon,
  Sports as SportsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { isAxiosError } from '../../../../../../context/AccountContext';
import {
  deleteLeague,
  listSeasonLeagueSeasons,
  addDivisionToLeagueSeason as apiAddDivisionToLeagueSeason,
  deleteLeagueSeasonDivision as apiDeleteLeagueSeasonDivision,
  updateLeagueSeasonDivision as apiUpdateLeagueSeasonDivision,
  assignLeagueSeasonTeamDivision as apiAssignLeagueSeasonTeamDivision,
  removeLeagueSeasonTeamDivision as apiRemoveLeagueSeasonTeamDivision,
  removeLeagueFromSeason as apiRemoveLeagueFromSeason,
} from '@draco/shared-api-client';
import { createApiClient } from '../../../../../../lib/apiClientFactory';
import { unwrapApiResult } from '../../../../../../utils/apiResult';
import { mapLeagueSetup } from '../../../../../../utils/leagueSeasonMapper';

interface LeagueSeason {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions: DivisionSeason[];
  unassignedTeams: TeamSeason[];
}

interface DivisionSeason {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: TeamSeason[];
}

interface TeamSeason {
  id: string;
  teamId: string;
  name: string;
  webAddress: string;
  youtubeUserId: string;
  defaultVideo: string;
  autoPlayVideo: boolean;
}

interface Division {
  id: string;
  name: string;
  accountId: string;
}

interface Season {
  id: string;
  name: string;
  accountId: string;
}

interface LeagueSeasonManagementProps {
  accountId: string;
  season: Season;
  token: string;
  onClose: () => void;
}

const LeagueSeasonManagement: React.FC<LeagueSeasonManagementProps> = ({
  accountId,
  season,
  token,
  onClose,
}) => {
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeason[]>([]);
  // Remove global divisions state and fetchDivisions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();
  const apiClient = useMemo(() => createApiClient({ token: token || undefined }), [token]);

  // Division management state
  const [addDivisionDialogOpen, setAddDivisionDialogOpen] = useState(false);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<LeagueSeason | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionPriority, setDivisionPriority] = useState(0);

  // Division creation within Add Division dialog state
  const [createDivisionInAddDialog, setCreateDivisionInAddDialog] = useState(false);
  const [newDivisionNameInAddDialog, setNewDivisionNameInAddDialog] = useState('');

  // Team assignment state
  const [assignTeamDialogOpen, setAssignTeamDialogOpen] = useState(false);
  const [selectedTeamSeason] = useState<TeamSeason | null>(null);
  const [selectedTeamLeagueSeason] = useState<LeagueSeason | null>(null);
  const [targetDivisionSeason, setTargetDivisionSeason] = useState<DivisionSeason | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Delete league state
  const [deleteLeagueDialogOpen, setDeleteLeagueDialogOpen] = useState(false);
  const [leagueToDelete, setLeagueToDelete] = useState<LeagueSeason | null>(null);

  // Delete team state
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamSeason | null>(null);
  const [teamToDeleteLeagueSeason, setTeamToDeleteLeagueSeason] = useState<LeagueSeason | null>(
    null,
  );

  // Create team state
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [teamToCreateLeagueSeason, setTeamToCreateLeagueSeason] = useState<LeagueSeason | null>(
    null,
  );
  const [newTeamName, setNewTeamName] = useState('');

  // Edit division state
  const [editDivisionDialogOpen, setEditDivisionDialogOpen] = useState(false);
  const [divisionToEdit, setDivisionToEdit] = useState<DivisionSeason | null>(null);
  const [leagueSeasonForEdit, setLeagueSeasonForEdit] = useState<LeagueSeason | null>(null);
  const [editDivisionName, setEditDivisionName] = useState('');
  const [editDivisionPriority, setEditDivisionPriority] = useState(0);

  // State for managing selected teams per division
  const [selectedTeamsPerDivision, setSelectedTeamsPerDivision] = useState<Record<string, string>>(
    {},
  );

  // Helper function to split teams into balanced columns
  const splitTeamsIntoColumns = useCallback((teams: TeamSeason[]) => {
    if (!teams || teams.length === 0) return { leftColumn: [], rightColumn: [] };

    const midPoint = Math.ceil(teams.length / 2);
    return {
      leftColumn: teams.slice(0, midPoint),
      rightColumn: teams.slice(midPoint),
    };
  }, []);

  // Get available divisions (excluding those already assigned to the selected league)
  const availableDivisions = useMemo(() => {
    if (!selectedLeagueSeason) return [];
    return []; // No global divisions list, divisions are fetched per league
  }, [selectedLeagueSeason]);

  // Fetch league seasons with divisions and teams
  const fetchLeagueSeasons = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const result = await listSeasonLeagueSeasons({
        client: apiClient,
        path: { accountId, seasonId: season.id },
        query: { includeTeams: true, includeUnassignedTeams: true },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to fetch league seasons');
      const mapped = mapLeagueSetup(data, accountId);

      const formattedLeagueSeasons = mapped.leagueSeasons.map((leagueSeason) => ({
        id: leagueSeason.id,
        leagueId: leagueSeason.leagueId,
        leagueName: leagueSeason.leagueName,
        accountId: leagueSeason.accountId,
        divisions: leagueSeason.divisions.map((division) => ({
          id: division.id,
          divisionId: division.divisionId,
          divisionName: division.divisionName,
          priority: division.priority,
          teams: division.teams.map((team) => ({
            id: team.id,
            teamId: team.teamId,
            name: team.name,
            webAddress: team.webAddress ?? '',
            youtubeUserId: team.youtubeUserId ?? '',
            defaultVideo: team.defaultVideo ?? '',
            autoPlayVideo: team.autoPlayVideo,
          })),
        })),
        unassignedTeams: leagueSeason.unassignedTeams.map((team) => ({
          id: team.id,
          teamId: team.teamId,
          name: team.name,
          webAddress: team.webAddress ?? '',
          youtubeUserId: team.youtubeUserId ?? '',
          defaultVideo: team.defaultVideo ?? '',
          autoPlayVideo: team.autoPlayVideo,
        })),
      }));

      setLeagueSeasons(formattedLeagueSeasons);
    } catch (error) {
      console.error('Error fetching league seasons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch league seasons');
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, season.id]);

  // Targeted update functions for better UX
  const removeLeagueSeasonFromState = useCallback((leagueSeasonId: string) => {
    setLeagueSeasons((prev) => prev.filter((ls) => ls.id !== leagueSeasonId));
  }, []);

  const addTeamToDivisionInState = useCallback(
    (leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeason) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: ls.divisions.map((div) => {
              if (div.id !== divisionSeasonId) return div;
              return {
                ...div,
                teams: [...div.teams, teamSeason],
              };
            }),
            unassignedTeams: ls.unassignedTeams?.filter((team) => team.id !== teamSeason.id) || [],
          };
        }),
      );
    },
    [],
  );

  const removeTeamFromDivisionInState = useCallback(
    (leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeason) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: ls.divisions.map((div) => {
              if (div.id !== divisionSeasonId) return div;
              return {
                ...div,
                teams: div.teams.filter((team) => team.id !== teamSeason.id),
              };
            }),
            unassignedTeams: [...(ls.unassignedTeams || []), teamSeason],
          };
        }),
      );
    },
    [],
  );

  const addTeamToLeagueSeasonInState = useCallback(
    (leagueSeasonId: string, teamSeason: TeamSeason) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            unassignedTeams: [...(ls.unassignedTeams || []), teamSeason],
          };
        }),
      );
    },
    [],
  );

  const removeTeamFromLeagueSeasonInState = useCallback(
    (leagueSeasonId: string, teamSeasonId: string) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions:
              ls.divisions?.map((div) => ({
                ...div,
                teams: div.teams?.filter((team) => team.id !== teamSeasonId) || [],
              })) || [],
            unassignedTeams: ls.unassignedTeams?.filter((team) => team.id !== teamSeasonId) || [],
          };
        }),
      );
    },
    [],
  );

  const addDivisionToLeagueSeasonInState = useCallback(
    (leagueSeasonId: string, divisionSeason: DivisionSeason) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: [...(ls.divisions || []), divisionSeason],
          };
        }),
      );
    },
    [],
  );

  const removeDivisionFromLeagueSeasonInState = useCallback(
    (leagueSeasonId: string, divisionSeasonId: string) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          // Move all teams from the deleted division to unassigned
          const divisionToRemove = ls.divisions?.find((div) => div.id === divisionSeasonId);
          const teamsToMove = divisionToRemove ? divisionToRemove.teams || [] : [];

          return {
            ...ls,
            divisions: ls.divisions?.filter((div) => div.id !== divisionSeasonId) || [],
            unassignedTeams: [...(ls.unassignedTeams || []), ...teamsToMove],
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (accountId) {
      fetchLeagueSeasons();
      // Initial fetch for divisions is now handled per league season
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, season.id]);

  // Handler to open add division dialog
  const openAddDivisionDialog = (leagueSeason: LeagueSeason) => {
    setSelectedLeagueSeason(leagueSeason);
    setSelectedDivision(null);
    setDivisionPriority(0);
    setError(null);
    setAddDivisionDialogOpen(true);
  };

  // Handler to add division to league season
  const handleAddDivision = async () => {
    if (!accountId || !token || !selectedLeagueSeason || !selectedDivision) return;

    setFormLoading(true);
    try {
      const result = await apiAddDivisionToLeagueSeason({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: selectedLeagueSeason.id,
        },
        body: {
          divisionId: selectedDivision.id,
          priority: divisionPriority,
        },
        throwOnError: false,
      });

      const divisionSeason = unwrapApiResult(result, 'Failed to add division to league season');

      const mappedDivisionSeason = {
        id: divisionSeason.id,
        divisionId: divisionSeason.division.id,
        divisionName: divisionSeason.division.name,
        priority: divisionSeason.priority,
        teams: [] as TeamSeason[],
      };

      setSuccessMessage(`Division added to ${selectedLeagueSeason.leagueName}`);
      setAddDivisionDialogOpen(false);
      addDivisionToLeagueSeasonInState(selectedLeagueSeason.id, mappedDivisionSeason);
    } catch (error) {
      console.error('Error adding division:', error);
      setError(error instanceof Error ? error.message : 'Failed to add division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to remove division from league season
  const handleRemoveDivision = async (
    leagueSeason: LeagueSeason,
    divisionSeason: DivisionSeason,
  ) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const result = await apiDeleteLeagueSeasonDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: leagueSeason.id,
          divisionSeasonId: divisionSeason.id,
        },
        throwOnError: false,
      });

      const removed = unwrapApiResult(result, 'Failed to remove division from league season');

      if (removed) {
        setSuccessMessage(`Division removed from ${leagueSeason.leagueName}`);
        removeDivisionFromLeagueSeasonInState(leagueSeason.id, divisionSeason.id);
      }
    } catch (error) {
      console.error('Error removing division:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create division within Add Division dialog
  const handleCreateDivisionInAddDialog = async () => {
    if (!accountId || !token || !newDivisionNameInAddDialog.trim() || !selectedLeagueSeason) return;

    setFormLoading(true);
    try {
      const result = await apiAddDivisionToLeagueSeason({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: selectedLeagueSeason.id,
        },
        body: {
          name: newDivisionNameInAddDialog.trim(),
          priority: divisionPriority,
        },
        throwOnError: false,
      });

      const divisionSeason = unwrapApiResult(result, 'Failed to create division');

      const mappedDivisionSeason = {
        id: divisionSeason.id,
        divisionId: divisionSeason.division.id,
        divisionName: divisionSeason.division.name,
        priority: divisionSeason.priority,
        teams: [] as TeamSeason[],
      };

      setSuccessMessage(
        `Division "${mappedDivisionSeason.divisionName}" created and added to league "${selectedLeagueSeason.leagueName}"`,
      );
      addDivisionToLeagueSeasonInState(selectedLeagueSeason.id, mappedDivisionSeason);

      setCreateDivisionInAddDialog(false);
      setNewDivisionNameInAddDialog('');
      setAddDivisionDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create division');
    } finally {
      setFormLoading(false);
    }
  };

  // Direct assignment function for single division scenario
  const handleAssignTeamToDivisionDirectly = async (
    teamSeason: TeamSeason,
    leagueSeason: LeagueSeason,
    divisionSeason: DivisionSeason,
  ) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const result = await apiAssignLeagueSeasonTeamDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: leagueSeason.id,
          teamSeasonId: teamSeason.id,
        },
        body: { divisionSeasonId: divisionSeason.id },
        throwOnError: false,
      });

      const assigned = unwrapApiResult(result, 'Failed to assign team to division');

      if (assigned) {
        setSuccessMessage(
          `Team "${teamSeason.name}" automatically assigned to division "${divisionSeason.divisionName}"`,
        );
        addTeamToDivisionInState(leagueSeason.id, divisionSeason.id, teamSeason);
      }
    } catch (error) {
      console.error('Error assigning team to division:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign team to division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to assign team to division (used by dialog)
  const handleAssignTeamToDivision = async () => {
    if (
      !accountId ||
      !token ||
      !selectedTeamSeason ||
      !targetDivisionSeason ||
      !selectedTeamLeagueSeason
    ) {
      return;
    }

    setFormLoading(true);
    try {
      const result = await apiAssignLeagueSeasonTeamDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: selectedTeamLeagueSeason.id,
          teamSeasonId: selectedTeamSeason.id,
        },
        body: { divisionSeasonId: targetDivisionSeason.id },
        throwOnError: false,
      });

      const assigned = unwrapApiResult(result, 'Failed to assign team to division');

      if (assigned) {
        setSuccessMessage(
          `Team "${selectedTeamSeason.name}" assigned to division "${targetDivisionSeason.divisionName}"`,
        );
        setAssignTeamDialogOpen(false);
        addTeamToDivisionInState(
          selectedTeamLeagueSeason.id,
          targetDivisionSeason.id,
          selectedTeamSeason,
        );
      }
    } catch (error) {
      console.error('Error assigning team to division:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign team to division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler for accordion expansion
  const handleAccordionChange =
    (leagueSeasonId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      const newExpanded = new Set(expandedAccordions);
      if (isExpanded) {
        newExpanded.add(leagueSeasonId);
      } else {
        newExpanded.delete(leagueSeasonId);
      }
      setExpandedAccordions(newExpanded);
    };

  // Handler to remove team from division
  const handleRemoveTeamFromDivision = async (
    teamSeason: TeamSeason,
    leagueSeason: LeagueSeason,
  ) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const result = await apiRemoveLeagueSeasonTeamDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: leagueSeason.id,
          teamSeasonId: teamSeason.id,
        },
        throwOnError: false,
      });

      const removed = unwrapApiResult(result, 'Failed to remove team from division');

      if (removed) {
        const divisionSeason = leagueSeason.divisions?.find((div) =>
          div.teams?.some((team) => team.id === teamSeason.id),
        );
        if (divisionSeason) {
          removeTeamFromDivisionInState(leagueSeason.id, divisionSeason.id, teamSeason);
        }
        setSuccessMessage(`Team "${teamSeason.name}" removed from division`);
      }
    } catch (error) {
      console.error('Error removing team from division:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove team from division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to navigate to team roster management
  const handleManageRoster = (teamSeason: TeamSeason) => {
    router.push(`/account/${accountId}/seasons/${season.id}/teams/${teamSeason.id}/roster`);
  };

  // Handler to open delete league dialog
  const openDeleteLeagueDialog = (leagueSeason: LeagueSeason) => {
    setLeagueToDelete(leagueSeason);
    setError(null);
    setDeleteLeagueDialogOpen(true);
  };

  // Handler to delete league
  const handleDeleteLeague = async () => {
    if (!accountId || !token || !leagueToDelete) return;

    setFormLoading(true);
    try {
      const removeResult = await apiRemoveLeagueFromSeason({
        client: apiClient,
        path: { accountId, seasonId: season.id, leagueSeasonId: leagueToDelete.id },
        throwOnError: false,
      });

      const removed = unwrapApiResult(removeResult, 'Failed to remove league from season');

      if (removed) {
        try {
          const deleteLeagueResult = await deleteLeague({
            client: apiClient,
            path: { accountId, leagueId: leagueToDelete.leagueId },
            throwOnError: false,
          });

          const deleteLeagueSuccess = unwrapApiResult(
            deleteLeagueResult,
            'Failed to delete league',
          );

          if (deleteLeagueSuccess) {
            setSuccessMessage(
              `League "${leagueToDelete.leagueName}" has been completely deleted from the system.`,
            );
          } else {
            setSuccessMessage(
              `League "${leagueToDelete.leagueName}" has been removed from this season. The league definition was kept because it's used in other seasons.`,
            );
          }
        } catch (leagueDeleteError: unknown) {
          const message =
            leagueDeleteError instanceof Error ? leagueDeleteError.message : undefined;

          if (typeof message === 'string' && message.includes('associated with seasons')) {
            setSuccessMessage(
              `League "${leagueToDelete.leagueName}" has been removed from this season. The league definition was kept because it's used in other seasons.`,
            );
          } else {
            setSuccessMessage(
              `League "${leagueToDelete.leagueName}" has been removed from this season. There was an issue deleting the league definition, but it may still be removed later.`,
            );
            console.warn('League definition deletion failed:', leagueDeleteError);
          }
        }

        setDeleteLeagueDialogOpen(false);
        setLeagueToDelete(null);
        // Use targeted update instead of full refresh
        removeLeagueSeasonFromState(leagueToDelete.id);
      } else {
        setError('Failed to remove league from season');
      }
    } catch (error: unknown) {
      console.error('Error removing league from season:', error);
      if (isAxiosError(error)) {
        setError(error.response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to remove league from season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to open delete team dialog
  const openDeleteTeamDialog = (teamSeason: TeamSeason, leagueSeason: LeagueSeason) => {
    setTeamToDelete(teamSeason);
    setTeamToDeleteLeagueSeason(leagueSeason);
    setError(null);
    setDeleteTeamDialogOpen(true);
  };

  // Handler to delete team
  const handleDeleteTeam = async () => {
    if (!accountId || !token || !teamToDelete || !teamToDeleteLeagueSeason) return;

    setFormLoading(true);
    try {
      // First, remove the team from this season (delete teamsseason record)
      const removeFromSeasonResponse = await axios.delete(
        `/api/accounts/${accountId}/seasons/${season.id}/teams/${teamToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (removeFromSeasonResponse.data.success) {
        // Now try to delete the team definition (may fail if used in other seasons)
        try {
          const deleteTeamResponse = await axios.delete(
            `/api/accounts/${accountId}/teams/${teamToDelete.teamId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (deleteTeamResponse.data.success) {
            setSuccessMessage(
              `Team "${teamToDelete.name}" has been completely deleted from the system.`,
            );
          } else {
            setSuccessMessage(
              `Team "${teamToDelete.name}" has been removed from this season. The team definition was kept because it's used in other seasons.`,
            );
          }
        } catch (teamDeleteError: unknown) {
          // If team deletion fails because it's used in other seasons, that's expected
          let tStatus: number | undefined = undefined;
          let tMessage: string | undefined = undefined;
          if (
            typeof teamDeleteError === 'object' &&
            teamDeleteError !== null &&
            'response' in teamDeleteError &&
            typeof (teamDeleteError as { response?: unknown }).response === 'object' &&
            (teamDeleteError as { response?: unknown }).response !== null
          ) {
            const tResp = (teamDeleteError as { response: unknown }).response;
            if (typeof tResp === 'object' && tResp !== null) {
              const tRespObj = tResp as Record<string, unknown>;
              if ('status' in tRespObj && typeof tRespObj.status === 'number') {
                tStatus = tRespObj.status;
              }
              if (
                'data' in tRespObj &&
                typeof tRespObj.data === 'object' &&
                tRespObj.data !== null
              ) {
                const tDataObj = tRespObj.data as Record<string, unknown>;
                if ('message' in tDataObj && typeof tDataObj.message === 'string') {
                  tMessage = tDataObj.message;
                }
              }
            }
          }
          if (
            tStatus === 400 &&
            typeof tMessage === 'string' &&
            tMessage.includes('related data')
          ) {
            setSuccessMessage(
              `Team "${teamToDelete.name}" has been removed from this season. The team definition was kept because it's used in other seasons.`,
            );
          } else {
            setSuccessMessage(
              `Team "${teamToDelete.name}" has been removed from this season. There was an issue deleting the team definition, but it may still be removed later.`,
            );
            console.warn('Team definition deletion failed:', teamDeleteError);
          }
        }

        setDeleteTeamDialogOpen(false);
        setTeamToDelete(null);
        setTeamToDeleteLeagueSeason(null);
        // Use targeted update instead of full refresh
        removeTeamFromLeagueSeasonInState(teamToDeleteLeagueSeason.id, teamToDelete.id);
      } else {
        setError(removeFromSeasonResponse.data.message || 'Failed to remove team from season');
      }
    } catch (error: unknown) {
      console.error('Error removing team from season:', error);
      if (isAxiosError(error)) {
        setError(error.response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to remove team from season');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to open create team dialog
  const openCreateTeamDialog = (leagueSeason: LeagueSeason) => {
    setTeamToCreateLeagueSeason(leagueSeason);
    setNewTeamName('');
    setError(null);
    setCreateTeamDialogOpen(true);
  };

  // Handler to create team
  const handleCreateTeam = async () => {
    if (!accountId || !token || !teamToCreateLeagueSeason || !newTeamName.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `/api/accounts/${accountId}/seasons/${season.id}/leagues/${teamToCreateLeagueSeason.id}/teams`,
        { name: newTeamName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setCreateTeamDialogOpen(false);
        setTeamToCreateLeagueSeason(null);
        setNewTeamName('');
        // Use targeted update instead of full refresh
        const newTeam = response.data.data.teamSeason;
        addTeamToLeagueSeasonInState(teamToCreateLeagueSeason.id, newTeam);
      } else {
        setError(response.data.message || 'Failed to create team');
      }
    } catch (error: unknown) {
      console.error('Error creating team:', error);
      if (isAxiosError(error)) {
        setError(error.response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create team');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to open edit division dialog
  const openEditDivisionDialog = (division: DivisionSeason, leagueSeason: LeagueSeason) => {
    setDivisionToEdit(division);
    setLeagueSeasonForEdit(leagueSeason);
    setEditDivisionName(division.divisionName);
    setEditDivisionPriority(division.priority);
    setError(null);
    setEditDivisionDialogOpen(true);
  };

  // Handler to update division
  const handleUpdateDivision = async () => {
    if (!accountId || !token || !divisionToEdit || !leagueSeasonForEdit) return;

    setFormLoading(true);
    try {
      const result = await apiUpdateLeagueSeasonDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId: season.id,
          leagueSeasonId: leagueSeasonForEdit.id,
          divisionSeasonId: divisionToEdit.id,
        },
        body: {
          name: editDivisionName.trim(),
          priority: editDivisionPriority,
        },
        throwOnError: false,
      });

      const updated = unwrapApiResult(result, 'Failed to update division');

      if (updated) {
        setSuccessMessage('Division updated successfully');
        setEditDivisionDialogOpen(false);
        setDivisionToEdit(null);
        setLeagueSeasonForEdit(null);
        setEditDivisionName('');
        setEditDivisionPriority(0);
        fetchLeagueSeasons();
      } else {
        setError('Failed to update division');
      }
    } catch (error) {
      console.error('Error updating division:', error);
      setError(error instanceof Error ? error.message : 'Failed to update division');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            League Season Management
          </Typography>
          <Button variant="outlined" onClick={onClose} startIcon={<RemoveIcon />}>
            Back to Seasons
          </Button>
        </Box>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Season Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Season: {season.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage leagues, divisions, and team assignments for this season
            </Typography>
          </CardContent>
        </Card>

        {/* League Seasons */}
        {leagueSeasons.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" textAlign="center" color="text.secondary">
                No leagues have been added to this season yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          leagueSeasons.map((leagueSeason) => (
            <Accordion
              key={leagueSeason.id}
              sx={{
                mb: 2,
                ...(expandedAccordions.has(leagueSeason.id) && {
                  backgroundColor: 'primary.main',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.main}12 100%)`,
                  borderRadius: 1,
                  '& .MuiAccordionSummary-root': {
                    backgroundColor: 'transparent',
                  },
                  '& .MuiAccordionDetails-root': {
                    backgroundColor: 'transparent',
                  },
                  '& .MuiAccordionActions-root': {
                    backgroundColor: 'transparent',
                  },
                }),
              }}
              expanded={expandedAccordions.has(leagueSeason.id)}
              onChange={handleAccordionChange(leagueSeason.id)}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                  },
                }}
              >
                <Box display="flex" alignItems="center" flex={1} mr={2}>
                  <SportsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{leagueSeason.leagueName}</Typography>
                  <Box display="flex" alignItems="center" gap={1} ml={2}>
                    <Chip
                      label={`${leagueSeason.divisions?.length || 0} divisions`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${leagueSeason.unassignedTeams?.length || 0} unassigned teams`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => openAddDivisionDialog(leagueSeason)}
                  startIcon={<AddIcon />}
                >
                  Add Division
                </Button>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => openCreateTeamDialog(leagueSeason)}
                  startIcon={<AddIcon />}
                >
                  Create Team
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => openDeleteLeagueDialog(leagueSeason)}
                  disabled={formLoading}
                  startIcon={<DeleteIcon />}
                >
                  Remove League
                </Button>
              </AccordionActions>
              <AccordionDetails>
                {/* Divisions with integrated team assignment */}
                {leagueSeason.divisions?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No divisions created yet. Click &quote;Add Division&quote; to create one.
                  </Typography>
                ) : (
                  <Box>
                    {leagueSeason.divisions?.map((division) => (
                      <Card key={division.id} sx={{ mb: 2 }}>
                        <CardContent>
                          {/* Division Header with Team Assignment */}
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            {/* Left side: Division info and action buttons */}
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box>
                                <Typography variant="h6">{division.divisionName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {division.teams?.length || 0} teams • Priority:{' '}
                                  {division.priority}
                                </Typography>
                              </Box>
                              <Box display="flex" gap={0.5} alignItems="center">
                                <Tooltip title="Edit Division">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => openEditDivisionDialog(division, leagueSeason)}
                                    disabled={formLoading}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove Division">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveDivision(leagueSeason, division)}
                                    disabled={formLoading}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Right side: Team assignment controls */}
                            <Box display="flex" gap={1} alignItems="center">
                              {/* Team Assignment Dropdown */}
                              {leagueSeason.unassignedTeams?.length > 0 && (
                                <>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                      value={selectedTeamsPerDivision[division.id] || ''}
                                      onChange={(e) =>
                                        setSelectedTeamsPerDivision({
                                          ...selectedTeamsPerDivision,
                                          [division.id]: e.target.value,
                                        })
                                      }
                                      displayEmpty
                                      disabled={formLoading}
                                      sx={{ bgcolor: 'background.paper' }}
                                    >
                                      <MenuItem value="">
                                        <em>Select team to add...</em>
                                      </MenuItem>
                                      {leagueSeason.unassignedTeams?.map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                          {team.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <Tooltip title="Add Selected Team">
                                    <IconButton
                                      color="primary"
                                      onClick={() => {
                                        const selectedTeamId =
                                          selectedTeamsPerDivision[division.id];
                                        const selectedTeam = leagueSeason.unassignedTeams?.find(
                                          (t) => t.id === selectedTeamId,
                                        );
                                        if (selectedTeam) {
                                          handleAssignTeamToDivisionDirectly(
                                            selectedTeam,
                                            leagueSeason,
                                            division,
                                          );
                                          setSelectedTeamsPerDivision({
                                            ...selectedTeamsPerDivision,
                                            [division.id]: '',
                                          });
                                        }
                                      }}
                                      disabled={
                                        !selectedTeamsPerDivision[division.id] || formLoading
                                      }
                                    >
                                      <AddIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </Box>

                          {/* Teams List */}
                          {division.teams?.length > 0 && (
                            <Box>
                              {(() => {
                                const { leftColumn, rightColumn } = splitTeamsIntoColumns(
                                  division.teams || [],
                                );
                                return (
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: {
                                        xs: '1fr', // Single column on small screens
                                        sm: '1fr 1fr', // Two columns on larger screens
                                      },
                                      gap: 1,
                                    }}
                                  >
                                    {/* Left Column */}
                                    <Box>
                                      {leftColumn.map((team) => (
                                        <Box
                                          key={team.id}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            py: 1,
                                            px: 1.5,
                                            mb: 0.5,
                                            borderRadius: 1,
                                            backgroundColor: 'action.hover',
                                            '&:hover': {
                                              backgroundColor: 'action.selected',
                                            },
                                          }}
                                        >
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {team.name}
                                          </Typography>
                                          <Box display="flex" gap={0.5} alignItems="center">
                                            <Tooltip title="Manage Roster">
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleManageRoster(team)}
                                                disabled={formLoading}
                                              >
                                                <PeopleIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove from Division">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  handleRemoveTeamFromDivision(team, leagueSeason)
                                                }
                                                disabled={formLoading}
                                              >
                                                <RemoveIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove Team from Season">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  openDeleteTeamDialog(team, leagueSeason)
                                                }
                                                disabled={formLoading}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Box>
                                      ))}
                                    </Box>

                                    {/* Right Column */}
                                    <Box>
                                      {rightColumn.map((team) => (
                                        <Box
                                          key={team.id}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            py: 1,
                                            px: 1.5,
                                            mb: 0.5,
                                            borderRadius: 1,
                                            backgroundColor: 'action.hover',
                                            '&:hover': {
                                              backgroundColor: 'action.selected',
                                            },
                                          }}
                                        >
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {team.name}
                                          </Typography>
                                          <Box display="flex" gap={0.5} alignItems="center">
                                            <Tooltip title="Manage Roster">
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleManageRoster(team)}
                                                disabled={formLoading}
                                              >
                                                <PeopleIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove from Division">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  handleRemoveTeamFromDivision(team, leagueSeason)
                                                }
                                                disabled={formLoading}
                                              >
                                                <RemoveIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove Team from Season">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  openDeleteTeamDialog(team, leagueSeason)
                                                }
                                                disabled={formLoading}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                );
                              })()}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Unassigned Teams Summary */}
                    {leagueSeason.unassignedTeams?.length > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {leagueSeason.unassignedTeams.length} unassigned team
                        {leagueSeason.unassignedTeams.length > 1 ? 's' : ''}:{' '}
                        {leagueSeason.unassignedTeams.map((t) => t.name).join(', ')}
                      </Alert>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {/* Add Division Dialog */}
        <Dialog
          open={addDivisionDialogOpen}
          onClose={() => setAddDivisionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Division to League</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Adding division to: <strong>{selectedLeagueSeason?.leagueName}</strong>
            </Typography>

            {!createDivisionInAddDialog ? (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Select Existing Division
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setCreateDivisionInAddDialog(true);
                      setNewDivisionNameInAddDialog('');
                      setError(null);
                    }}
                    startIcon={<AddIcon />}
                    disabled={formLoading}
                  >
                    Create New Division
                  </Button>
                </Box>
                <Autocomplete
                  options={availableDivisions}
                  getOptionLabel={(option) => option.name}
                  value={selectedDivision}
                  onChange={(_, newValue) => setSelectedDivision(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Division"
                      fullWidth
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  )}
                  noOptionsText={
                    availableDivisions.length === 0
                      ? 'All divisions are already assigned to this league'
                      : 'No divisions available'
                  }
                />
                <TextField
                  margin="dense"
                  label="Priority"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={divisionPriority}
                  onChange={(e) => setDivisionPriority(parseInt(e.target.value) || 0)}
                  disabled={formLoading}
                  helperText="Lower numbers have higher priority"
                />
              </>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Create New Division
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setCreateDivisionInAddDialog(false);
                      setSelectedDivision(null);
                      setError(null);
                    }}
                    disabled={formLoading}
                  >
                    Select Existing
                  </Button>
                </Box>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Division Name"
                  fullWidth
                  variant="outlined"
                  value={newDivisionNameInAddDialog}
                  onChange={(e) => setNewDivisionNameInAddDialog(e.target.value)}
                  disabled={formLoading}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  label="Priority"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={divisionPriority}
                  onChange={(e) => setDivisionPriority(parseInt(e.target.value) || 0)}
                  disabled={formLoading}
                  helperText="Lower numbers have higher priority"
                  sx={{ mb: 2 }}
                />
                {selectedLeagueSeason && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This division will be created and added to league &quote;
                    {selectedLeagueSeason.leagueName}&quote;
                  </Typography>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddDivisionDialogOpen(false);
                setCreateDivisionInAddDialog(false);
                setError(null);
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            {!createDivisionInAddDialog ? (
              <Button
                onClick={handleAddDivision}
                variant="contained"
                disabled={formLoading || !selectedDivision}
              >
                {formLoading ? <CircularProgress size={20} /> : 'Add Division'}
              </Button>
            ) : (
              <Button
                onClick={handleCreateDivisionInAddDialog}
                variant="contained"
                disabled={formLoading || !newDivisionNameInAddDialog.trim()}
              >
                {formLoading ? <CircularProgress size={20} /> : 'Create Division'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Assign Team Dialog */}
        <Dialog
          open={assignTeamDialogOpen}
          onClose={() => setAssignTeamDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Team to Division</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Assigning team: <strong>{selectedTeamSeason?.name}</strong>
            </Typography>
            {selectedTeamLeagueSeason?.divisions?.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No divisions are available in this league. Please add divisions to the league first.
              </Alert>
            ) : (
              <Autocomplete
                options={selectedTeamLeagueSeason?.divisions || []}
                getOptionLabel={(option) => option.divisionName}
                value={targetDivisionSeason}
                onChange={(_, newValue) => setTargetDivisionSeason(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Division"
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignTeamDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeamToDivision}
              variant="contained"
              disabled={
                formLoading || !targetDivisionSeason || !selectedTeamLeagueSeason?.divisions?.length
              }
            >
              {formLoading ? <CircularProgress size={20} /> : 'Assign Team'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete League Confirmation Dialog */}
        <Dialog
          open={deleteLeagueDialogOpen}
          onClose={() => setDeleteLeagueDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Remove League from Season</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to remove the league{' '}
              <strong>&quot;{leagueToDelete?.leagueName}&quot;</strong> from this season?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action will remove the league from this season and all its associated data
              (divisions, teams, etc.). The system will also attempt to delete the league definition
              {" if it's not used in other seasons."}
            </Alert>
            {leagueToDelete && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  This league currently has:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {leagueToDelete.divisions?.length || 0} divisions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {leagueToDelete.unassignedTeams?.length || 0} unassigned teams
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteLeagueDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLeague}
              variant="contained"
              color="error"
              disabled={formLoading}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Remove League'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Team Dialog */}
        <Dialog
          open={createTeamDialogOpen}
          onClose={() => setCreateTeamDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Team</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Creating team for league: <strong>{teamToCreateLeagueSeason?.leagueName}</strong>
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Team Name"
              fullWidth
              variant="outlined"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              disabled={formLoading}
              sx={{ mb: 2 }}
              helperText="Enter a unique name for the new team"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateTeamDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              variant="contained"
              disabled={formLoading || !newTeamName.trim()}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Create Team'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Team Confirmation Dialog */}
        <Dialog
          open={deleteTeamDialogOpen}
          onClose={() => setDeleteTeamDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Remove Team from Season</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to remove the team{' '}
              <strong>&quot;{teamToDelete?.name}&quot;</strong> from this season?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action will remove the team from this season and all its associated data
              (divisions, etc.). The system will also attempt to delete the team definition if
              {" it's not used in other seasons."}
            </Alert>
            {teamToDelete && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  This team will be removed from the current season.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTeamDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTeam}
              variant="contained"
              color="error"
              disabled={formLoading}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Remove Team'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Division Dialog */}
        <Dialog
          open={editDivisionDialogOpen}
          onClose={() => setEditDivisionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Division</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Editing division in league: <strong>{leagueSeasonForEdit?.leagueName}</strong>
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Division Name"
              fullWidth
              variant="outlined"
              value={editDivisionName}
              onChange={(e) => setEditDivisionName(e.target.value)}
              disabled={formLoading}
              sx={{ mb: 2 }}
              helperText="Enter the new name for the division"
            />
            <TextField
              margin="dense"
              label="Priority"
              type="number"
              fullWidth
              variant="outlined"
              value={editDivisionPriority}
              onChange={(e) => setEditDivisionPriority(parseInt(e.target.value) || 0)}
              disabled={formLoading}
              helperText="Lower numbers have higher priority"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDivisionDialogOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDivision}
              variant="contained"
              disabled={formLoading || !editDivisionName.trim()}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Update Division'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </main>
  );
};

export default LeagueSeasonManagement;
