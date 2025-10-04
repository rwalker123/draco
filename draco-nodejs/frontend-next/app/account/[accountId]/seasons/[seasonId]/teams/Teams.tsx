import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Link,
  Menu,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useAuth } from '../../../../../../context/AuthContext';
import { useRole } from '../../../../../../context/RoleContext';
import { getLogoSize, addCacheBuster } from '../../../../../../config/teams';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import EditTeamDialog from '../../../../../../components/EditTeamDialog';
import TeamAvatar from '../../../../../../components/TeamAvatar';
import { Team } from '@/types/schedule';
import { useApiClient } from '@/hooks/useApiClient';
import {
  listSeasonLeagueSeasons,
  updateTeamSeason as apiUpdateTeamSeason,
} from '@draco/shared-api-client';
import type { UpsertTeamSeasonWithLogo } from '@draco/shared-api-client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { unwrapApiResult } from '@/utils/apiResult';
import { mapLeagueSetup } from '@/utils/leagueSeasonMapper';

interface Division {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: Team[];
}

interface LeagueSeason {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions: Division[];
}

interface TeamsData {
  season: {
    id: string;
    name: string;
    accountId: string;
  };
  leagueSeasons: LeagueSeason[];
}

interface TeamsProps {
  accountId: string;
  seasonId: string;
  router?: AppRouterInstance;
}

