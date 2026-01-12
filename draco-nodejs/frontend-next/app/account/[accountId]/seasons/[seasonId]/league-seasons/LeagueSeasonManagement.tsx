import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
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
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Remove as RemoveIcon,
  Sports as SportsIcon,
  People as PeopleIcon,
  NavigateNext as NavigateNextIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  listSeasonLeagueSeasons,
  getAccountSeason,
  deleteLeagueSeasonDivision as apiDeleteLeagueSeasonDivision,
  assignLeagueSeasonTeamDivision as apiAssignLeagueSeasonTeamDivision,
  exportLeagueRoster,
  exportLeagueManagers,
  exportTeamRoster,
} from '@draco/shared-api-client';
import type {
  DivisionSeasonType,
  DivisionSeasonWithTeamsType,
  LeagueSeasonType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  LeagueSeasonWithDivisionTeamsType,
  SeasonType,
  TeamSeasonType,
} from '@draco/shared-schemas';
import { createApiClient } from '../../../../../../lib/apiClientFactory';
import { unwrapApiResult } from '../../../../../../utils/apiResult';
import { mapLeagueSetup } from '../../../../../../utils/leagueSeasonMapper';
import { downloadBlob } from '../../../../../../utils/downloadUtils';
import { useAuth } from '../../../../../../context/AuthContext';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import {
  AddDivisionDialog,
  CreateLeagueDialog,
  CreateTeamDialog,
  DeleteLeagueDialog,
  DeleteTeamDialog,
  EditDivisionDialog,
  EditLeagueDialog,
  RemoveTeamFromDivisionDialog,
  type AddDivisionResult,
  type CreateTeamResult,
  type EditDivisionResult,
  type RemoveTeamFromDivisionResult,
} from '../../../../../../components/league-seasons';
import EditTeamDialog from '../../../../../../components/EditTeamDialog';
import TeamAvatar from '../../../../../../components/TeamAvatar';
import { getLogoSize } from '../../../../../../config/teams';
import type { UpdateTeamMetadataResult } from '../../../../../../hooks/useTeamManagement';

interface LeagueSeasonManagementProps {
  accountId: string;
  seasonId: string;
  onClose: () => void;
}

