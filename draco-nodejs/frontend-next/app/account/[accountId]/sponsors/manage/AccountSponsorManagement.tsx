'use client';

import React from 'react';
import {
  Alert,
  Box,
  Avatar,
  CircularProgress,
  Container,
  Paper,
  Fab,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { SponsorType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../components/admin';
import SponsorFormDialog from '../../../../../components/sponsors/SponsorFormDialog';
import SponsorDeleteDialog from '../../../../../components/sponsors/SponsorDeleteDialog';
import {
  EditIconButton,
  DeleteIconButton,
} from '../../../../../components/common/ActionIconButtons';
import { useSponsorOperations } from '../../../../../hooks/useSponsorOperations';

interface AccountSponsorManagementProps {
  accountId: string;
}

type DialogState = {
  open: boolean;
  mode: 'create' | 'edit';
  sponsor: SponsorType | null;
};

const AccountSponsorManagement: React.FC<AccountSponsorManagementProps> = ({ accountId }) => {
  const { listSponsors } = useSponsorOperations({
    type: 'account',
    accountId,
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
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [sponsorToDelete, setSponsorToDelete] = React.useState<SponsorType | null>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  const listSponsorsRef = React.useRef(listSponsors);
  React.useEffect(() => {
    listSponsorsRef.current = listSponsors;
  }, [listSponsors]);

  React.useEffect(() => {
    let cancelled = false;

    const loadSponsors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listSponsorsRef.current();
        if (!cancelled) {
          setSponsors(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load sponsors';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSponsors();

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const handleOpenCreate = () => {
    setDialogState({ open: true, mode: 'create', sponsor: null });
  };

  const handleOpenEdit = (sponsor: SponsorType) => {
    setDialogState({ open: true, mode: 'edit', sponsor });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false, mode: 'create', sponsor: null });
  };

  const handleDialogSuccess = ({ sponsor, message }: { sponsor: SponsorType; message: string }) => {
    setSuccess(message);
    setError(null);
    setDialogError(null);
    handleDialogClose();

    if (dialogState.mode === 'edit') {
      setSponsors((prev) => prev.map((s) => (s.id === sponsor.id ? sponsor : s)));
    } else {
      setSponsors((prev) => [...prev, sponsor]);
    }
  };

  const handleDeleteSuccess = ({ sponsor, message }: { sponsor: SponsorType; message: string }) => {
    setSuccess(message);
    setError(null);
    setDialogError(null);
    handleCloseDeleteDialog();
    setSponsors((prev) => prev.filter((s) => s.id !== sponsor.id));
  };

  const handleOpenDeleteDialog = (sponsor: SponsorType) => {
    setSponsorToDelete(sponsor);
    setDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteOpen(false);
    setSponsorToDelete(null);
  };

  const handleDialogError = (message: string) => {
    setDialogError(message);
  };

  const handleSnackbarClose = () => {
    setSuccess(null);
    setDialogError(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Sponsor Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Manage sponsor relationships and display sponsor information.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Account', href: `/account/${accountId}/admin/account` }}
          currentPage="Account Sponsors"
        />

        <Stack spacing={3} sx={{ pb: 8 }}>
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
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <EditIconButton
                            tooltipTitle="Edit sponsor"
                            aria-label={`Edit ${sponsor.name}`}
                            onClick={() => handleOpenEdit(sponsor)}
                          />
                          <DeleteIconButton
                            tooltipTitle="Delete sponsor"
                            aria-label={`Delete ${sponsor.name}`}
                            onClick={() => handleOpenDeleteDialog(sponsor)}
                          />
                        </Stack>
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
      </Container>

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

      <SponsorFormDialog
        open={dialogState.open}
        context={{ type: 'account', accountId }}
        mode={dialogState.mode}
        initialSponsor={dialogState.mode === 'edit' ? dialogState.sponsor : null}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <SponsorDeleteDialog
        accountId={accountId}
        open={deleteOpen}
        sponsor={sponsorToDelete}
        onClose={handleCloseDeleteDialog}
        onSuccess={handleDeleteSuccess}
        onError={handleDialogError}
      />

      <Snackbar
        open={Boolean(success || dialogError)}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={success ? 'success' : 'error'}
          onClose={handleSnackbarClose}
          sx={{ width: '100%' }}
        >
          {success || dialogError}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default AccountSponsorManagement;
