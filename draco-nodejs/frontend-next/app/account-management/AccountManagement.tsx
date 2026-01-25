'use client';

import React, { useState, useEffect } from 'react';
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
import {
  getManagedAccounts,
  getAccountTypes,
  getAccountAffiliations,
} from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import type { AccountLogoOperationSuccess } from '../../hooks/useAccountLogoOperations';

const AccountManagement: React.FC = () => {
  const { token } = useAuth();
  const { hasRole } = useRole();
  const { setCurrentAccount } = useAccount();
  const apiClient = useApiClient();

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

  const loadDataRef = React.useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const errors: string[] = [];
      try {
        const [accountsResult, typesResult, affiliationsResult] = await Promise.all([
          getManagedAccounts({ client: apiClient, throwOnError: false }),
          getAccountTypes({ client: apiClient, throwOnError: false }),
          getAccountAffiliations({ client: apiClient, throwOnError: false }),
        ]);

        try {
          const accountsData = unwrapApiResult(accountsResult, 'Failed to load accounts') as
            | SharedAccountType[]
            | undefined;
          setAccounts(accountsData ?? []);
        } catch (err) {
          setAccounts([]);
          errors.push(err instanceof Error ? err.message : 'Failed to load accounts');
        }

        try {
          const types = unwrapApiResult(typesResult, 'Failed to load account types') as
            | AccountTypeReference[]
            | undefined;
          setAccountTypes(types ?? []);
        } catch (err) {
          setAccountTypes([]);
          errors.push(err instanceof Error ? err.message : 'Failed to load account types');
        }

        try {
          const affils = unwrapApiResult(affiliationsResult, 'Failed to load affiliations') as
            | AccountAffiliationType[]
            | undefined;
          setAffiliations(affils ?? []);
        } catch (err) {
          setAffiliations([]);
          errors.push(err instanceof Error ? err.message : 'Failed to load affiliations');
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
    };

    loadDataRef.current = loadData;

    if (token) {
      void loadData();
    }
  }, [token, apiClient]);

  const getAccountTypeName = (account: SharedAccountType) =>
    account.configuration?.accountType?.name ?? 'Unknown';

  const getAffiliationName = (account: SharedAccountType) =>
    account.configuration?.affiliation?.name ?? '—';

  const getOwnerDisplayName = (account: SharedAccountType) => {
    const contact = account.accountOwner?.contact;
    if (contact) {
      return `${contact.firstName} ${contact.lastName}`.trim();
    }
    const userEmail = account.accountOwner?.user?.userName;
    if (userEmail) {
      return userEmail;
    }
    return 'Unknown Owner';
  };

  const getTimezoneId = (account: SharedAccountType) =>
    account.configuration?.timeZone ?? DEFAULT_TIMEZONE;

  const handleViewAccount = (account: SharedAccountType) => {
    setCurrentAccount({
      id: account.id,
      name: account.name,
      accountType: account.configuration?.accountType?.name || undefined,
      timeZone: account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
      timeZoneSource: 'account',
    });
    window.location.href = `/account/${account.id}`;
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const openEditDialog = (account: SharedAccountType) => {
    setSelectedAccount(account);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (account: SharedAccountType) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleDialogError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const handleCreateSuccess = () => {
    setError(null);
    setSuccess(null);
    void loadDataRef.current?.();
  };

  const handleEditSuccess = () => {
    setError(null);
    setSuccess(null);
    void loadDataRef.current?.();
  };

  const handleDeleteSuccess = () => {
    setError(null);
    setSuccess(null);
    void loadDataRef.current?.();
  };

  const handleLogoDialogClose = () => {
    setLogoDialogOpen(false);
    setLogoDialogAccount(null);
  };

  const handleLogoSuccess = (result: AccountLogoOperationSuccess) => {
    setError(null);
    setSuccess(result.message);
    setLogoRefreshKey((k) => k + 1);
    void loadDataRef.current?.();
  };

  const getAccountLogoUrl = (account: SharedAccountType | null) => {
    if (!account) return null;
    return account.accountLogoUrl ? `${account.accountLogoUrl}?k=${logoRefreshKey}` : null;
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
