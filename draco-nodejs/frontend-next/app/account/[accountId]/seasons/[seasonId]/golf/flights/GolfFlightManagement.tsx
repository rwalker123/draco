'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
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
  People as PeopleIcon,
  GolfCourse as GolfCourseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AdminBreadcrumbs } from '../../../../../../../components/admin';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccountSeason } from '@draco/shared-api-client';
import type {
  GolfFlightWithTeamCountType,
  GolfFlightType,
  GolfTeamType,
  GolfTeamWithPlayerCountType,
  SeasonType,
} from '@draco/shared-schemas';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import { useGolfFlights } from '../../../../../../../hooks/useGolfFlights';
import { useGolfTeams } from '../../../../../../../hooks/useGolfTeams';
import { useGolfLeagueSetup } from '../../../../../../../hooks/useGolfLeagueSetup';
import {
  CreateFlightDialog,
  EditFlightDialog,
  DeleteFlightDialog,
} from '../../../../../../../components/golf/flights';
import {
  CreateGolfTeamDialog,
  EditGolfTeamDialog,
  DeleteGolfTeamDialog,
} from '../../../../../../../components/golf/teams';

interface GolfFlightWithTeams extends GolfFlightWithTeamCountType {
  teams: GolfTeamWithPlayerCountType[];
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
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();
  const apiClient = useApiClient();
  const [season, setSeason] = useState<SeasonType | null>(null);