const Teams: React.FC<TeamsProps> = ({ accountId, seasonId, router }) => {
  const { user, token } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  // Check if user has edit permissions for teams
  const canEditTeams =
    user &&
    (hasRole('Administrator') ||
      hasRole('AccountAdmin', { accountId }) ||
      hasRole('LeagueAdmin', { accountId }));

  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Export menu states
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedLeagueForExport, setSelectedLeagueForExport] = useState<LeagueSeason | null>(null);
  const [seasonExportMenuAnchor, setSeasonExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Logo configuration
  const LOGO_SIZE = getLogoSize();

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Export roster to CSV function (placeholder)
  const handleExportRoster = async (leagueSeason: LeagueSeason) => {
    try {
      // TODO: Implement backend endpoint for CSV export

      // Placeholder implementation
      alert(`Export roster for ${leagueSeason.leagueName} - Backend implementation pending`);

      // Future implementation would be:
      // const response = await {someAPiCall};
      // const result = apiUnwrapResult(response, 'Failed to export managers');
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${leagueSeason.leagueName}-roster.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export roster: ' + error);
    }
  };

  // Export managers to CSV function (placeholder)
  const handleExportManagers = async (leagueSeason: LeagueSeason) => {
    try {
      // TODO: Implement backend endpoint for CSV export

      // Placeholder implementation
      alert(`Export managers for ${leagueSeason.leagueName} - Backend implementation pending`);

      // Future implementation would be:
      // const response = await {someAPiCall};
      // const result = apiUnwrapResult(response, 'Failed to export managers');
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${leagueSeason.leagueName}-managers.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export managers: ' + error);
    }
  };

  // Export menu handlers
  const handleExportMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    leagueSeason: LeagueSeason,
  ) => {
    setExportMenuAnchor(event.currentTarget);
    setSelectedLeagueForExport(leagueSeason);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
    setSelectedLeagueForExport(null);
  };

  const handleExportSelection = (type: 'roster' | 'managers') => {
    if (selectedLeagueForExport) {
      if (type === 'roster') {
        handleExportRoster(selectedLeagueForExport);
      } else {
        handleExportManagers(selectedLeagueForExport);
      }
    }
    handleExportMenuClose();
  };

  // Season-level export functions
  const handleExportSeasonRoster = async () => {
    try {
      // TODO: Implement backend endpoint for season roster export

      // Placeholder implementation
      alert(`Export season roster - Backend implementation pending`);

      // Future implementation would be:
      // const response = await {someAPiCall};
      // const result = apiUnwrapResult(response, 'Failed to export managers');
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${teamsData?.season.name}-roster.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export season roster: ' + error);
    }
  };

  const handleExportSeasonManagers = async () => {
    try {
      // TODO: Implement backend endpoint for season managers export

      // Placeholder implementation
      alert(`Export season managers - Backend implementation pending`);

      // Future implementation would be:
      // const response = await {someAPiCall};
      // const result = apiUnwrapResult(response, 'Failed to export managers');
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `${teamsData?.season.name}-managers.csv`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export season managers: ' + error);
    }
  };

  // Season export menu handlers
  const handleSeasonExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSeasonExportMenuAnchor(event.currentTarget);
  };

  const handleSeasonExportMenuClose = () => {
    setSeasonExportMenuAnchor(null);
  };

  const handleSeasonExportSelection = (type: 'roster' | 'managers') => {
    if (type === 'roster') {
      handleExportSeasonRoster();
    } else {
      handleExportSeasonManagers();
    }
    handleSeasonExportMenuClose();
  };

  // Load teams data
  const loadTeamsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const leagueResult = await listSeasonLeagueSeasons({
        client: apiClient,
        path: { accountId, seasonId },
        query: {
          includeTeams: true,
          includeUnassignedTeams: true,
        },
        throwOnError: false,
      });

      const leagueData = unwrapApiResult(leagueResult, 'Failed to load teams data');
      const mapped = mapLeagueSetup(leagueData, accountId);
      const seasonInfo = mapped.season ?? { id: seasonId, name: '', accountId };

      const mappedLeagueSeasons = mapped.leagueSeasons.map((leagueSeason) => ({
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
            logoUrl: team.logoUrl ?? undefined,
            webAddress: team.webAddress ?? undefined,
            youtubeUserId: team.youtubeUserId ?? undefined,
            defaultVideo: team.defaultVideo ?? undefined,
            autoPlayVideo: team.autoPlayVideo,
          })),
        })),
      }));

      setTeamsData({
        season: seasonInfo,
        leagueSeasons: mappedLeagueSeasons,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams data');
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  useEffect(() => {
    loadTeamsData();
  }, [loadTeamsData]);

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTeam(null);
  };

  const handleSaveTeam = async (updatedName: string, logoFile: File | null) => {
    if (!selectedTeam) return;
    if (!updatedName.trim()) throw new Error('Team name is required');
    if (!token) throw new Error('Authentication required. Please log in again.');

    const payload: UpsertTeamSeasonWithLogo = { name: updatedName.trim() };
    if (logoFile) {
      payload.logo = logoFile;
    }

    const result = await apiUpdateTeamSeason({
      client: apiClient,
      path: { accountId, seasonId, teamSeasonId: selectedTeam.id },
      body: payload,
      throwOnError: false,
      ...(logoFile ? { ...formDataBodySerializer, headers: { 'Content-Type': null } } : {}),
    });

    const updatedTeam = unwrapApiResult(result, 'Failed to update team');

    const newLogoUrl = updatedTeam.team.logoUrl
      ? addCacheBuster(updatedTeam.team.logoUrl, Date.now())
      : undefined;
    setTeamsData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        leagueSeasons: prevData.leagueSeasons.map((leagueSeason) => ({
          ...leagueSeason,
          divisions: leagueSeason.divisions.map((division) => ({
            ...division,
            teams: division.teams.map((team) =>
              team.id === selectedTeam.id
                ? {
                    ...team,
                    name: updatedName.trim(),
                    logoUrl: newLogoUrl ?? team.logoUrl,
                  }
                : team,
            ),
          })),
        })),
      };
    });
    setSuccess('Team updated successfully');
  };

  const renderTeamCard = (team: Team) => {
    return (
      <Box
        key={team.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          p: 1,
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <TeamAvatar
          name={team.name || 'Unknown Team'}
          logoUrl={team.logoUrl}
          size={LOGO_SIZE}
          alt={(team.name || 'Unknown Team') + ' logo'}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() =>
              router?.push(`/account/${accountId}/seasons/${seasonId}/teams/${team.id}`)
            }
            sx={{
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
                color: 'primary.dark',
              },
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              p: 0,
              m: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {team.name || 'Unknown Team'}
          </Link>
        </Box>

        {canEditTeams && (
          <IconButton
            onClick={() => handleEditTeam(team)}
            color="primary"
            size="small"
            title="Edit team"
            sx={{ flexShrink: 0 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  };

  const renderDivision = (division: Division) => {
    return (
      <Box key={division.id} sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 1,
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}
        >
          {division.divisionName}
        </Typography>
        <Box sx={{ pl: 1 }}>
          {division.teams
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((team) => renderTeamCard(team))}
        </Box>
      </Box>
    );
  };

  const renderLeagueSeason = (leagueSeason: LeagueSeason) => {
    return (
      <Box
        key={leagueSeason.id}
        sx={{
          mb: 3,
          minWidth: 300,
          maxWidth: 400,
          flex: '1 1 auto',
        }}
      >
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              borderBottom: '2px solid',
              borderColor: 'secondary.main',
              pb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'secondary.main',
              }}
            >
              {leagueSeason.leagueName}
            </Typography>

            {canEditTeams && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExpandMoreIcon />}
                onClick={(event) => handleExportMenuOpen(event, leagueSeason)}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                }}
              >
                Export
              </Button>
            )}
          </Box>

          {leagueSeason.divisions.map(renderDivision)}
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!teamsData) {
    return <Alert severity="info">No teams data available</Alert>;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader
        accountId={accountId}
        style={{ marginBottom: 1 }}
        seasonName={teamsData?.season?.name}
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
              Teams
            </Typography>

            {user && !canEditTeams && (
              <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
                Read-only mode - Contact an administrator for editing permissions
              </Typography>
            )}
          </Box>
          {canEditTeams && teamsData && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExpandMoreIcon />}
              onClick={handleSeasonExportMenuOpen}
              sx={{
                minWidth: 'auto',
                px: 2,
                py: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                },
                position: 'absolute',
                right: 16,
              }}
            >
              Export Season
            </Button>
          )}
        </Box>
      </AccountPageHeader>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          {teamsData?.leagueSeasons?.map(renderLeagueSeason) || null}
        </Box>
      </Paper>

      <EditTeamDialog
        open={editDialogOpen}
        team={selectedTeam}
        onClose={handleCloseEditDialog}
        onSave={handleSaveTeam}
      />

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={() => handleExportSelection('roster')}>Export Roster</MenuItem>
        <MenuItem onClick={() => handleExportSelection('managers')}>Export Managers</MenuItem>
      </Menu>

      {/* Season Export Menu */}
      <Menu
        anchorEl={seasonExportMenuAnchor}
        open={Boolean(seasonExportMenuAnchor)}
        onClose={handleSeasonExportMenuClose}
      >
        <MenuItem onClick={() => handleSeasonExportSelection('roster')}>
          Export All Rosters
        </MenuItem>
        <MenuItem onClick={() => handleSeasonExportSelection('managers')}>
          Export All Managers
        </MenuItem>
      </Menu>
    </main>
  );
};

export default Teams;
