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
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Sports as SportsIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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
  onClose
}) => {
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeason[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  // Division management state
  const [addDivisionDialogOpen, setAddDivisionDialogOpen] = useState(false);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<LeagueSeason | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionPriority, setDivisionPriority] = useState(0);

  // Division definition management state
  const [createDivisionDialogOpen, setCreateDivisionDialogOpen] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  
  // Division creation within Add Division dialog state
  const [createDivisionInAddDialog, setCreateDivisionInAddDialog] = useState(false);
  const [newDivisionNameInAddDialog, setNewDivisionNameInAddDialog] = useState('');
  const [addToLeagueAfterCreate, setAddToLeagueAfterCreate] = useState(true);

  // Team assignment state
  const [assignTeamDialogOpen, setAssignTeamDialogOpen] = useState(false);
  const [selectedTeamSeason, setSelectedTeamSeason] = useState<TeamSeason | null>(null);
  const [selectedTeamLeagueSeason, setSelectedTeamLeagueSeason] = useState<LeagueSeason | null>(null);
  const [targetDivisionSeason, setTargetDivisionSeason] = useState<DivisionSeason | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Delete league state
  const [deleteLeagueDialogOpen, setDeleteLeagueDialogOpen] = useState(false);
  const [leagueToDelete, setLeagueToDelete] = useState<LeagueSeason | null>(null);

  // Delete team state
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamSeason | null>(null);
  const [teamToDeleteLeagueSeason, setTeamToDeleteLeagueSeason] = useState<LeagueSeason | null>(null);

  // Create team state
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [teamToCreateLeagueSeason, setTeamToCreateLeagueSeason] = useState<LeagueSeason | null>(null);
  const [newTeamName, setNewTeamName] = useState('');

  // Get available divisions (excluding those already assigned to the selected league)
  const availableDivisions = useMemo(() => {
    if (!selectedLeagueSeason) return divisions;
    
    const assignedDivisionIds = new Set(
      selectedLeagueSeason.divisions.map(div => div.divisionId)
    );
    
    return divisions.filter(division => !assignedDivisionIds.has(division.id));
  }, [divisions, selectedLeagueSeason]);

  // Fetch league seasons with divisions and teams
  const fetchLeagueSeasons = useCallback(async () => {
    if (!accountId || !token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLeagueSeasons(response.data.data.leagueSeasons);
      }
    } catch (error: any) {
      console.error('Error fetching league seasons:', error);
      setError(error.response?.data?.message || 'Failed to fetch league seasons');
    } finally {
      setLoading(false);
    }
  }, [accountId, season.id, token]);

  // Fetch available divisions
  const fetchDivisions = useCallback(async () => {
    if (!accountId || !token) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDivisions(response.data.data.divisions);
      }
    } catch (error: any) {
      console.error('Error fetching divisions:', error);
      setError(error.response?.data?.message || 'Failed to fetch divisions');
    }
  }, [accountId, token]);

  // Targeted update functions for better UX
  const removeLeagueSeasonFromState = useCallback((leagueSeasonId: string) => {
    setLeagueSeasons(prev => prev.filter(ls => ls.id !== leagueSeasonId));
  }, []);

  const addTeamToDivisionInState = useCallback((leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeason) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      return {
        ...ls,
        divisions: ls.divisions.map(div => {
          if (div.id !== divisionSeasonId) return div;
          return {
            ...div,
            teams: [...div.teams, teamSeason]
          };
        }),
        unassignedTeams: ls.unassignedTeams.filter(team => team.id !== teamSeason.id)
      };
    }));
  }, []);

  const removeTeamFromDivisionInState = useCallback((leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeason) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      return {
        ...ls,
        divisions: ls.divisions.map(div => {
          if (div.id !== divisionSeasonId) return div;
          return {
            ...div,
            teams: div.teams.filter(team => team.id !== teamSeason.id)
          };
        }),
        unassignedTeams: [...ls.unassignedTeams, teamSeason]
      };
    }));
  }, []);

  const addTeamToLeagueSeasonInState = useCallback((leagueSeasonId: string, teamSeason: TeamSeason) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      return {
        ...ls,
        unassignedTeams: [...ls.unassignedTeams, teamSeason]
      };
    }));
  }, []);

  const removeTeamFromLeagueSeasonInState = useCallback((leagueSeasonId: string, teamSeasonId: string) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      return {
        ...ls,
        divisions: ls.divisions.map(div => ({
          ...div,
          teams: div.teams.filter(team => team.id !== teamSeasonId)
        })),
        unassignedTeams: ls.unassignedTeams.filter(team => team.id !== teamSeasonId)
      };
    }));
  }, []);

  const addDivisionToLeagueSeasonInState = useCallback((leagueSeasonId: string, divisionSeason: DivisionSeason) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      return {
        ...ls,
        divisions: [...ls.divisions, divisionSeason]
      };
    }));
  }, []);

  const removeDivisionFromLeagueSeasonInState = useCallback((leagueSeasonId: string, divisionSeasonId: string) => {
    setLeagueSeasons(prev => prev.map(ls => {
      if (ls.id !== leagueSeasonId) return ls;
      
      // Move all teams from the deleted division to unassigned
      const divisionToRemove = ls.divisions.find(div => div.id === divisionSeasonId);
      const teamsToMove = divisionToRemove ? divisionToRemove.teams : [];
      
      return {
        ...ls,
        divisions: ls.divisions.filter(div => div.id !== divisionSeasonId),
        unassignedTeams: [...ls.unassignedTeams, ...teamsToMove]
      };
    }));
  }, []);

  useEffect(() => {
    fetchLeagueSeasons();
    fetchDivisions();
  }, [fetchLeagueSeasons, fetchDivisions]);

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
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedLeagueSeason.id}/divisions`,
        {
          divisionId: selectedDivision.id,
          priority: divisionPriority
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setAddDivisionDialogOpen(false);
        // Use targeted update instead of full refresh
        const newDivisionSeason = response.data.data.divisionSeason;
        addDivisionToLeagueSeasonInState(selectedLeagueSeason.id, newDivisionSeason);
      }
    } catch (error: any) {
      console.error('Error adding division:', error);
      setError(error.response?.data?.message || 'Failed to add division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to remove division from league season
  const handleRemoveDivision = async (leagueSeason: LeagueSeason, divisionSeason: DivisionSeason) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueSeason.id}/divisions/${divisionSeason.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        // Use targeted update instead of full refresh
        removeDivisionFromLeagueSeasonInState(leagueSeason.id, divisionSeason.id);
      }
    } catch (error: any) {
      console.error('Error removing division:', error);
      setError(error.response?.data?.message || 'Failed to remove division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create new division definition
  const handleCreateDivision = async () => {
    if (!accountId || !token || !newDivisionName.trim()) return;

    setFormLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { name: newDivisionName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        setCreateDivisionDialogOpen(false);
        setNewDivisionName('');
        fetchDivisions(); // Refresh divisions list
      }
    } catch (error: any) {
      console.error('Error creating division:', error);
      setError(error.response?.data?.message || 'Failed to create division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to create division within Add Division dialog
  const handleCreateDivisionInAddDialog = async () => {
    if (!accountId || !token || !newDivisionNameInAddDialog.trim() || !selectedLeagueSeason) return;

    setFormLoading(true);
    try {
      // Create the division
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/accounts/${accountId}/divisions`,
        { name: newDivisionNameInAddDialog.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (createResponse.data.success) {
        const newDivision = createResponse.data.data.division;
        
        // If checkbox is checked, add the division to the league season
        if (addToLeagueAfterCreate && selectedLeagueSeason) {
          const addResponse = await axios.post(
            `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedLeagueSeason.id}/divisions`,
            {
              divisionId: newDivision.id,
              priority: divisionPriority
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (addResponse.data.success) {
            setSuccessMessage(`Division "${newDivision.name}" created and added to league "${selectedLeagueSeason.leagueName}"`);
            // Use targeted update instead of full refresh
            const newDivisionSeason = addResponse.data.data.divisionSeason;
            addDivisionToLeagueSeasonInState(selectedLeagueSeason.id, newDivisionSeason);
          } else {
            setSuccessMessage(`Division "${newDivision.name}" created successfully, but failed to add to league`);
          }
        } else {
          setSuccessMessage(`Division "${newDivision.name}" created successfully`);
        }

        setCreateDivisionInAddDialog(false);
        setNewDivisionNameInAddDialog('');
        fetchDivisions(); // Still need to refresh divisions list for dropdown
        // fetchLeagueSeasons(); // Removed - using targeted update above
      } else {
        setError(createResponse.data.message || 'Failed to create division');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create division');
    } finally {
      setFormLoading(false);
    }
  };

  // Direct assignment function for single division scenario
  const handleAssignTeamToDivisionDirectly = async (teamSeason: TeamSeason, leagueSeason: LeagueSeason, divisionSeason: DivisionSeason) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueSeason.id}/teams/${teamSeason.id}/assign-division`,
        {
          divisionSeasonId: divisionSeason.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`Team "${teamSeason.name}" automatically assigned to division "${divisionSeason.divisionName}"`);
        // Use targeted update instead of full refresh
        addTeamToDivisionInState(leagueSeason.id, divisionSeason.id, teamSeason);
      }
    } catch (error: any) {
      console.error('Error assigning team to division:', error);
      setError(error.response?.data?.message || 'Failed to assign team to division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to assign team to division (used by dialog)
  const handleAssignTeamToDivision = async () => {
    if (!accountId || !token || !selectedTeamSeason || !targetDivisionSeason || !selectedTeamLeagueSeason) return;

    setFormLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${selectedTeamLeagueSeason.id}/teams/${selectedTeamSeason.id}/assign-division`,
        {
          divisionSeasonId: targetDivisionSeason.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(`Team "${selectedTeamSeason.name}" assigned to division "${targetDivisionSeason.divisionName}"`);
        setAssignTeamDialogOpen(false);
        // Use targeted update instead of full refresh
        addTeamToDivisionInState(selectedTeamLeagueSeason.id, targetDivisionSeason.id, selectedTeamSeason);
      }
    } catch (error: any) {
      console.error('Error assigning team to division:', error);
      setError(error.response?.data?.message || 'Failed to assign team to division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to open assign team dialog
  const openAssignTeamDialog = (teamSeason: TeamSeason, leagueSeason: LeagueSeason) => {
    if (!teamSeason || !leagueSeason) {
      console.error('Invalid parameters for openAssignTeamDialog:', { teamSeason, leagueSeason });
      return;
    }

    // Check if there's only one division - if so, assign automatically
    if (leagueSeason.divisions.length === 1) {
      const singleDivision = leagueSeason.divisions[0];
      handleAssignTeamToDivisionDirectly(teamSeason, leagueSeason, singleDivision);
      return;
    }

    // If multiple divisions, show the dialog as before
    setSelectedTeamSeason(teamSeason);
    setSelectedTeamLeagueSeason(leagueSeason);
    setTargetDivisionSeason(null);
    setError(null);
    
    // Ensure the accordion for this league is expanded
    if (!expandedAccordions.has(leagueSeason.id)) {
      setExpandedAccordions(prev => new Set([...Array.from(prev), leagueSeason.id]));
    }
    
    setAssignTeamDialogOpen(true);
  };

  // Handler for accordion expansion
  const handleAccordionChange = (leagueSeasonId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    const newExpanded = new Set(expandedAccordions);
    if (isExpanded) {
      newExpanded.add(leagueSeasonId);
    } else {
      newExpanded.delete(leagueSeasonId);
    }
    setExpandedAccordions(newExpanded);
  };

  // Handler to remove team from division
  const handleRemoveTeamFromDivision = async (teamSeason: TeamSeason, leagueSeason: LeagueSeason) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueSeason.id}/teams/${teamSeason.id}/remove-from-division`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.data.message);
        // Use targeted update instead of full refresh
        // Find which division the team was in
        const divisionSeason = leagueSeason.divisions.find(div => 
          div.teams.some(team => team.id === teamSeason.id)
        );
        if (divisionSeason) {
          removeTeamFromDivisionInState(leagueSeason.id, divisionSeason.id, teamSeason);
        }
      }
    } catch (error: any) {
      console.error('Error removing team from division:', error);
      setError(error.response?.data?.message || 'Failed to remove team from division');
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to navigate to team roster management
  const handleManageRoster = (teamSeason: TeamSeason) => {
    navigate(`/account/${accountId}/seasons/${season.id}/teams/${teamSeason.id}/roster`);
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
      // First, remove the league from this season (delete leagueseason record)
      const removeFromSeasonResponse = await axios.delete(
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${leagueToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (removeFromSeasonResponse.data.success) {
        // Now try to delete the league definition (may fail if used in other seasons)
        try {
          const deleteLeagueResponse = await axios.delete(
            `${API_BASE_URL}/api/accounts/${accountId}/leagues/${leagueToDelete.leagueId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (deleteLeagueResponse.data.success) {
            setSuccessMessage(`League "${leagueToDelete.leagueName}" has been completely deleted from the system.`);
          } else {
            setSuccessMessage(`League "${leagueToDelete.leagueName}" has been removed from this season. The league definition was kept because it's used in other seasons.`);
          }
        } catch (leagueDeleteError: any) {
          // If league deletion fails because it's used in other seasons, that's expected
          if (leagueDeleteError.response?.status === 400 && 
              leagueDeleteError.response?.data?.message?.includes('associated with seasons')) {
            setSuccessMessage(`League "${leagueToDelete.leagueName}" has been removed from this season. The league definition was kept because it's used in other seasons.`);
          } else {
            // For other errors, show a warning but still consider it a success since the main goal was achieved
            setSuccessMessage(`League "${leagueToDelete.leagueName}" has been removed from this season. There was an issue deleting the league definition, but it may still be removed later.`);
            console.warn('League definition deletion failed:', leagueDeleteError);
          }
        }

        setDeleteLeagueDialogOpen(false);
        setLeagueToDelete(null);
        // Use targeted update instead of full refresh
        removeLeagueSeasonFromState(leagueToDelete.id);
      } else {
        setError(removeFromSeasonResponse.data.message || 'Failed to remove league from season');
      }
    } catch (error: any) {
      console.error('Error removing league from season:', error);
      setError(error.response?.data?.message || 'Failed to remove league from season');
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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/teams/${teamToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (removeFromSeasonResponse.data.success) {
        // Now try to delete the team definition (may fail if used in other seasons)
        try {
          const deleteTeamResponse = await axios.delete(
            `${API_BASE_URL}/api/accounts/${accountId}/teams/${teamToDelete.teamId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (deleteTeamResponse.data.success) {
            setSuccessMessage(`Team "${teamToDelete.name}" has been completely deleted from the system.`);
          } else {
            setSuccessMessage(`Team "${teamToDelete.name}" has been removed from this season. The team definition was kept because it's used in other seasons.`);
          }
        } catch (teamDeleteError: any) {
          // If team deletion fails because it's used in other seasons, that's expected
          if (teamDeleteError.response?.status === 400 && 
              teamDeleteError.response?.data?.message?.includes('related data')) {
            setSuccessMessage(`Team "${teamToDelete.name}" has been removed from this season. The team definition was kept because it's used in other seasons.`);
          } else {
            // For other errors, show a warning but still consider it a success since the main goal was achieved
            setSuccessMessage(`Team "${teamToDelete.name}" has been removed from this season. There was an issue deleting the team definition, but it may still be removed later.`);
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
    } catch (error: any) {
      console.error('Error removing team from season:', error);
      setError(error.response?.data?.message || 'Failed to remove team from season');
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
        `${API_BASE_URL}/api/accounts/${accountId}/seasons/${season.id}/leagues/${teamToCreateLeagueSeason.id}/teams`,
        { name: newTeamName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
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
    } catch (error: any) {
      console.error('Error creating team:', error);
      setError(error.response?.data?.message || 'Failed to create team');
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
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          League Season Management
        </Typography>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<RemoveIcon />}
        >
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
            sx={{ mb: 2 }}
            expanded={expandedAccordions.has(leagueSeason.id)}
            onChange={handleAccordionChange(leagueSeason.id)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box display="flex" alignItems="center">
                  <SportsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {leagueSeason.leagueName}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={`${leagueSeason.divisions.length} divisions`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${leagueSeason.unassignedTeams.length} unassigned teams`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddDivisionDialog(leagueSeason);
                    }}
                  >
                    Add Division
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateTeamDialog(leagueSeason);
                    }}
                  >
                    Create Team
                  </Button>
                  <Tooltip title="Remove League from Season">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteLeagueDialog(leagueSeason);
                      }}
                      disabled={formLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Divisions */}
                <Box flex="1" minWidth="300px">
                  <Typography variant="h6" gutterBottom>
                    Divisions
                  </Typography>
                  {leagueSeason.divisions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No divisions created yet.
                    </Typography>
                  ) : (
                    leagueSeason.divisions.map((division) => (
                      <Card key={division.id} sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle1">
                                {division.divisionName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {division.teams.length} teams • Priority: {division.priority}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Remove Division">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveDivision(leagueSeason, division)}
                                  disabled={formLoading}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          {division.teams.length > 0 && (
                            <Box mt={1}>
                              {division.teams.map((team) => (
                                <Box key={team.id} sx={{ display: 'inline-flex', alignItems: 'center', mr: 0.5, mb: 0.5 }}>
                                  <Chip
                                    label={team.name}
                                    size="small"
                                    sx={{ mr: 0.5 }}
                                  />
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
                                      onClick={() => handleRemoveTeamFromDivision(team, leagueSeason)}
                                      disabled={formLoading}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remove Team from Season">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => openDeleteTeamDialog(team, leagueSeason)}
                                      disabled={formLoading}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>

                {/* Unassigned Teams */}
                <Box flex="1" minWidth="300px">
                  <Typography variant="h6" gutterBottom>
                    Unassigned Teams
                  </Typography>
                  {leagueSeason.unassignedTeams.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      All teams are assigned to divisions.
                    </Typography>
                  ) : (
                    leagueSeason.unassignedTeams.map((team) => (
                      <Card key={team.id} sx={{ mb: 1 }} component="div">
                        <CardContent sx={{ py: 1 }} component="div">
                          <Box display="flex" justifyContent="space-between" alignItems="center" component="div">
                            <Box display="flex" alignItems="center" component="div">
                              <PersonIcon sx={{ mr: 1 }} />
                              <Typography 
                                key={`team-${team.id}`}
                                variant="subtitle1"
                                component="span"
                              >
                                {team.name}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
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
                              <Tooltip title="Assign to Division">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => {
                                    if (leagueSeason) {
                                      openAssignTeamDialog(team, leagueSeason);
                                    }
                                  }}
                                  disabled={formLoading}
                                >
                                  <GroupIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Team from Season">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDeleteTeamDialog(team, leagueSeason)}
                                  disabled={formLoading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Create Division Dialog */}
      <Dialog open={createDivisionDialogOpen} onClose={() => setCreateDivisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Division</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Division Name"
            fullWidth
            variant="outlined"
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            disabled={formLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDivisionDialogOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateDivision} 
            variant="contained" 
            disabled={formLoading || !newDivisionName.trim()}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Create Division'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Division Dialog */}
      <Dialog open={addDivisionDialogOpen} onClose={() => setAddDivisionDialogOpen(false)} maxWidth="sm" fullWidth>
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
                noOptionsText={availableDivisions.length === 0 ? "All divisions are already assigned to this league" : "No divisions available"}
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addToLeagueAfterCreate}
                      onChange={(e) => setAddToLeagueAfterCreate(e.target.checked)}
                      disabled={formLoading}
                    />
                  }
                  label={`Add to league "${selectedLeagueSeason.leagueName}" after creation`}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDivisionDialogOpen(false);
            setCreateDivisionInAddDialog(false);
            setError(null);
          }} disabled={formLoading}>
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
      <Dialog open={assignTeamDialogOpen} onClose={() => setAssignTeamDialogOpen(false)} maxWidth="sm" fullWidth>
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
          {selectedTeamLeagueSeason?.divisions.length === 0 ? (
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
            disabled={formLoading || !targetDivisionSeason || !selectedTeamLeagueSeason?.divisions.length}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Assign Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete League Confirmation Dialog */}
      <Dialog open={deleteLeagueDialogOpen} onClose={() => setDeleteLeagueDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove League from Season</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to remove the league <strong>"{leagueToDelete?.leagueName}"</strong> from this season?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will remove the league from this season and all its associated data (divisions, teams, etc.). The system will also attempt to delete the league definition if it's not used in other seasons.
          </Alert>
          {leagueToDelete && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This league currently has:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {leagueToDelete.divisions.length} divisions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {leagueToDelete.unassignedTeams.length} unassigned teams
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
      <Dialog open={createTeamDialogOpen} onClose={() => setCreateTeamDialogOpen(false)} maxWidth="sm" fullWidth>
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
      <Dialog open={deleteTeamDialogOpen} onClose={() => setDeleteTeamDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Team from Season</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to remove the team <strong>"{teamToDelete?.name}"</strong> from this season?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will remove the team from this season and all its associated data (divisions, etc.). The system will also attempt to delete the team definition if it's not used in other seasons.
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

      {/* Floating Action Button for creating divisions */}
      <Fab
        color="primary"
        aria-label="create division"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDivisionDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default LeagueSeasonManagement; 