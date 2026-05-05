'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useApiClient } from '@/hooks/useApiClient';
import { useRole } from '@/context/RoleContext';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationSnackbar from '../../../components/common/NotificationSnackbar';
import { listAdminUsers, deleteAdminUser } from '@draco/shared-api-client';
import type { AdminUserListResponseType, AdminUserSummaryType } from '@draco/shared-schemas';
import { unwrapApiResult } from '@/utils/apiResult';
import { formatDateTime } from '@/utils/dateUtils';

const PAGE_LIMIT = 25;

const AdminUsersPage: React.FC = () => {
  const router = useRouter();
  const apiClient = useApiClient();
  const { hasRole } = useRole();
  const { notification, showNotification, hideNotification } = useNotifications();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<AdminUserListResponseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<AdminUserSummaryType | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hasRole('Administrator')) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listAdminUsers({
          client: apiClient,
          query: {
            search: search || undefined,
            orphansOnly: orphansOnly || undefined,
            limit: PAGE_LIMIT,
            offset,
          },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const payload = unwrapApiResult(
          result,
          'Failed to load users',
        ) as AdminUserListResponseType;
        setData(payload);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load users');
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [apiClient, hasRole, search, orphansOnly, offset, refreshKey]);

  if (!hasRole('Administrator')) {
    return (
      <main className="min-h-screen bg-background">
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </Alert>
      </main>
    );
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setOffset(0);
  };

  const handleOrphansToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOrphansOnly(event.target.checked);
    setOffset(0);
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  const requestDelete = (user: AdminUserSummaryType) => {
    if (user.contactCount > 0) {
      showNotification('This user is still linked to contacts. Unlink them first.', 'error');
      return;
    }
    setPendingDelete(user);
  };

  const cancelDelete = () => {
    if (deleting) return;
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await deleteAdminUser({
        client: apiClient,
        path: { userId: pendingDelete.id },
        throwOnError: false,
      });

      if (result.error) {
        const status = result.response?.status;
        const serverMessage = result.error.message;
        let message: string;
        if (status === 409) {
          message = serverMessage ?? 'Cannot delete this user — it is still referenced.';
        } else if (status === 404) {
          message = 'User not found.';
        } else {
          message = serverMessage ?? 'Failed to delete user';
        }
        showNotification(message, 'error');
        return;
      }

      showNotification(`Deleted login ${pendingDelete.username || pendingDelete.id}.`, 'success');
      setPendingDelete(null);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      showNotification(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const totalDisplay = data?.total ?? 0;
  const pageStart = data && data.users.length > 0 ? offset + 1 : 0;
  const pageEnd = data ? offset + data.users.length : 0;

  return (
    <main className="min-h-screen bg-background">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Tooltip title="Back to Admin Dashboard">
          <IconButton onClick={() => router.push('/admin')} size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Login Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect authentication users (aspnetusers). Filter to orphan logins (no linked contacts)
            to spot rows safe to delete.
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh">
          <span>
            <IconButton color="primary" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          component="form"
          onSubmit={handleSearchSubmit}
        >
          <TextField
            label="Search by login email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            size="small"
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Search
          </Button>
          <Button onClick={handleClearSearch} disabled={loading || (!search && !searchInput)}>
            Clear
          </Button>
          <FormControlLabel
            control={<Checkbox checked={orphansOnly} onChange={handleOrphansToggle} />}
            label="Orphans only"
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Failed to load users</AlertTitle>
          {error}
        </Alert>
      )}

      <Paper>
        {loading && !data ? (
          <Stack alignItems="center" sx={{ py: 8 }} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Loading users…</Typography>
          </Stack>
        ) : (
          <>
            <TableContainer>
              <Table size="small" aria-label="Authentication users">
                <TableHead>
                  <TableRow>
                    <TableCell>Login email</TableCell>
                    <TableCell align="right">Contacts</TableCell>
                    <TableCell align="right">Failed sign-ins</TableCell>
                    <TableCell>Lockout until</TableCell>
                    <TableCell>Has password</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.users ?? []).map((user) => {
                    const isOrphan = user.contactCount === 0;
                    const lockoutDisplay = user.lockoutEndDateUtc
                      ? formatDateTime(user.lockoutEndDateUtc)
                      : '—';
                    return (
                      <TableRow key={user.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {user.username || <em>(no username)</em>}
                        </TableCell>
                        <TableCell align="right">
                          {isOrphan ? (
                            <Chip
                              label="0 (orphan)"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            user.contactCount
                          )}
                        </TableCell>
                        <TableCell align="right">{user.accessFailedCount}</TableCell>
                        <TableCell>{lockoutDisplay}</TableCell>
                        <TableCell>
                          {user.hasPassword ? (
                            <Chip label="Yes" size="small" color="success" variant="outlined" />
                          ) : (
                            <Chip label="No" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip
                            title={
                              isOrphan
                                ? 'Delete this orphan login (will be blocked if it owns accounts or other records)'
                                : 'Cannot delete: still linked to contacts'
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!isOrphan}
                                onClick={() => requestDelete(user)}
                                aria-label={`Delete ${user.username || user.id}`}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {data && data.users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No users match the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 2 }}
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                {totalDisplay > 0
                  ? `Showing ${pageStart}–${pageEnd} of ${totalDisplay}`
                  : 'No results'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={loading || !data?.hasPrev}
                  onClick={() => setOffset((value) => Math.max(0, value - PAGE_LIMIT))}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={loading || !data?.hasNext}
                  onClick={() => setOffset((value) => value + PAGE_LIMIT)}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Paper>

      <Dialog open={Boolean(pendingDelete)} onClose={cancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete login</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the authentication user{' '}
            <strong>{pendingDelete?.username || pendingDelete?.id}</strong>. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={() => void confirmDelete()}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </main>
  );
};

export default AdminUsersPage;
