'use client';

import React from 'react';
import {
  Alert,
  Box,
  Avatar,
  Breadcrumbs,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Fab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { Add, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { SponsorType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../../../../components/AccountPageHeader';
import SponsorFormDialog from '../../../../../../../../../components/sponsors/SponsorFormDialog';
import { useSponsorOperations } from '../../../../../../../../../hooks/useSponsorOperations';
import PageSectionHeader from '../../../../../../../../../components/common/PageSectionHeader';
import TeamAvatar from '../../../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../../../components/TeamInfoCard';
import NextLink from 'next/link';

interface TeamSponsorManagementProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

type DialogState = {
  open: boolean;
  mode: 'create' | 'edit';
  sponsor: SponsorType | null;
};

const TeamSponsorManagement: React.FC<TeamSponsorManagementProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const {
    listSponsors,
    deleteSponsor,
    loading: mutationLoading,
    clearError,
  } = useSponsorOperations({
    type: 'team',
    accountId,
    seasonId,
    teamSeasonId,
  });
  const [sponsors, setSponsors] = React.useState<SponsorType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({
    open: false,
    mode: 'create',
    sponsor: null,
  });
  const [teamHeaderData, setTeamHeaderData] = React.useState<{
    teamName: string;
    leagueName?: string;
    logoUrl?: string;
    teamId?: string;
    leagueId?: string;
  } | null>(null);

  const handleTeamDataLoaded = React.useCallback(
    (data: {
      teamName: string;
      leagueName: string;
      seasonName: string;
      accountName: string;
      logoUrl?: string;
      record?: { wins: number; losses: number; ties: number };
      teamId?: string;
      leagueId?: string;
    }) => {
      setTeamHeaderData({
        teamName: data.teamName,
        leagueName: data.leagueName,
        logoUrl: data.logoUrl,
        teamId: data.teamId,
        leagueId: data.leagueId,
      });
    },
    [],
  );

  const refreshSponsors = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listSponsors();
      setSponsors(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team sponsors';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [listSponsors]);

  React.useEffect(() => {
    refreshSponsors();
  }, [refreshSponsors]);

  const handleOpenCreate = () => {
    setDialogState({ open: true, mode: 'create', sponsor: null });
  };

  const handleOpenEdit = (sponsor: SponsorType) => {
    setDialogState({ open: true, mode: 'edit', sponsor });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false, mode: 'create', sponsor: null });
  };

  const handleDialogSuccess = async ({
    sponsor,
    message,
  }: {
    sponsor: SponsorType;
    message: string;
  }) => {
    setSuccess(message);
    setError(null);
    handleDialogClose();

    if (dialogState.mode === 'edit') {
      setSponsors((prev) => prev.map((s) => (s.id === sponsor.id ? sponsor : s)));
    } else {
      setSponsors((prev) => [...prev, sponsor]);
    }
  };

  const handleDelete = async (sponsorId: string) => {
    try {
      setSuccess(null);
      setError(null);
      clearError();
      await deleteSponsor(sponsorId);
      setSuccess('Sponsor deleted successfully');
      await refreshSponsors();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sponsor';
      setError(message);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <TeamAvatar
              name={teamHeaderData?.teamName || 'Team'}
              logoUrl={teamHeaderData?.logoUrl}
              size={56}
              alt={`${teamHeaderData?.teamName || 'Team'} logo`}
            />
            <Stack direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap">
              {teamHeaderData?.leagueName && (
                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                  {teamHeaderData.leagueName}
                </Typography>
              )}
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                {teamHeaderData?.teamName || 'Team Sponsor Management'}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </AccountPageHeader>

      <Box sx={{ display: 'none' }}>
        <TeamInfoCard
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          onTeamDataLoaded={handleTeamDataLoaded}
        />
      </Box>

      <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink
            component={NextLink}
            color="inherit"
            href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`}
          >
            Team Page
          </MuiLink>
          <Typography color="text.primary">Sponsor Management</Typography>
        </Breadcrumbs>
        <Stack spacing={3} sx={{ pb: 8 }}>
          <PageSectionHeader title="Team Sponsors" variant="h5" component="h1" />

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 72 }}>Logo</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Website</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sponsors.map((sponsor) => (
                    <TableRow key={sponsor.id} hover>
                      <TableCell>
                        <Avatar
                          src={sponsor.photoUrl ?? undefined}
                          alt={sponsor.name ? `${sponsor.name} logo` : 'Sponsor logo'}
                          variant="rounded"
                          sx={{ width: 40, height: 40, bgcolor: 'grey.100', color: 'text.primary' }}
                        >
                          {sponsor.name?.charAt(0).toUpperCase() ?? ''}
                        </Avatar>
                      </TableCell>
                      <TableCell>{sponsor.name}</TableCell>
                      <TableCell>{sponsor.email || '—'}</TableCell>
                      <TableCell>{sponsor.phone || '—'}</TableCell>
                      <TableCell>{sponsor.website || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          onClick={() => handleOpenEdit(sponsor)}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDelete(sponsor.id)}
                          size="small"
                          disabled={mutationLoading}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sponsors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No sponsors have been added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>

        <Fab
          color="primary"
          aria-label="add sponsor"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
          onClick={handleOpenCreate}
        >
          <Add />
        </Fab>
      </Container>

      <SponsorFormDialog
        open={dialogState.open}
        context={{ type: 'team', accountId, seasonId, teamSeasonId }}
        mode={dialogState.mode}
        initialSponsor={dialogState.mode === 'edit' ? dialogState.sponsor : null}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        onError={(message) => setError(message)}
      />
    </main>
  );
};

export default TeamSponsorManagement;
