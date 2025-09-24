'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { SponsorType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../../../../components/AccountPageHeader';
import SponsorFormDialog from '../../../../../../../../../components/sponsors/SponsorFormDialog';
import { useSponsorOperations } from '../../../../../../../../../hooks/useSponsorOperations';

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

  const handleDialogSuccess = async ({ message }: { sponsor: SponsorType; message: string }) => {
    setSuccess(message);
    setError(null);
    handleDialogClose();
    await refreshSponsors();
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
        <Box display="flex" justifyContent="center">
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Team Sponsor Management
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h1">
              Team Sponsors
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
              Add Sponsor
            </Button>
          </Box>

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
                      <TableCell>{sponsor.name}</TableCell>
                      <TableCell>{sponsor.email || '—'}</TableCell>
                      <TableCell>{sponsor.phone || '—'}</TableCell>
                      <TableCell>{sponsor.website || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          onClick={() => handleOpenEdit(sponsor)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDelete(sponsor.id)}
                          size="small"
                          disabled={mutationLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sponsors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No sponsors have been added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
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
