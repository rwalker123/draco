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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import ContactAutocomplete from '../../components/ContactAutocomplete';
import { US_TIMEZONES, getTimezoneLabel } from '../../utils/timezones';
import EditAccountLogoDialog from '../../components/EditAccountLogoDialog';
import type {
  AccountType as SharedAccountType,
  AccountTypeReference,
  AccountAffiliationType,
  CreateAccountType,
} from '@draco/shared-schemas';
import {
  getManagedAccounts,
  getAccountAffiliations,
  getAccountTypes,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { assertNoApiError, unwrapApiResult } from '../../utils/apiResult';

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

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SharedAccountType | null>(null);

  type AccountFormState = {
    name: string;
    accountTypeId: string;
    ownerUserId: string;
    affiliationId: string;
    timezoneId: string;
    firstYear: number;
  };

  const initialFormState: AccountFormState = {
    name: '',
    accountTypeId: '',
    ownerUserId: '',
    affiliationId: '1',
    timezoneId: 'Eastern Standard Time',
    firstYear: new Date().getFullYear(),
  };

  // Form states
  const [formData, setFormData] = useState<AccountFormState>(initialFormState);

  // Add state for logo dialog
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoDialogAccount, setLogoDialogAccount] = useState<SharedAccountType | null>(null);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  const buildAccountPayload = useCallback(
    (
      state: AccountFormState,
      existingAccount?: SharedAccountType | null,
    ): Partial<CreateAccountType> => {
      const accountType = accountTypes.find((type) => type.id === state.accountTypeId);
      const affiliation = affiliations.find((item) => item.id === state.affiliationId);

      const configuration: NonNullable<CreateAccountType['configuration']> = {};

      if (accountType) {
        configuration.accountType = {
          id: accountType.id,
          name: accountType.name,
        };
      }

      if (affiliation) {
        configuration.affiliation = {
          id: affiliation.id,
          name: affiliation.name,
          url: affiliation.url ?? undefined,
        };
      }

      if (state.timezoneId) {
        configuration.timezoneId = state.timezoneId;
      }

      if (state.firstYear) {
        configuration.firstYear = state.firstYear;
      }

      const payload: Partial<CreateAccountType> = {
        name: state.name,
        accountLogoUrl: existingAccount?.accountLogoUrl ?? '',
      };

      if (Object.keys(configuration).length > 0) {
        payload.configuration = configuration;
      }

      if (existingAccount?.socials) {
        payload.socials = existingAccount.socials;
      }

      if (existingAccount?.urls?.length) {
        payload.urls = existingAccount.urls.map((url) => ({ id: url.id, url: url.url }));
      }

      return payload;
    },
    [accountTypes, affiliations],
  );

  const isGlobalAdmin = hasRole('Administrator');

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

  const getOwnerUserId = useCallback(
    (account: SharedAccountType) => account.accountOwner?.user?.id ?? '',
    [],
  );

  const getAccountTypeId = useCallback(
    (account: SharedAccountType) => account.configuration?.accountType?.id ?? '',
    [],
  );

  const getAffiliationId = useCallback(
    (account: SharedAccountType) => account.configuration?.affiliation?.id ?? '1',
    [],
  );

  const getTimezoneId = useCallback(
    (account: SharedAccountType) => account.configuration?.timezoneId ?? 'Eastern Standard Time',
    [],
  );

  const getFirstYearValue = useCallback(
    (account: SharedAccountType) => account.configuration?.firstYear ?? new Date().getFullYear(),
    [],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const managedAccountsResult = await getManagedAccounts({
        client: apiClient,
        throwOnError: false,
      });
      const managedAccounts = unwrapApiResult(managedAccountsResult, 'Failed to load accounts') as
        | SharedAccountType[]
        | undefined;

      setAccounts(managedAccounts ?? []);

      const typesResult = await getAccountTypes({ client: apiClient, throwOnError: false });
      const types = unwrapApiResult(typesResult, 'Failed to load account types') as
        | AccountTypeReference[]
        | undefined;
      setAccountTypes(types ?? []);

      const affiliationsResult = await getAccountAffiliations({
        client: apiClient,
        throwOnError: false,
      });
      const affiliationsData = unwrapApiResult(
        affiliationsResult,
        'Failed to load affiliations',
      ) as AccountAffiliationType[] | undefined;
      setAffiliations(affiliationsData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  useEffect(() => {}, [accounts]);

  const handleCreateAccount = async () => {
    try {
      if (!formData.accountTypeId) {
        setError('Account type is required');
        return;
      }

      setError(null);

      const payload = buildAccountPayload(formData);

      const result = await createAccount({
        client: apiClient,
        body: payload as CreateAccountType,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to create account');

      setCreateDialogOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount) return;

    try {
      if (!formData.accountTypeId) {
        setError('Account type is required');
        return;
      }

      setError(null);

      const payload = buildAccountPayload(formData, selectedAccount);

      const result = await updateAccount({
        client: apiClient,
        path: { accountId: selectedAccount.id },
        body: payload,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to update account');

      setEditDialogOpen(false);
      setSelectedAccount(null);
      setFormData(initialFormState);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      const result = await deleteAccount({
        client: apiClient,
        path: { accountId: selectedAccount.id },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete account');

      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const openEditDialog = (account: SharedAccountType) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      accountTypeId: getAccountTypeId(account),
      ownerUserId: getOwnerUserId(account),
      affiliationId: getAffiliationId(account),
      timezoneId: getTimezoneId(account),
      firstYear: getFirstYearValue(account),
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (account: SharedAccountType) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleViewAccount = (account: SharedAccountType) => {
    setCurrentAccount({
      id: account.id,
      name: account.name,
      accountType: account.configuration?.accountType?.name || undefined,
    });
    // Navigate to account details or dashboard
    window.location.href = `/account/${account.id}`;
  };

  const handleCreateClick = () => {
    setFormData(initialFormState);
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setFormData(initialFormState);
  };

  // Helper to get logo URL (with refresh key to force reload)
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
                        <IconButton size="small" onClick={() => openEditDialog(account)}>
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

      {/* Create Account Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.accountTypeId}
                onChange={(e) => setFormData({ ...formData, accountTypeId: e.target.value })}
                label="Account Type"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ContactAutocomplete
              key={`create-owner-${createDialogOpen}`}
              label="Owner"
              value={formData.ownerUserId}
              onChange={(value) => setFormData({ ...formData, ownerUserId: value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Affiliation</InputLabel>
              <Select
                value={formData.affiliationId}
                onChange={(e) => setFormData({ ...formData, affiliationId: e.target.value })}
                label="Affiliation"
              >
                {affiliations.map((affiliation) => (
                  <MenuItem key={affiliation.id} value={affiliation.id}>
                    {affiliation.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezoneId}
                onChange={(e) => setFormData({ ...formData, timezoneId: e.target.value })}
                label="Timezone"
              >
                {US_TIMEZONES.map((timezone) => (
                  <MenuItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="First Year"
              type="number"
              value={formData.firstYear}
              onChange={(e) => setFormData({ ...formData, firstYear: parseInt(e.target.value) })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button onClick={handleCreateAccount} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.accountTypeId}
                onChange={(e) => setFormData({ ...formData, accountTypeId: e.target.value })}
                label="Account Type"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ContactAutocomplete
              key={`edit-owner-${selectedAccount?.id || 'none'}`}
              label="Owner"
              value={formData.ownerUserId}
              onChange={(value) => setFormData({ ...formData, ownerUserId: value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Affiliation</InputLabel>
              <Select
                value={formData.affiliationId}
                onChange={(e) => setFormData({ ...formData, affiliationId: e.target.value })}
                label="Affiliation"
              >
                {affiliations.map((affiliation) => (
                  <MenuItem key={affiliation.id} value={affiliation.id}>
                    {affiliation.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezoneId}
                onChange={(e) => setFormData({ ...formData, timezoneId: e.target.value })}
                label="Timezone"
              >
                {US_TIMEZONES.map((timezone) => (
                  <MenuItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="First Year"
              type="number"
              value={formData.firstYear}
              onChange={(e) => setFormData({ ...formData, firstYear: parseInt(e.target.value) })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAccount} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* EditAccountLogoDialog integration */}
      <EditAccountLogoDialog
        open={logoDialogOpen}
        accountId={logoDialogAccount?.id || ''}
        accountLogoUrl={getAccountLogoUrl(logoDialogAccount)}
        onClose={() => setLogoDialogOpen(false)}
        onLogoUpdated={() => {
          setLogoDialogOpen(false);
          setLogoRefreshKey((k) => k + 1);
          loadData();
        }}
      />

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the account @quote;{selectedAccount?.name}@quote;? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default AccountManagement;
