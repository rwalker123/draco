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
import { useRole } from '../../context/RoleContext';
import { useAccount } from '../../context/AccountContext';
import ContactAutocomplete from '../../components/ContactAutocomplete';
import { US_TIMEZONES, getTimezoneLabel } from '../../utils/timezones';
import EditAccountLogoDialog from '../../components/EditAccountLogoDialog';
import { axiosInstance } from '../../utils/axiosConfig';

interface Account {
  id: string;
  name: string;
  accountTypeId: string;
  accountType: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  firstYear: number;
  affiliationId: string;
  affiliation: string;
  timezoneId: string;
  twitterAccountName: string;
  youtubeUserId: string;
  facebookFanPage: string;
  defaultVideo: string;
  autoPlayVideo: boolean;
  accountLogoUrl?: string;
}

interface AccountType {
  id: string;
  name: string;
  filePath: string;
}

interface Affiliation {
  id: string;
  name: string;
  url: string;
}

const AccountManagement: React.FC = () => {
  const { hasRole } = useRole();
  const { setCurrentAccount } = useAccount();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    accountTypeId: '',
    ownerUserId: '',
    affiliationId: '1',
    timezoneId: 'Eastern Standard Time',
    firstYear: new Date().getFullYear(),
  });

  // Add state for logo dialog
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoDialogAccount, setLogoDialogAccount] = useState<Account | null>(null);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  const isGlobalAdmin = hasRole('Administrator');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load accounts (my-accounts endpoint handles role-based access)
      const accountsResponse = await axiosInstance.get('/api/accounts/my-accounts');
      setAccounts(accountsResponse.data.data.accounts);

      // Load account types
      try {
        const typesResponse = await axiosInstance.get('/api/accounts/types');
        setAccountTypes(typesResponse.data.data.accountTypes);
      } catch (err) {
        // Non-critical error, continue loading other data
        console.warn('Failed to load account types:', err);
      }

      // Load affiliations
      try {
        const affiliationsResponse = await axiosInstance.get('/api/accounts/affiliations');
        setAffiliations(affiliationsResponse.data.data.affiliations);
      } catch (err) {
        // Non-critical error, continue loading other data
        console.warn('Failed to load affiliations:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {}, [accounts]);

  const handleCreateAccount = async () => {
    try {
      await axiosInstance.post('/api/accounts', formData);

      setCreateDialogOpen(false);
      setFormData({
        name: '',
        accountTypeId: '',
        ownerUserId: '',
        affiliationId: '1',
        timezoneId: 'Eastern Standard Time',
        firstYear: new Date().getFullYear(),
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount) return;

    try {
      await axiosInstance.put(`/api/accounts/${selectedAccount.id}`, formData);

      setEditDialogOpen(false);
      setSelectedAccount(null);
      setFormData({
        name: '',
        accountTypeId: '',
        ownerUserId: '',
        affiliationId: '1',
        timezoneId: 'Eastern Standard Time',
        firstYear: new Date().getFullYear(),
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      await axiosInstance.delete(`/api/accounts/${selectedAccount.id}`);

      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      accountTypeId: account.accountTypeId,
      ownerUserId: account.ownerUserId,
      affiliationId: account.affiliationId,
      timezoneId: account.timezoneId,
      firstYear: account.firstYear,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (account: Account) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleViewAccount = (account: Account) => {
    setCurrentAccount({
      id: account.id,
      name: account.name,
      accountType: account.accountType || undefined,
    });
    // Navigate to account details or dashboard
    window.location.href = `/account/${account.id}`;
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      accountTypeId: '',
      ownerUserId: '',
      affiliationId: '1',
      timezoneId: 'Eastern Standard Time',
      firstYear: new Date().getFullYear(),
    });
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setFormData({
      name: '',
      accountTypeId: '',
      ownerUserId: '',
      affiliationId: '1',
      timezoneId: 'Eastern Standard Time',
      firstYear: new Date().getFullYear(),
    });
  };

  // Helper to get logo URL (with refresh key to force reload)
  const getAccountLogoUrl = (account: Account | null) => {
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
                      label={account.accountType}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{account.affiliation}</TableCell>
                  <TableCell>{account.firstYear}</TableCell>
                  <TableCell>{account.ownerName}</TableCell>
                  <TableCell>{getTimezoneLabel(account.timezoneId)}</TableCell>
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
