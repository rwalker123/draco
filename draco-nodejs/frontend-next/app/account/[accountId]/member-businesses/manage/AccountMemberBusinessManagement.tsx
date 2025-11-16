'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { listMemberBusinesses } from '@draco/shared-api-client';
import type { MemberBusinessType } from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import MemberBusinessFormDialog, {
  type MemberBusinessDialogResult,
} from '@/components/profile/MemberBusinessFormDialog';
import MemberBusinessDeleteDialog, {
  type MemberBusinessDeleteResult,
} from '@/components/profile/MemberBusinessDeleteDialog';
import WidgetShell from '@/components/ui/WidgetShell';
import { useAccountSettings } from '@/hooks/useAccountSettings';

interface AccountMemberBusinessManagementProps {
  accountId: string;
}

type FormState = {
  open: boolean;
  business: MemberBusinessType | null;
};

type DeleteState = {
  open: boolean;
  business: MemberBusinessType | null;
};

const AccountMemberBusinessManagement: React.FC<AccountMemberBusinessManagementProps> = ({
  accountId,
}) => {
  const apiClient = useApiClient();
  const {
    settings: accountSettings,
    loading: settingsLoading,
    error: settingsLoadError,
    updatingKey: settingUpdatingKey,
    updateSetting,
  } = useAccountSettings(accountId, { requireManage: true });
  const [memberBusinesses, setMemberBusinesses] = useState<MemberBusinessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({ open: false, business: null });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false, business: null });

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadMemberBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      resetMessages();

      const result = await listMemberBusinesses({
        client: apiClient,
        path: { accountId },
        security: [{ type: 'http', scheme: 'bearer' }],
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Unable to load member businesses');
      const businesses = data?.memberBusinesses ?? [];
      setMemberBusinesses(businesses);
    } catch (err) {
      console.error('Failed to load member businesses', err);
      const message = err instanceof Error ? err.message : 'Unable to load member businesses';
      setError(message);
      setMemberBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    void loadMemberBusinesses();
  }, [loadMemberBusinesses]);

  const handleEdit = (business: MemberBusinessType) => {
    setFormState({ open: true, business });
  };

  const handleDelete = (business: MemberBusinessType) => {
    setDeleteState({ open: true, business });
  };

  const handleFormClose = () => {
    setFormState({ open: false, business: null });
  };

  const handleDeleteClose = () => {
    setDeleteState({ open: false, business: null });
  };

  const handleFormSuccess = (result: MemberBusinessDialogResult) => {
    setSuccess(result.message);
    setError(null);
    handleFormClose();
    void loadMemberBusinesses();
  };

  const handleDeleteSuccess = (result: MemberBusinessDeleteResult) => {
    setSuccess(result.message);
    setError(null);
    handleDeleteClose();
    void loadMemberBusinesses();
  };

  const handleDialogError = (message: string) => {
    setError(message);
  };

  const directorySetting = useMemo(
    () => accountSettings?.find((setting) => setting.definition.key === 'ShowBusinessDirectory'),
    [accountSettings],
  );

  const handleDirectoryToggle = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    try {
      await updateSetting('ShowBusinessDirectory', checked);
      setSuccess(`Member Business Directory ${checked ? 'enabled' : 'disabled'} for this account.`);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update member business availability';
      setError(message);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Box display="flex" alignItems="center" gap={1} justifyContent="center">
            <BusinessIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Member Business Management
            </Typography>
          </Box>
        </AccountPageHeader>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <WidgetShell
              title="Directory Availability"
              subtitle="Control whether members can view and manage the public directory."
              accent="primary"
            >
              {settingsLoadError ? (
                <Alert severity="error">{settingsLoadError}</Alert>
              ) : (
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(directorySetting?.value)}
                        onChange={handleDirectoryToggle}
                        disabled={
                          settingsLoading ||
                          !directorySetting ||
                          settingUpdatingKey === 'ShowBusinessDirectory'
                        }
                        color="primary"
                      />
                    }
                    label={
                      directorySetting?.value
                        ? 'Member Business Directory is enabled'
                        : 'Member Business Directory is disabled'
                    }
                  />
                  <Typography variant="body2" color="text.secondary">
                    When enabled, members can access the Member Business Directory from their
                    profile and navigation menu. Disabling it hides those entry points but does not
                    remove existing records.
                  </Typography>
                </Stack>
              )}
            </WidgetShell>
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

            <WidgetShell
              title="Registered Member Businesses"
              subtitle="Manage and review member-submitted listings."
              accent="success"
            >
              {loading ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ tableLayout: 'auto' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'normal' }}>Name</TableCell>
                        <TableCell sx={{ whiteSpace: 'normal' }}>Contact</TableCell>
                        <TableCell sx={{ whiteSpace: 'normal' }}>Email</TableCell>
                        <TableCell sx={{ whiteSpace: 'normal' }}>Phone</TableCell>
                        <TableCell sx={{ whiteSpace: 'normal' }}>Website</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {memberBusinesses.map((business) => (
                        <TableRow key={business.id} hover>
                          <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {business.name}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {business.contact
                              ? `${business.contact.firstName} ${business.contact.lastName}`.trim()
                              : '—'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {business.email || '—'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {business.phone || '—'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {business.website || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              aria-label="edit"
                              size="small"
                              onClick={() => handleEdit(business)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              size="small"
                              onClick={() => handleDelete(business)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {memberBusinesses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No member businesses have been added yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </WidgetShell>
          </Stack>
        </Container>
      </main>

      <MemberBusinessFormDialog
        open={formState.open}
        mode="edit"
        accountId={accountId}
        contactId={formState.business?.contact.id ?? null}
        memberBusiness={formState.business}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        onError={handleDialogError}
      />

      <MemberBusinessDeleteDialog
        open={deleteState.open}
        accountId={accountId}
        memberBusiness={deleteState.business}
        onClose={handleDeleteClose}
        onSuccess={handleDeleteSuccess}
        onError={handleDialogError}
      />
    </>
  );
};

export default AccountMemberBusinessManagement;