  const flightService = useGolfFlights(accountId);
  const teamService = useGolfTeams(accountId);
  const firstFlightId = flights.length > 0 ? flights[0].id : null;
  const { setup: leagueSetup } = useGolfLeagueSetup(accountId, seasonId, firstFlightId);

  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  const [createFlightDialogOpen, setCreateFlightDialogOpen] = useState(false);
  const [editFlightDialogOpen, setEditFlightDialogOpen] = useState(false);
  const [deleteFlightDialogOpen, setDeleteFlightDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<GolfFlightWithTeams | null>(null);

  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<GolfTeamType | null>(null);
  const [teamTargetFlight, setTeamTargetFlight] = useState<GolfFlightWithTeams | null>(null);

  const seasonName = season?.name ?? 'Season';

  const getTeamSizeLabel = (size: number) => {
    switch (size) {
      case 1:
        return 'Individual';
      case 2:
        return 'Pairs';
      case 3:
        return 'Threesomes';
      case 4:
        return 'Foursomes';
      default:
        return `${size} players`;
    }
  };

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  useEffect(() => {
    if (!seasonId) return;

    const controller = new AbortController();

    const loadAllData = async () => {
      try {
        const result = await getAccountSeason({
          client: apiClient,
          path: { accountId, seasonId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const seasonResult = unwrapApiResult(result, 'Failed to fetch season');
        setSeason(seasonResult);

        const flightsResult = await flightService.listFlights(seasonId);
        if (controller.signal.aborted) return;

        if (!flightsResult.success) {
          setFeedback({ severity: 'error', message: flightsResult.error });
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

        if (controller.signal.aborted) return;
        setFlights(flightsWithTeams);

        if (flightsWithTeams.length > 0) {
          setExpandedAccordions(new Set([flightsWithTeams[0].id]));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading data:', error);
        setFeedback({
          severity: 'error',
          message: error instanceof Error ? error.message : 'Failed to load data',
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAllData();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, apiClient, flightService, teamService]);

  const addFlightToState = (flight: GolfFlightType) => {
    const flightWithTeams: GolfFlightWithTeams = {
      ...flight,
      teamCount: 0,
      playerCount: 0,
      teams: [],
    };
    setFlights((prev) => [...prev, flightWithTeams]);
  };

  const updateFlightInState = (flightId: string, updatedFlight: GolfFlightType) => {
    setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, ...updatedFlight } : f)));
  };

  const removeFlightFromState = (flightId: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== flightId));
  };

  const addTeamToFlightInState = (
    flightId: string,
    team: GolfTeamType | GolfTeamWithPlayerCountType,
  ) => {
    const teamWithCount: GolfTeamWithPlayerCountType = {
      ...team,
      playerCount: 'playerCount' in team ? team.playerCount : 0,
    };
    setFlights((prev) =>
      prev.map((f) => {
        if (f.id !== flightId) return f;
        return {
          ...f,
          teams: [...f.teams, teamWithCount],
          teamCount: (f.teamCount || 0) + 1,
        };
      }),
    );
  };

  const removeTeamFromState = (teamId: string) => {
    setFlights((prev) =>
      prev.map((f) => ({
        ...f,
        teams: f.teams.filter((t) => t.id !== teamId),
        teamCount: f.teams.some((t) => t.id === teamId)
          ? Math.max((f.teamCount || 0) - 1, 0)
          : f.teamCount,
      })),
    );
  };

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

  const handleCreateTeam = (flight: GolfFlightWithTeams) => {
    setTeamTargetFlight(flight);
    setCreateTeamDialogOpen(true);
  };

  const handleEditTeam = (team: GolfTeamType, flight: GolfFlightWithTeams) => {
    setSelectedTeam(team);
    setTeamTargetFlight(flight);
    setEditTeamDialogOpen(true);
  };

  const handleDeleteTeam = (team: GolfTeamType, flight: GolfFlightWithTeams) => {
    setSelectedTeam(team);
    setTeamTargetFlight(flight);
    setDeleteTeamDialogOpen(true);
  };

  const handleManageRoster = (team: GolfTeamType) => {
    router.push(`/account/${accountId}/seasons/${seasonId}/golf/teams/${team.id}`);
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
    }
    setFeedback({ severity: 'success', message });
    setCreateTeamDialogOpen(false);
    setTeamTargetFlight(null);
  };

  const handleTeamUpdated = (team: GolfTeamWithPlayerCountType, message: string) => {
    if (teamTargetFlight) {
      setFlights((prev) =>
        prev.map((f) => {
          if (f.id !== teamTargetFlight.id) return f;
          return {
            ...f,
            teams: f.teams.map((t) => (t.id === team.id ? team : t)),
          };
        }),
      );
    }
    setFeedback({ severity: 'success', message });
    setEditTeamDialogOpen(false);
    setSelectedTeam(null);
    setTeamTargetFlight(null);
  };

  const handleTeamDeleted = (teamId: string, message: string) => {
    removeTeamFromState(teamId);
    setFeedback({ severity: 'success', message });
    setDeleteTeamDialogOpen(false);
    setSelectedTeam(null);
    setTeamTargetFlight(null);
  };

  const renderTeamRow = (team: GolfTeamWithPlayerCountType, flight: GolfFlightWithTeams) => {
    const expectedTeamSize = leagueSetup?.teamSize ?? 2;
    const hasPlayerCountMismatch = team.playerCount !== expectedTeamSize;
    const playerCountLabel = team.playerCount === 1 ? '1 player' : `${team.playerCount} players`;
    const expectedLabel = expectedTeamSize === 1 ? '1 player' : `${expectedTeamSize} players`;

    return (
      <Box
        key={team.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: hasPlayerCountMismatch ? 'warning.main' : 'divider',
          bgcolor: hasPlayerCountMismatch ? 'warning.lighter' : 'transparent',
          '&:last-child': { borderBottom: 'none' },
          '&:hover': { bgcolor: hasPlayerCountMismatch ? 'warning.light' : 'action.hover' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{team.name}</Typography>
          {hasPlayerCountMismatch ? (
            <Tooltip
              title={`Team has ${playerCountLabel} but expected ${expectedLabel}`}
              placement="top"
              arrow
            >
              <Chip
                icon={<WarningIcon />}
                label={playerCountLabel}
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          ) : (
            <Chip label={playerCountLabel} size="small" variant="outlined" />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Manage Roster">
            <IconButton size="small" onClick={() => handleManageRoster(team)} color="primary">
              <PeopleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Team">
            <IconButton size="small" onClick={() => handleEditTeam(team, flight)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Team">
            <IconButton size="small" onClick={() => handleDeleteTeam(team, flight)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

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
            No teams in this flight yet. Create teams using the button below.
          </Typography>
        ) : (
          flight.teams.map((team) => renderTeamRow(team, flight))
        )}
      </AccordionDetails>
      <AccordionActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button startIcon={<AddIcon />} onClick={() => handleCreateTeam(flight)}>
          Create Team
        </Button>
      </AccordionActions>
    </Accordion>
  );

  if (loading) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Golf Flight Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          {season ? `Manage flights and teams for ${seasonName}` : 'Manage flights and teams'}
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          links={[
            { name: 'Season', href: `/account/${accountId}/admin/season` },
            { name: 'Season Management', href: `/account/${accountId}/seasons` },
            { name: seasonName, href: `/account/${accountId}/seasons/${seasonId}/golf/admin` },
          ]}
          currentPage="Flights & Teams"
        />

        {leagueSetup && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Team Size:
            </Typography>
            <Chip
              label={getTeamSizeLabel(leagueSetup.teamSize ?? 2)}
              size="small"
              color="primary"
              variant="outlined"
            />
            {firstFlightId && (
              <MuiLink
                component={Link}
                href={`/account/${accountId}/seasons/${seasonId}/golf/leagues/${firstFlightId}/setup`}
                underline="hover"
                sx={{ ml: 1, fontSize: '0.875rem' }}
              >
                Change
              </MuiLink>
            )}
          </Box>
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
          flights.map(renderFlightAccordion)
        )}
      </Container>

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

      {teamTargetFlight && (
        <CreateGolfTeamDialog
          open={createTeamDialogOpen}
          onClose={() => {
            setCreateTeamDialogOpen(false);
            setTeamTargetFlight(null);
          }}
          accountId={accountId}
          flightId={teamTargetFlight.id}
          flightName={teamTargetFlight.name}
          onSuccess={handleTeamCreated}
        />
      )}

      <EditGolfTeamDialog
        open={editTeamDialogOpen}
        onClose={() => {
          setEditTeamDialogOpen(false);
          setSelectedTeam(null);
          setTeamTargetFlight(null);
        }}
        accountId={accountId}
        seasonId={seasonId}
        team={selectedTeam}
        onSuccess={handleTeamUpdated}
      />

      <DeleteGolfTeamDialog
        open={deleteTeamDialogOpen}
        onClose={() => {
          setDeleteTeamDialogOpen(false);
          setSelectedTeam(null);
          setTeamTargetFlight(null);
        }}
        accountId={accountId}
        seasonId={seasonId}
        team={selectedTeam}
        onSuccess={handleTeamDeleted}
      />

      {feedback && (
        <Snackbar
          open={!!feedback}
          autoHideDuration={6000}
          onClose={handleFeedbackClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={feedback.severity} onClose={handleFeedbackClose} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        </Snackbar>
      )}
    </main>
  );
};

export default GolfFlightManagement;
