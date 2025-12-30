'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Breadcrumbs,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Select,
  MenuItem,
  FormControl,
  Link as MuiLink,
  Fab,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  RemoveCircleOutline as RemoveIcon,
  People as PeopleIcon,
  NavigateNext as NavigateNextIcon,
  GolfCourse as GolfCourseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccountSeason } from '@draco/shared-api-client';
import type {
  GolfFlightWithTeamCountType,
  GolfFlightType,
  GolfTeamType,
  SeasonType,
} from '@draco/shared-schemas';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import { useGolfFlights } from '../../../../../../../hooks/useGolfFlights';
import { useGolfTeams } from '../../../../../../../hooks/useGolfTeams';
import {
  CreateFlightDialog,
  EditFlightDialog,
  DeleteFlightDialog,
} from '../../../../../../../components/golf/flights';
import {
  CreateGolfTeamDialog,
  DeleteGolfTeamDialog,
} from '../../../../../../../components/golf/teams';

interface GolfFlightWithTeams extends GolfFlightWithTeamCountType {
  teams: GolfTeamType[];
}

interface GolfFlightManagementProps {
  accountId: string;
  seasonId: string;
  onClose: () => void;
}

const GolfFlightManagement: React.FC<GolfFlightManagementProps> = ({
  accountId,
  seasonId,
  onClose: _onClose,
}) => {
  const [flights, setFlights] = useState<GolfFlightWithTeams[]>([]);
  const [unassignedTeams, setUnassignedTeams] = useState<GolfTeamType[]>([]);
  const [leagueSeasonId, setLeagueSeasonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();
  const apiClient = useApiClient();
  const [season, setSeason] = useState<SeasonType | null>(null);

  const flightService = useGolfFlights(accountId);
  const teamService = useGolfTeams(accountId);

  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  const [createFlightDialogOpen, setCreateFlightDialogOpen] = useState(false);
  const [editFlightDialogOpen, setEditFlightDialogOpen] = useState(false);
  const [deleteFlightDialogOpen, setDeleteFlightDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<GolfFlightWithTeams | null>(null);

  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<GolfTeamType | null>(null);
  const [teamTargetFlight, setTeamTargetFlight] = useState<GolfFlightWithTeams | null>(null);

  const [selectedTeamPerFlight, setSelectedTeamPerFlight] = useState<Record<string, string>>({});

  const seasonName = season?.name ?? 'Season';

  const handleFeedbackClose = useCallback(() => {
    setFeedback(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchSeason = async () => {
      try {
        const result = await getAccountSeason({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const seasonResult = unwrapApiResult(result, 'Failed to fetch season');
        if (!isMounted) return;
        setSeason(seasonResult);

        if (seasonResult.leagues && seasonResult.leagues.length > 0) {
          setLeagueSeasonId(seasonResult.leagues[0].id);
        }
      } catch {
        if (!isMounted) return;
        setFeedback({ severity: 'error', message: 'Failed to load season details.' });
      }
    };

    void fetchSeason();

    return () => {
      isMounted = false;
    };
  }, [accountId, seasonId, apiClient]);

  const fetchFlightsWithTeams = useCallback(async () => {
    if (!seasonId || !leagueSeasonId) return;

    setLoading(true);
    try {
      const [flightsResult, unassignedResult] = await Promise.all([
        flightService.listFlightsForLeagueSeason(seasonId, leagueSeasonId),
        teamService.listUnassignedTeams(seasonId),
      ]);

      if (!flightsResult.success) {
        setFeedback({ severity: 'error', message: flightsResult.error });
        return;
      }

      if (!unassignedResult.success) {
        setFeedback({ severity: 'error', message: unassignedResult.error });
        return;
      }

      const flightsWithTeams: GolfFlightWithTeams[] = await Promise.all(
        flightsResult.data.map(async (flight) => {
          const teamsResult = await teamService.listTeamsForFlight(flight.id);
          return {
            ...flight,
            teams: teamsResult.success ? teamsResult.data : [],
          };
        }),
      );

      setFlights(flightsWithTeams);
      setUnassignedTeams(unassignedResult.data);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch flights',
      });
    } finally {
      setLoading(false);
    }
  }, [seasonId, leagueSeasonId, flightService, teamService]);

  useEffect(() => {
    if (leagueSeasonId) {
      void fetchFlightsWithTeams();
    }
  }, [leagueSeasonId, fetchFlightsWithTeams]);

  const addFlightToState = useCallback((flight: GolfFlightType) => {
    const flightWithTeams: GolfFlightWithTeams = {
      ...flight,
      teamCount: 0,
      playerCount: 0,
      teams: [],
    };
    setFlights((prev) => [...prev, flightWithTeams]);
  }, []);

  const updateFlightInState = useCallback((flightId: string, updatedFlight: GolfFlightType) => {
    setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, ...updatedFlight } : f)));
  }, []);

  const removeFlightFromState = useCallback((flightId: string) => {
    setFlights((prev) => {
      const flightToRemove = prev.find((f) => f.id === flightId);
      const teamsToMove = flightToRemove?.teams || [];
      const updatedFlights = prev.filter((f) => f.id !== flightId);

      if (teamsToMove.length > 0) {
        setUnassignedTeams((prevUnassigned) => [...prevUnassigned, ...teamsToMove]);
      }

      return updatedFlights;
    });
  }, []);

  const addTeamToFlightInState = useCallback((flightId: string, team: GolfTeamType) => {
    setFlights((prev) =>
      prev.map((f) => {
        if (f.id !== flightId) return f;
        return {
          ...f,
          teams: [...f.teams, team],
          teamCount: (f.teamCount || 0) + 1,
        };
      }),
    );
    setUnassignedTeams((prev) => prev.filter((t) => t.id !== team.id));
  }, []);

  const removeTeamFromFlightInState = useCallback((flightId: string, teamId: string) => {
    setFlights((prev) =>
      prev.map((f) => {
        if (f.id !== flightId) return f;
        const removedTeam = f.teams.find((t) => t.id === teamId);
        if (removedTeam) {
          setUnassignedTeams((prevUnassigned) => [...prevUnassigned, removedTeam]);
        }
        return {
          ...f,
          teams: f.teams.filter((t) => t.id !== teamId),
          teamCount: Math.max((f.teamCount || 0) - 1, 0),
        };
      }),
    );
  }, []);

  const addTeamToUnassignedInState = useCallback((team: GolfTeamType) => {
    setUnassignedTeams((prev) => [...prev, team]);
  }, []);

  const removeTeamFromState = useCallback((teamId: string) => {
    setFlights((prev) =>
      prev.map((f) => ({
        ...f,
        teams: f.teams.filter((t) => t.id !== teamId),
        teamCount: f.teams.some((t) => t.id === teamId)
          ? Math.max((f.teamCount || 0) - 1, 0)
          : f.teamCount,
      })),
    );
    setUnassignedTeams((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

  const handleAccordionChange =
    (flightId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordions((prev) => {
        const newSet = new Set(prev);
        if (isExpanded) {
          newSet.add(flightId);
        } else {
          newSet.delete(flightId);
        }
        return newSet;
      });
    };

  const handleCreateFlight = () => {
    setCreateFlightDialogOpen(true);
  };

  const handleEditFlight = (flight: GolfFlightWithTeams) => {
    setSelectedFlight(flight);
    setEditFlightDialogOpen(true);
  };

  const handleDeleteFlight = (flight: GolfFlightWithTeams) => {
    setSelectedFlight(flight);
    setDeleteFlightDialogOpen(true);
  };

  const handleCreateTeam = (flight: GolfFlightWithTeams | null) => {
    setTeamTargetFlight(flight);
    setCreateTeamDialogOpen(true);
  };

  const handleDeleteTeam = (team: GolfTeamType, flight: GolfFlightWithTeams | null) => {
    setSelectedTeam(team);
    setTeamTargetFlight(flight);
    setDeleteTeamDialogOpen(true);
  };

  const handleManageRoster = (team: GolfTeamType) => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/teams/${team.id}`);
  };

  const handleAssignTeamToFlight = async (flightId: string, teamId: string) => {
    setFormLoading(true);
    try {
      const result = await teamService.assignToFlight(teamId, flightId);
      if (result.success) {
        const team = unassignedTeams.find((t) => t.id === teamId);
        if (team) {
          addTeamToFlightInState(flightId, {
            ...team,
            flight: flights.find((f) => f.id === flightId),
          });
        }
        setFeedback({ severity: 'success', message: result.message });
        setSelectedTeamPerFlight((prev) => ({ ...prev, [flightId]: '' }));
      } else {
        setFeedback({ severity: 'error', message: result.error });
      }
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to assign team',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveTeamFromFlight = async (flightId: string, team: GolfTeamType) => {
    setFormLoading(true);
    try {
      const result = await teamService.removeFromFlight(team.id);
      if (result.success) {
        removeTeamFromFlightInState(flightId, team.id);
        setFeedback({ severity: 'success', message: `Team "${team.name}" removed from flight` });
      } else {
        setFeedback({ severity: 'error', message: result.error });
      }
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove team from flight',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleFlightCreated = (flight: GolfFlightType, message: string) => {
    addFlightToState(flight);
    setFeedback({ severity: 'success', message });
    setCreateFlightDialogOpen(false);
  };

  const handleFlightUpdated = (flight: GolfFlightType, message: string) => {
    updateFlightInState(flight.id, flight);
    setFeedback({ severity: 'success', message });
    setEditFlightDialogOpen(false);
    setSelectedFlight(null);
  };

  const handleFlightDeleted = (flightId: string, message: string) => {
    removeFlightFromState(flightId);
    setFeedback({ severity: 'success', message });
    setDeleteFlightDialogOpen(false);
    setSelectedFlight(null);
  };

  const handleTeamCreated = (team: GolfTeamType, message: string) => {
    if (teamTargetFlight) {
      addTeamToFlightInState(teamTargetFlight.id, team);
    } else {
      addTeamToUnassignedInState(team);
    }
    setFeedback({ severity: 'success', message });
    setCreateTeamDialogOpen(false);
    setTeamTargetFlight(null);
  };

  const handleTeamDeleted = (teamId: string, message: string) => {
    removeTeamFromState(teamId);
    setFeedback({ severity: 'success', message });
    setDeleteTeamDialogOpen(false);
    setSelectedTeam(null);
    setTeamTargetFlight(null);
  };

  const renderTeamRow = (team: GolfTeamType, flight: GolfFlightWithTeams | null) => (
    <Box
      key={team.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body1">{team.name}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Manage Roster">
          <IconButton size="small" onClick={() => handleManageRoster(team)} color="primary">
            <PeopleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {flight && (
          <Tooltip title="Remove from Flight">
            <IconButton
              size="small"
              onClick={() => handleRemoveTeamFromFlight(flight.id, team)}
              disabled={formLoading}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete Team">
          <IconButton size="small" onClick={() => handleDeleteTeam(team, flight)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderFlightAccordion = (flight: GolfFlightWithTeams) => (
    <Accordion
      key={flight.id}
      expanded={expandedAccordions.has(flight.id)}
      onChange={handleAccordionChange(flight.id)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <GolfCourseIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {flight.name}
          </Typography>
          <Chip
            label={`${flight.teamCount || 0} teams`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Tooltip title="Edit Flight">
            <IconButton
              component="span"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditFlight(flight);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Flight">
            <IconButton
              component="span"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFlight(flight);
              }}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {flight.teams.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No teams in this flight yet. Add teams using the dropdown below.
          </Typography>
        ) : (
          flight.teams.map((team) => renderTeamRow(team, flight))
        )}
      </AccordionDetails>
      <AccordionActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          {unassignedTeams.length > 0 && (
            <>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedTeamPerFlight[flight.id] || ''}
                  onChange={(e) =>
                    setSelectedTeamPerFlight((prev) => ({
                      ...prev,
                      [flight.id]: e.target.value,
                    }))
                  }
                  displayEmpty
                  disabled={formLoading}
                >
                  <MenuItem value="" disabled>
                    Select unassigned team...
                  </MenuItem>
                  {unassignedTeams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  handleAssignTeamToFlight(flight.id, selectedTeamPerFlight[flight.id])
                }
                disabled={!selectedTeamPerFlight[flight.id] || formLoading}
              >
                Add
              </Button>
            </>
          )}
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={() => handleCreateTeam(flight)}
          disabled={formLoading}
        >
          Create Team
        </Button>
      </AccordionActions>
    </Accordion>
  );

  if (loading && flights.length === 0) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Golf Flight Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage flights and teams for {seasonName}
        </Typography>
      </AccountPageHeader>

      <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 3, py: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <MuiLink
            component={Link}
            href={`/account/${accountId}/seasons`}
            underline="hover"
            color="inherit"
          >
            Seasons
          </MuiLink>
          <MuiLink
            component={Link}
            href={`/account/${accountId}/seasons/${seasonId}`}
            underline="hover"
            color="inherit"
          >
            {seasonName}
          </MuiLink>
          <Typography color="text.primary">Golf Flights</Typography>
        </Breadcrumbs>

        {feedback && (
          <Snackbar
            open={!!feedback}
            autoHideDuration={6000}
            onClose={handleFeedbackClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity={feedback.severity}
              onClose={handleFeedbackClose}
              sx={{ width: '100%' }}
            >
              {feedback.message}
            </Alert>
          </Snackbar>
        )}

        {flights.length === 0 && !loading ? (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <GolfCourseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Flights Created
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first flight to organize teams for this golf season.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateFlight}>
                Create First Flight
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {flights.map(renderFlightAccordion)}

            {unassignedTeams.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {unassignedTeams.length} Unassigned Team{unassignedTeams.length > 1 ? 's' : ''}
                </Typography>
                <Typography variant="body2">
                  The following teams are not assigned to any flight:{' '}
                  {unassignedTeams.map((t) => t.name).join(', ')}
                </Typography>
              </Alert>
            )}
          </>
        )}

        <Fab
          color="primary"
          aria-label="create flight"
          onClick={handleCreateFlight}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>

        <CreateFlightDialog
          open={createFlightDialogOpen}
          onClose={() => setCreateFlightDialogOpen(false)}
          accountId={accountId}
          seasonId={seasonId}
          leagueSeasonId={leagueSeasonId}
          onSuccess={handleFlightCreated}
        />

        <EditFlightDialog
          open={editFlightDialogOpen}
          onClose={() => {
            setEditFlightDialogOpen(false);
            setSelectedFlight(null);
          }}
          accountId={accountId}
          flight={selectedFlight}
          onSuccess={handleFlightUpdated}
        />

        <DeleteFlightDialog
          open={deleteFlightDialogOpen}
          onClose={() => {
            setDeleteFlightDialogOpen(false);
            setSelectedFlight(null);
          }}
          accountId={accountId}
          flight={selectedFlight}
          onSuccess={handleFlightDeleted}
        />

        <CreateGolfTeamDialog
          open={createTeamDialogOpen}
          onClose={() => {
            setCreateTeamDialogOpen(false);
            setTeamTargetFlight(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          leagueSeasonId={leagueSeasonId}
          flightId={teamTargetFlight?.id}
          flightName={teamTargetFlight?.name}
          onSuccess={handleTeamCreated}
        />

        <DeleteGolfTeamDialog
          open={deleteTeamDialogOpen}
          onClose={() => {
            setDeleteTeamDialogOpen(false);
            setSelectedTeam(null);
            setTeamTargetFlight(null);
          }}
          accountId={accountId}
          team={selectedTeam}
          onSuccess={handleTeamDeleted}
        />
      </Box>
    </Box>
  );
};

export default GolfFlightManagement;
