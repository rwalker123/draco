'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useAccount } from '../../context/AccountContext';
import { getTimezoneLabel, DEFAULT_TIMEZONE } from '../../utils/timezones';
import EditAccountLogoDialog from '../../components/EditAccountLogoDialog';
import CreateAccountDialog from '../../components/account-management/dialogs/CreateAccountDialog';
import DeleteAccountDialog from '../../components/account-management/dialogs/DeleteAccountDialog';
import EditAccountDialog from '../../components/account-management/dialogs/EditAccountDialog';
import type {
  AccountType as SharedAccountType,
  AccountTypeReference,
  AccountAffiliationType,
} from '@draco/shared-schemas';
import { useAccountManagementService } from '../../hooks/useAccountManagementService';
import type { AccountLogoOperationSuccess } from '../../hooks/useAccountLogoOperations';

const AccountManagement: React.FC = () => {
  const { token } = useAuth();
  const { hasRole } = useRole();
  const { setCurrentAccount } = useAccount();
  const { fetchManagedAccounts, fetchAccountTypes, fetchAccountAffiliations } =
    useAccountManagementService();

  const [accounts, setAccounts] = useState<SharedAccountType[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountTypeReference[]>([]);
  const [affiliations, setAffiliations] = useState<AccountAffiliationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SharedAccountType | null>(null);

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoDialogAccount, setLogoDialogAccount] = useState<SharedAccountType | null>(null);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  const isGlobalAdmin = hasRole('Administrator');

  const loadData = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    try {
      const [accountsResult, typesResult, affiliationsResult] = await Promise.all([
        fetchManagedAccounts(),
        fetchAccountTypes(),
        fetchAccountAffiliations(),
      ]);

      if (accountsResult.success) {
        setAccounts(accountsResult.data);
      } else {
        setAccounts([]);
        errors.push(accountsResult.error);
      }

      if (typesResult.success) {
        setAccountTypes(typesResult.data);
      } else {
        setAccountTypes([]);
        errors.push(typesResult.error);
      }

      if (affiliationsResult.success) {
        setAffiliations(affiliationsResult.data);
      } else {
        setAffiliations([]);
        errors.push(affiliationsResult.error);
      }

      setError(errors[0] ?? null);
      if (errors.length > 0) {
        setSuccess(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load account data';
      setError(message);
      setAccounts([]);
      setAccountTypes([]);
      setAffiliations([]);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  }, [fetchManagedAccounts, fetchAccountTypes, fetchAccountAffiliations]);

  useEffect(() => {
    if (token) {
      void loadData();
    }
  }, [token, loadData]);

  const getAccountTypeName = useCallback(
    (account: SharedAccountType) => account.configuration?.accountType?.name ?? 'Unknown',
    [],
  );

  const getAffiliationName = useCallback(
    (account: SharedAccountType) => account.configuration?.affiliation?.name ?? '—',
    [],
  );

  const getOwnerDisplayName = useCallback((account: SharedAccountType) => {
    const contact = account.accountOwner?.contact;
    if (contact) {
      return `${contact.firstName} ${contact.lastName}`.trim();
    }
    const userEmail = account.accountOwner?.user?.userName;
    if (userEmail) {
      return userEmail;
    }
    return 'Unknown Owner';
  }, []);

  const getTimezoneId = useCallback(
    (account: SharedAccountType) => account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
    [],
  );

  const handleViewAccount = useCallback(
    (account: SharedAccountType) => {
      setCurrentAccount({
        id: account.id,
        name: account.name,
        accountType: account.configuration?.accountType?.name || undefined,
        timeZone: account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
        timeZoneSource: 'account',
      });
      window.location.href = `/account/${account.id}`;
    },
    [setCurrentAccount],
  );

  const handleCreateClick = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedAccount(null);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  }, []);

  const openEditDialog = useCallback((account: SharedAccountType) => {
    setSelectedAccount(account);
    setEditDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((account: SharedAccountType) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  }, []);

  const handleDialogError = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setError(null);
    setSuccess(null);
    void loadData();
  }, [loadData]);

  const handleEditSuccess = useCallback(() => {
    setError(null);
    setSuccess(null);
    void loadData();
  }, [loadData]);

  const handleDeleteSuccess = useCallback(() => {
    setError(null);
    setSuccess(null);
    void loadData();
  }, [loadData]);

  const handleLogoDialogClose = useCallback(() => {
    setLogoDialogOpen(false);
    setLogoDialogAccount(null);
  }, []);

  const handleLogoSuccess = useCallback(
    (result: AccountLogoOperationSuccess) => {
      setError(null);
      setSuccess(result.message);
      setLogoRefreshKey((k) => k + 1);
      void loadData();
    },
    [loadData],
  );

  const getAccountLogoUrl = useCallback(
    (account: SharedAccountType | null) => {
      if (!account) return null;
      return account.accountLogoUrl ? `${account.accountLogoUrl}?k=${logoRefreshKey}` : null;
    },
    [logoRefreshKey],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Account Management
        </Typography>
        {isGlobalAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Account
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        You can use &quot;Account Management&quot; to update your organization details.
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Affiliation</TableCell>
                <TableCell>First Year</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {account.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getAccountTypeName(account)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{getAffiliationName(account)}</TableCell>
                  <TableCell>{account.configuration?.firstYear ?? '—'}</TableCell>
                  <TableCell>{getOwnerDisplayName(account)}</TableCell>
                  <TableCell>{getTimezoneLabel(getTimezoneId(account))}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Account">
                        <IconButton size="small" onClick={() => handleViewAccount(account)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Account">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(account)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Account Logo">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setLogoDialogAccount(account);
                            setLogoDialogOpen(true);
                          }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Account Settings">
                        <IconButton
                          size="small"
                          onClick={() => (window.location.href = `/account/${account.id}/settings`)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      {isGlobalAdmin && (
                        <Tooltip title="Delete Account">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(account)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CreateAccountDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onSuccess={() => handleCreateSuccess()}
        onError={handleDialogError}
      />

      <EditAccountDialog
        open={editDialogOpen}
        account={selectedAccount}
        accountTypes={accountTypes}
        affiliations={affiliations}
        onClose={handleEditDialogClose}
        onSuccess={() => handleEditSuccess()}
        onError={handleDialogError}
      />

      <EditAccountLogoDialog
        open={logoDialogOpen}
        accountId={logoDialogAccount?.id || ''}
        accountLogoUrl={getAccountLogoUrl(logoDialogAccount)}
        onClose={handleLogoDialogClose}
        onSuccess={handleLogoSuccess}
        onError={handleDialogError}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        account={selectedAccount}
        onClose={handleDeleteDialogClose}
        onSuccess={() => handleDeleteSuccess()}
        onError={handleDialogError}
      />
    </main>
  );
};

export default AccountManagement;