const LeagueSeasonManagement: React.FC<LeagueSeasonManagementProps> = ({
  accountId,
  seasonId,
  onClose,
}) => {
  const [leagueSeasons, setLeagueSeasons] = useState<
    LeagueSeasonWithDivisionTeamsAndUnassignedType[]
  >([]);
  // Remove global divisions state and fetchDivisions
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();
  const { token } = useAuth();
  const apiClient = useMemo(() => createApiClient({ token: token || undefined }), [token]);
  const [season, setSeason] = useState<SeasonType | null>(null);
  const LOGO_SIZE = getLogoSize();

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

  // Division management state
  const [addDivisionDialogOpen, setAddDivisionDialogOpen] = useState(false);
  const [selectedLeagueSeason, setSelectedLeagueSeason] = useState<LeagueSeasonType | null>(null);

  // Accordion state
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Delete league state
  const [deleteLeagueDialogOpen, setDeleteLeagueDialogOpen] = useState(false);
  const [leagueToDelete, setLeagueToDelete] =
    useState<LeagueSeasonWithDivisionTeamsAndUnassignedType | null>(null);

  // Delete team state
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamSeasonType | null>(null);
  const [teamToDeleteLeagueSeason, setTeamToDeleteLeagueSeason] = useState<LeagueSeasonType | null>(
    null,
  );

  // Create team state
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [teamToCreateLeagueSeason, setTeamToCreateLeagueSeason] = useState<LeagueSeasonType | null>(
    null,
  );
  const [teamToCreateDivision, setTeamToCreateDivision] = useState<DivisionSeasonType | null>(null);
  const seasonName = season?.name ?? 'Season';

  // Edit division state
  const [editDivisionDialogOpen, setEditDivisionDialogOpen] = useState(false);
  const [divisionToEdit, setDivisionToEdit] = useState<DivisionSeasonType | null>(null);
  const [leagueSeasonForEdit, setLeagueSeasonForEdit] = useState<LeagueSeasonType | null>(null);

  // Create league state
  const [createLeagueDialogOpen, setCreateLeagueDialogOpen] = useState(false);

  // Edit league state
  const [editLeagueDialogOpen, setEditLeagueDialogOpen] = useState(false);
  const [leagueToEdit, setLeagueToEdit] =
    useState<LeagueSeasonWithDivisionTeamsAndUnassignedType | null>(null);

  // Edit team state
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamSeasonType | null>(null);

  // Remove team from division state
  const [removeTeamFromDivisionDialogOpen, setRemoveTeamFromDivisionDialogOpen] = useState(false);
  const [teamToRemoveFromDivision, setTeamToRemoveFromDivision] = useState<TeamSeasonType | null>(
    null,
  );
  const [leagueSeasonForRemoveFromDivision, setLeagueSeasonForRemoveFromDivision] =
    useState<LeagueSeasonWithDivisionTeamsType | null>(null);

  // State for managing selected teams per division
  const [selectedTeamsPerDivision, setSelectedTeamsPerDivision] = useState<Record<string, string>>(
    {},
  );

  // Export menu state
  const [leagueExportMenuAnchor, setLeagueExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedLeagueForExport, setSelectedLeagueForExport] =
    useState<LeagueSeasonWithDivisionTeamsAndUnassignedType | null>(null);

  const handleFeedbackClose = useCallback(() => {
    setFeedback(null);
  }, []);

  // Get available divisions (excluding those already assigned to the selected league)
  const availableDivisions = useMemo(() => {
    if (!selectedLeagueSeason) return [];
    return []; // No global divisions list, divisions are fetched per league
  }, [selectedLeagueSeason]);

  // Fetch league seasons with divisions and teams
  const fetchLeagueSeasons = useCallback(async () => {
    if (!accountId || !seasonId) return;

    setLoading(true);
    try {
      const result = await listSeasonLeagueSeasons({
        client: apiClient,
        path: { accountId, seasonId },
        query: { includeTeams: true, includeUnassignedTeams: true },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to fetch league seasons');
      const formattedLeagueSeasons = mapLeagueSetup(data);
      setLeagueSeasons(formattedLeagueSeasons.leagueSeasons || []);
    } catch (error) {
      console.error('Error fetching league seasons:', error);
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch league seasons',
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  // Targeted update functions for better UX
  const removeLeagueSeasonFromState = useCallback((leagueSeasonId: string) => {
    setLeagueSeasons((prev) => prev.filter((ls) => ls.id !== leagueSeasonId));
  }, []);

  const addLeagueSeasonToState = useCallback(
    (leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType) => {
      setLeagueSeasons((prev) => [...prev, leagueSeason]);
    },
    [],
  );

  const updateLeagueNameInState = useCallback((leagueSeasonId: string, newName: string) => {
    setLeagueSeasons((prev) =>
      prev.map((ls) => {
        if (ls.id !== leagueSeasonId) return ls;
        return {
          ...ls,
          league: {
            ...ls.league,
            name: newName,
          },
        };
      }),
    );
  }, []);

  const addTeamToDivisionInState = useCallback(
    (leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeasonType) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: ls.divisions?.map((div) => {
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
    (leagueSeasonId: string, divisionSeasonId: string, teamSeason: TeamSeasonType) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: ls.divisions?.map((div) => {
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
    (leagueSeasonId: string, teamSeason: TeamSeasonType) => {
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
    (leagueSeasonId: string, divisionSeason: DivisionSeasonWithTeamsType) => {
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

  const updateDivisionInState = useCallback(
    (leagueSeasonId: string, divisionSeasonId: string, name: string, priority: number) => {
      setLeagueSeasons((prev) =>
        prev.map((ls) => {
          if (ls.id !== leagueSeasonId) return ls;

          return {
            ...ls,
            divisions: ls.divisions?.map((div) => {
              if (div.id !== divisionSeasonId) return div;
              return {
                ...div,
                division: { ...div.division, name },
                priority,
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const updateTeamInState = useCallback((updatedTeam: TeamSeasonType) => {
    setLeagueSeasons((prev) =>
      prev.map((ls) => ({
        ...ls,
        divisions: ls.divisions?.map((div) => ({
          ...div,
          teams: div.teams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)),
        })),
        unassignedTeams: ls.unassignedTeams?.map((team) =>
          team.id === updatedTeam.id ? updatedTeam : team,
        ),
      })),
    );
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchLeagueSeasons();
    }
  }, [accountId, fetchLeagueSeasons]);

  // Handler to open add division dialog
  const openAddDivisionDialog = (leagueSeason: LeagueSeasonType) => {
    setSelectedLeagueSeason(leagueSeason);
    setAddDivisionDialogOpen(true);
  };

  // Handler to remove division from league season
  const handleRemoveDivision = async (
    leagueSeason: LeagueSeasonType,
    divisionSeason: DivisionSeasonType,
  ) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const result = await apiDeleteLeagueSeasonDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId,
          leagueSeasonId: leagueSeason.id,
          divisionSeasonId: divisionSeason.id,
        },
        throwOnError: false,
      });

      const removed = unwrapApiResult(result, 'Failed to remove division from league season');

      if (removed) {
        setFeedback({
          severity: 'success',
          message: `Division removed from ${leagueSeason.league.name}`,
        });
        removeDivisionFromLeagueSeasonInState(leagueSeason.id, divisionSeason.id);
      }
    } catch (error) {
      console.error('Error removing division:', error);
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove division',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Direct assignment function for single division scenario
  const handleAssignTeamToDivisionDirectly = async (
    teamSeason: TeamSeasonType,
    leagueSeason: LeagueSeasonType,
    divisionSeason: DivisionSeasonType,
  ) => {
    if (!accountId || !token) return;

    setFormLoading(true);
    try {
      const result = await apiAssignLeagueSeasonTeamDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId,
          leagueSeasonId: leagueSeason.id,
          teamSeasonId: teamSeason.id,
        },
        body: { divisionSeasonId: divisionSeason.id },
        throwOnError: false,
      });

      const assigned = unwrapApiResult(result, 'Failed to assign team to division');

      if (assigned) {
        setFeedback({
          severity: 'success',
          message: `Team "${teamSeason.name}" automatically assigned to division "${divisionSeason.division.name}"`,
        });
        addTeamToDivisionInState(leagueSeason.id, divisionSeason.id, teamSeason);
      }
    } catch (error) {
      console.error('Error assigning team to division:', error);
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to assign team to division',
      });
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

  // Handler to open remove team from division dialog
  const openRemoveTeamFromDivisionDialog = (
    teamSeason: TeamSeasonType,
    leagueSeason: LeagueSeasonWithDivisionTeamsType,
  ) => {
    setTeamToRemoveFromDivision(teamSeason);
    setLeagueSeasonForRemoveFromDivision(leagueSeason);
    setRemoveTeamFromDivisionDialogOpen(true);
  };

  // Handler to navigate to team roster management
  const handleManageRoster = (teamSeason: TeamSeasonType) => {
    router.push(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeason.id}/roster`);
  };

  // Handler to open delete league dialog
  const openDeleteLeagueDialog = (leagueSeason: LeagueSeasonType) => {
    setLeagueToDelete(leagueSeason);
    setDeleteLeagueDialogOpen(true);
  };

  // Handler to open delete team dialog
  const openDeleteTeamDialog = (teamSeason: TeamSeasonType, leagueSeason: LeagueSeasonType) => {
    setTeamToDelete(teamSeason);
    setTeamToDeleteLeagueSeason(leagueSeason);
    setDeleteTeamDialogOpen(true);
  };

  // Handler to open create team dialog
  const openCreateTeamDialog = (leagueSeason: LeagueSeasonType, division?: DivisionSeasonType) => {
    setTeamToCreateLeagueSeason(leagueSeason);
    setTeamToCreateDivision(division ?? null);
    setCreateTeamDialogOpen(true);
  };

  // Handler to open edit division dialog
  const openEditDivisionDialog = (division: DivisionSeasonType, leagueSeason: LeagueSeasonType) => {
    setDivisionToEdit(division);
    setLeagueSeasonForEdit(leagueSeason);
    setEditDivisionDialogOpen(true);
  };

  // Handler to open create league dialog
  const openCreateLeagueDialog = () => {
    setCreateLeagueDialogOpen(true);
  };

  // Handler to open edit league dialog
  const openEditLeagueDialog = (leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType) => {
    setLeagueToEdit(leagueSeason);
    setEditLeagueDialogOpen(true);
  };

  // Handler to open edit team dialog
  const openEditTeamDialog = (teamSeason: TeamSeasonType) => {
    setTeamToEdit(teamSeason);
    setEditTeamDialogOpen(true);
  };

  // Handler for team update success
  const handleTeamUpdateSuccess = useCallback(
    (result: UpdateTeamMetadataResult) => {
      updateTeamInState(result.teamSeason);
      setFeedback({ severity: 'success', message: result.message });
    },
    [updateTeamInState],
  );

  // Export handlers
  const handleLeagueExportMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType,
  ) => {
    event.stopPropagation();
    setLeagueExportMenuAnchor(event.currentTarget);
    setSelectedLeagueForExport(leagueSeason);
  };

  const handleLeagueExportMenuClose = () => {
    setLeagueExportMenuAnchor(null);
    setSelectedLeagueForExport(null);
  };

  const handleExportLeagueRoster = async () => {
    if (!selectedLeagueForExport) return;

    try {
      const result = await exportLeagueRoster({
        client: apiClient,
        path: { accountId, seasonId, leagueSeasonId: selectedLeagueForExport.id },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export league roster') as Blob;
      const sanitizedName = selectedLeagueForExport.league.name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      downloadBlob(blob, `${sanitizedName}-roster.csv`);
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to export league roster',
      });
    }
    handleLeagueExportMenuClose();
  };

  const handleExportLeagueManagers = async () => {
    if (!selectedLeagueForExport) return;

    try {
      const result = await exportLeagueManagers({
        client: apiClient,
        path: { accountId, seasonId, leagueSeasonId: selectedLeagueForExport.id },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export league managers') as Blob;
      const sanitizedName = selectedLeagueForExport.league.name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      downloadBlob(blob, `${sanitizedName}-managers.csv`);
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to export league managers',
      });
    }
    handleLeagueExportMenuClose();
  };

  const renderTeamRow = (
    team: TeamSeasonType,
    leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType,
  ) => (
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
      <Box display="flex" alignItems="center" gap={1}>
        <TeamAvatar
          name={team.name || 'Unknown Team'}
          logoUrl={team.team.logoUrl ?? undefined}
          size={LOGO_SIZE}
          alt={(team.name || 'Unknown Team') + ' logo'}
        />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {team.name}
        </Typography>
      </Box>
      <Box display="flex" gap={0.5} alignItems="center">
        <Tooltip title="Edit Team">
          <IconButton
            size="small"
            color="primary"
            onClick={() => openEditTeamDialog(team)}
            disabled={formLoading}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
        <Tooltip title="Export Team Roster">
          <IconButton
            size="small"
            onClick={() => handleExportTeamRoster(team, leagueSeason)}
            disabled={formLoading}
          >
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove from Division">
          <IconButton
            size="small"
            color="error"
            onClick={() => openRemoveTeamFromDivisionDialog(team, leagueSeason)}
            disabled={formLoading}
          >
            <RemoveIcon fontSize="small" />
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
  );

  const handleExportTeamRoster = async (
    teamSeason: TeamSeasonType,
    _leagueSeason: LeagueSeasonType,
  ) => {
    try {
      const result = await exportTeamRoster({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId: teamSeason.id },
        throwOnError: false,
        parseAs: 'blob',
      });

      const blob = unwrapApiResult(result, 'Failed to export team roster') as Blob;
      const sanitizedName = (teamSeason.name ?? 'team')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      downloadBlob(blob, `${sanitizedName}-roster.csv`);
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Failed to export team roster',
      });
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
      <AccountPageHeader accountId={accountId} seasonName={seasonName} showSeasonInfo={true}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            League Season Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage leagues, divisions, and team assignments for this season
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, mt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <MuiLink
            component="button"
            variant="body2"
            onClick={onClose}
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            Season Management
          </MuiLink>
          <Typography variant="body2" color="text.primary">
            {seasonName}
          </Typography>
        </Breadcrumbs>

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
                  <Typography variant="h6">{leagueSeason.league.name}</Typography>
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
                  <Box display="flex" alignItems="center" gap={0.5} ml="auto">
                    <Tooltip title="Export league data">
                      <IconButton
                        component="span"
                        size="small"
                        onClick={(e) => handleLeagueExportMenuOpen(e, leagueSeason)}
                        disabled={formLoading}
                      >
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit league name">
                      <IconButton
                        component="span"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditLeagueDialog(leagueSeason);
                        }}
                        disabled={formLoading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove league from season">
                      <IconButton
                        component="span"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteLeagueDialog(leagueSeason);
                        }}
                        disabled={formLoading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionActions>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => openAddDivisionDialog(leagueSeason)}
                >
                  Add Division
                </Button>
              </AccordionActions>
              <AccordionDetails>
                {/* Divisions with integrated team assignment */}
                {leagueSeason.divisions?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No divisions created yet. Add a division before adding teams.
                  </Typography>
                ) : (
                  <Box>
                    {leagueSeason.divisions?.map((division) => (
                      <Card key={division.id} sx={{ mb: 2 }}>
                        <CardContent>
                          {/* Division Header */}
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            {/* Left side: Division info */}
                            <Box>
                              <Typography variant="h6">{division.division.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {division.teams?.length || 0} teams • Priority: {division.priority}
                              </Typography>
                            </Box>

                            {/* Right side: Edit and Delete icons */}
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

                          {/* Teams List */}
                          <Box>
                            {(() => {
                              const teams = [...(division.teams || [])].sort((a, b) =>
                                (a.name || '').localeCompare(b.name || ''),
                              );
                              // Calculate columns: teams split evenly, with add-team dropdown as last item in right column
                              const totalItems = teams.length + 1; // +1 for the add team dropdown
                              const midPoint = Math.ceil(totalItems / 2);
                              const leftTeams = teams.slice(0, midPoint);
                              const rightTeams = teams.slice(midPoint);

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
                                    {leftTeams.map((team) => renderTeamRow(team, leagueSeason))}
                                  </Box>

                                  {/* Right Column */}
                                  <Box>
                                    {rightTeams.map((team) => renderTeamRow(team, leagueSeason))}
                                    {/* Add team dropdown - last item in right column */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        py: 1,
                                        px: 1.5,
                                        mb: 0.5,
                                        borderRadius: 1,
                                      }}
                                    >
                                      <FormControl size="small" sx={{ flex: 1 }}>
                                        <Select
                                          value={selectedTeamsPerDivision[division.id] || ''}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '__CREATE_NEW__') {
                                              openCreateTeamDialog(leagueSeason, division);
                                              setSelectedTeamsPerDivision({
                                                ...selectedTeamsPerDivision,
                                                [division.id]: '',
                                              });
                                            } else {
                                              setSelectedTeamsPerDivision({
                                                ...selectedTeamsPerDivision,
                                                [division.id]: value,
                                              });
                                            }
                                          }}
                                          displayEmpty
                                          disabled={formLoading}
                                          sx={{ bgcolor: 'background.paper' }}
                                        >
                                          <MenuItem value="">
                                            <em>Add or create team...</em>
                                          </MenuItem>
                                          {leagueSeason.unassignedTeams?.map((team) => (
                                            <MenuItem key={team.id} value={team.id}>
                                              {team.name}
                                            </MenuItem>
                                          ))}
                                          <MenuItem
                                            value="__CREATE_NEW__"
                                            sx={{
                                              color: 'primary.main',
                                              fontWeight: 500,
                                              borderTop: '1px solid',
                                              borderColor: 'divider',
                                              mt: 0.5,
                                              pt: 1,
                                            }}
                                          >
                                            Create new team
                                          </MenuItem>
                                        </Select>
                                      </FormControl>
                                      <Box display="flex" gap={0.5} alignItems="center">
                                        <Tooltip title="Add Selected Team">
                                          <IconButton
                                            color="primary"
                                            onClick={() => {
                                              const selectedTeamId =
                                                selectedTeamsPerDivision[division.id];
                                              const selectedTeam =
                                                leagueSeason.unassignedTeams?.find(
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
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Unassigned Teams Summary */}
                    {(leagueSeason.unassignedTeams?.length ?? 0) > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {leagueSeason.unassignedTeams?.length ?? 0} unassigned team
                        {(leagueSeason.unassignedTeams?.length ?? 0) > 1 ? 's' : ''}:{' '}
                        {leagueSeason.unassignedTeams?.map((t) => t.name).join(', ')}
                      </Alert>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {/* Add Division Dialog */}
        <AddDivisionDialog
          open={addDivisionDialogOpen}
          onClose={() => setAddDivisionDialogOpen(false)}
          accountId={accountId}
          seasonId={seasonId}
          leagueSeason={selectedLeagueSeason}
          availableDivisions={availableDivisions}
          onSuccess={(result: AddDivisionResult, message: string) => {
            addDivisionToLeagueSeasonInState(result.leagueSeasonId, result.divisionSeason);
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Delete League Confirmation Dialog */}
        <DeleteLeagueDialog
          open={deleteLeagueDialogOpen}
          onClose={() => {
            setDeleteLeagueDialogOpen(false);
            setLeagueToDelete(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          leagueSeason={leagueToDelete}
          onSuccess={(leagueSeasonId: string, message: string) => {
            removeLeagueSeasonFromState(leagueSeasonId);
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Create Team Dialog */}
        <CreateTeamDialog
          open={createTeamDialogOpen}
          onClose={() => {
            setCreateTeamDialogOpen(false);
            setTeamToCreateLeagueSeason(null);
            setTeamToCreateDivision(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          leagueSeason={teamToCreateLeagueSeason}
          division={teamToCreateDivision}
          onSuccess={(result: CreateTeamResult, message: string) => {
            if (result.divisionSeasonId) {
              addTeamToDivisionInState(
                result.leagueSeasonId,
                result.divisionSeasonId,
                result.teamSeason,
              );
            } else {
              addTeamToLeagueSeasonInState(result.leagueSeasonId, result.teamSeason);
            }
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Delete Team Confirmation Dialog */}
        <DeleteTeamDialog
          open={deleteTeamDialogOpen}
          onClose={() => {
            setDeleteTeamDialogOpen(false);
            setTeamToDelete(null);
            setTeamToDeleteLeagueSeason(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          teamSeason={teamToDelete}
          leagueSeason={teamToDeleteLeagueSeason}
          onSuccess={(leagueSeasonId: string, teamSeasonId: string, message: string) => {
            removeTeamFromLeagueSeasonInState(leagueSeasonId, teamSeasonId);
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Edit Division Dialog */}
        <EditDivisionDialog
          open={editDivisionDialogOpen}
          onClose={() => {
            setEditDivisionDialogOpen(false);
            setDivisionToEdit(null);
            setLeagueSeasonForEdit(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          divisionSeason={divisionToEdit}
          leagueSeason={leagueSeasonForEdit}
          onSuccess={(result: EditDivisionResult, message: string) => {
            updateDivisionInState(
              result.leagueSeasonId,
              result.divisionSeasonId,
              result.name,
              result.priority,
            );
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Create League Dialog */}
        <CreateLeagueDialog
          open={createLeagueDialogOpen}
          onClose={() => setCreateLeagueDialogOpen(false)}
          accountId={accountId}
          seasonId={seasonId}
          onSuccess={(leagueSeason, message: string) => {
            addLeagueSeasonToState(leagueSeason);
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Edit League Dialog */}
        <EditLeagueDialog
          open={editLeagueDialogOpen}
          onClose={() => {
            setEditLeagueDialogOpen(false);
            setLeagueToEdit(null);
          }}
          accountId={accountId}
          leagueSeason={leagueToEdit}
          onSuccess={(leagueSeasonId: string, newName: string, message: string) => {
            updateLeagueNameInState(leagueSeasonId, newName);
            setFeedback({ severity: 'success', message });
          }}
        />

        {/* Edit Team Dialog */}
        <EditTeamDialog
          open={editTeamDialogOpen}
          accountId={accountId}
          seasonId={seasonId}
          teamSeason={teamToEdit}
          onClose={() => {
            setEditTeamDialogOpen(false);
            setTeamToEdit(null);
          }}
          onSuccess={handleTeamUpdateSuccess}
        />

        {/* Remove Team from Division Confirmation Dialog */}
        <RemoveTeamFromDivisionDialog
          open={removeTeamFromDivisionDialogOpen}
          onClose={() => {
            setRemoveTeamFromDivisionDialogOpen(false);
            setTeamToRemoveFromDivision(null);
            setLeagueSeasonForRemoveFromDivision(null);
          }}
          accountId={accountId}
          seasonId={seasonId}
          teamSeason={teamToRemoveFromDivision}
          leagueSeason={leagueSeasonForRemoveFromDivision}
          onSuccess={(result: RemoveTeamFromDivisionResult, message: string) => {
            removeTeamFromDivisionInState(
              result.leagueSeasonId,
              result.divisionSeasonId,
              result.teamSeason,
            );
            setFeedback({ severity: 'success', message });
          }}
          onError={(error) => setFeedback({ severity: 'error', message: error })}
        />
      </Box>

      {/* FAB for creating new league */}
      <Fab
        color="primary"
        aria-label="Create new league"
        onClick={openCreateLeagueDialog}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>

      {/* League Export Menu */}
      <Menu
        anchorEl={leagueExportMenuAnchor}
        open={Boolean(leagueExportMenuAnchor)}
        onClose={handleLeagueExportMenuClose}
      >
        <MenuItem onClick={handleExportLeagueRoster}>Export League Rosters</MenuItem>
        <MenuItem onClick={handleExportLeagueManagers}>Export League Managers</MenuItem>
      </Menu>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert
            onClose={handleFeedbackClose}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default LeagueSeasonManagement;
