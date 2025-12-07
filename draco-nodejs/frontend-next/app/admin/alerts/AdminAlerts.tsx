'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert as MuiAlert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CampaignIcon from '@mui/icons-material/Campaign';
import { createAlert, deleteAlert, fetchAllAlerts, updateAlert } from '@/services/alertService';
import type { AlertType, UpsertAlertType } from '@draco/shared-schemas';
import { useRole } from '@/context/RoleContext';
import { formatDateTime } from '@/utils/dateUtils';
import AlertFormDialog from '@/components/alerts/AlertFormDialog';
import { useApiClient } from '@/hooks/useApiClient';

type DialogState = {
  mode: 'create' | 'edit';
  alert?: AlertType;
};

const sortAlerts = (list: AlertType[]): AlertType[] => {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const AdminAlerts: React.FC = () => {
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const isAdministrator = hasRole('Administrator');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllAlerts(apiClient);
      setAlerts(sortAlerts(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load alerts');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleCreate = useCallback(() => {
    setDialogState({ mode: 'create' });
  }, []);

  const handleEdit = useCallback((alert: AlertType) => {
    setDialogState({ mode: 'edit', alert });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  const upsertAlert = useCallback(
    async (payload: UpsertAlertType) => {
      const targetId =
        dialogState?.mode === 'edit' && dialogState.alert ? dialogState.alert.id : 'new';
      setMutatingId(targetId);

      try {
        if (dialogState?.mode === 'edit' && dialogState.alert) {
          const updated = await updateAlert(dialogState.alert.id, payload, apiClient);
          setAlerts((prev) =>
            sortAlerts(prev.map((item) => (item.id === updated.id ? updated : item))),
          );
        } else {
          const created = await createAlert(payload, apiClient);
          setAlerts((prev) => sortAlerts([created, ...prev]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save alert');
      } finally {
        setMutatingId(null);
      }
    },
    [dialogState, apiClient],
  );

  const handleDelete = useCallback(
    async (alert: AlertType) => {
      const confirmed = window.confirm('Delete this alert? This cannot be undone.');
      if (!confirmed) {
        return;
      }

      setMutatingId(alert.id);
      try {
        await deleteAlert(alert.id, apiClient);
        setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete alert');
      } finally {
        setMutatingId(null);
      }
    },
    [apiClient],
  );

  const handleToggleActive = useCallback(
    async (alert: AlertType) => {
      setMutatingId(alert.id);
      try {
        const updated = await updateAlert(
          alert.id,
          { message: alert.message, isActive: !alert.isActive },
          apiClient,
        );
        setAlerts((prev) =>
          sortAlerts(prev.map((item) => (item.id === updated.id ? updated : item))),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update alert');
      } finally {
        setMutatingId(null);
      }
    },
    [apiClient],
  );

  const pageDescription = useMemo(
    () => 'Create, update, and retire system-wide alerts shown to all accounts.',
    [],
  );

  if (!isAdministrator) {
    return (
      <main className="min-h-screen bg-background">
        <MuiAlert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </MuiAlert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CampaignIcon color="primary" />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Alert Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageDescription}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {error ? <MuiAlert severity="error">{error}</MuiAlert> : null}

        <Card variant="outlined">
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : alerts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  No alerts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create an alert to broadcast messages across all accounts.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Message</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id} hover>
                      <TableCell sx={{ maxWidth: 520 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={alert.isActive ? 'Active' : 'Inactive'}
                            color={alert.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          <Tooltip title={alert.isActive ? 'Deactivate alert' : 'Activate alert'}>
                            <Switch
                              size="small"
                              checked={alert.isActive}
                              onChange={() => void handleToggleActive(alert)}
                              disabled={mutatingId === alert.id}
                            />
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDateTime(alert.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(alert.updatedAt)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit alert">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(alert)}
                                disabled={mutatingId === alert.id}
                                aria-label={`Edit alert ${alert.id}`}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete alert">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => void handleDelete(alert)}
                                disabled={mutatingId === alert.id}
                                aria-label={`Delete alert ${alert.id}`}
                              >
                                {mutatingId === alert.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Stack>

      <AlertFormDialog
        key={dialogState?.alert?.id ?? 'new'}
        open={Boolean(dialogState)}
        initialAlert={dialogState?.alert}
        onClose={closeDialog}
        onSubmit={async (values) => {
          await upsertAlert(values);
          closeDialog();
        }}
      />

      <Fab
        color="primary"
        aria-label="Create alert"
        onClick={handleCreate}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>
    </main>
  );
};

export default AdminAlerts;
