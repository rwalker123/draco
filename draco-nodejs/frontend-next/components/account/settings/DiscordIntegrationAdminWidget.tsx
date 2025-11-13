'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  DiscordAccountConfigType,
  DiscordRoleMappingType,
  DiscordGuildChannelType,
  DiscordChannelMappingType,
} from '@draco/shared-schemas';
import { DiscordRoleMappingUpdateSchema } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';
import AddDiscordChannelMappingDialog from './AddDiscordChannelMappingDialog';
import ConfirmDiscordDisconnectDialog from './ConfirmDiscordDisconnectDialog';

interface DiscordIntegrationAdminWidgetProps {
  accountId: string | null;
}

const RoleMappingFormSchema = DiscordRoleMappingUpdateSchema.extend({
  permissionsText: z.string().trim().min(1, 'At least one permission is required'),
}).omit({ permissions: true });

type RoleMappingFormValues = z.infer<typeof RoleMappingFormSchema>;

const DiscordIntegrationAdminWidgetInner: React.FC<{ accountId: string }> = ({ accountId }) => {
  const {
    fetchConfig,
    updateConfig,
    fetchRoleMappings,
    createRoleMapping,
    updateRoleMapping,
    deleteRoleMapping,
    startInstall,
    fetchAvailableChannels,
    fetchChannelMappings,
    deleteChannelMapping,
  } = useAccountDiscordAdmin();

  const [config, setConfig] = useState<DiscordAccountConfigType | null>(null);
  const [roleMappings, setRoleMappings] = useState<DiscordRoleMappingType[]>([]);
  const [availableChannels, setAvailableChannels] = useState<DiscordGuildChannelType[]>([]);
  const [channelMappings, setChannelMappings] = useState<DiscordChannelMappingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleMappingError, setRoleMappingError] = useState<string | null>(null);
  const [roleMappingBusyId, setRoleMappingBusyId] = useState<string | null>(null);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [guildIdInput, setGuildIdInput] = useState('');
  const [savingGuildId, setSavingGuildId] = useState(false);
  const [guildIdError, setGuildIdError] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: roleFormErrors, isSubmitting: roleFormSubmitting },
  } = useForm<RoleMappingFormValues>({
    resolver: zodResolver(RoleMappingFormSchema),
    defaultValues: {
      discordRoleId: '',
      discordRoleName: '',
      permissionsText: '',
    },
  });

  const loadRoleMappingsData = useCallback(async () => {
    if (!accountId) {
      setRoleMappings([]);
      return;
    }
    const payload = await fetchRoleMappings(accountId);
    setRoleMappings(payload.roleMappings);
  }, [accountId, fetchRoleMappings]);

  const loadChannelMappings = useCallback(async () => {
    if (!accountId) {
      setChannelMappings([]);
      return;
    }
    const payload = await fetchChannelMappings(accountId);
    setChannelMappings(payload.channels);
  }, [accountId, fetchChannelMappings]);

  const loadAvailableChannelsData = useCallback(async () => {
    if (!accountId) {
      setAvailableChannels([]);
      return;
    }
    try {
      const payload = await fetchAvailableChannels(accountId);
      setAvailableChannels(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load Discord channels.';
      setError(message);
    }
  }, [accountId, fetchAvailableChannels]);

  const loadConfig = useCallback(async () => {
    if (!accountId) {
      setConfig(null);
      setGuildIdInput('');
      return;
    }
    const payload = await fetchConfig(accountId);
    setConfig(payload);
    setGuildIdInput(payload.guildId ?? '');
  }, [accountId, fetchConfig]);

  const loadAll = useCallback(async () => {
    if (!accountId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadConfig(), loadRoleMappingsData(), loadChannelMappings()]);
      await loadAvailableChannelsData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Discord settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, loadChannelMappings, loadConfig, loadRoleMappingsData, loadAvailableChannelsData]);

  useEffect(() => {
    if (accountId) {
      void loadAll();
    }
  }, [accountId, loadAll]);

  const handleInstall = useCallback(async () => {
    if (!accountId) {
      return;
    }
    setInstalling(true);
    try {
      const response = await startInstall(accountId);
      window.location.href = response.authorizationUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start bot installation.';
      setError(message);
      setInstalling(false);
    }
  }, [accountId, startInstall]);

  const openDisconnectDialog = useCallback(() => {
    setDisconnectDialogOpen(true);
  }, []);

  const closeDisconnectDialog = useCallback(() => {
    setDisconnectDialogOpen(false);
  }, []);

  const handleDisconnectSuccess = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const handleGuildIdSave = useCallback(async () => {
    if (!accountId) {
      return;
    }
    const trimmed = guildIdInput.trim();
    if (!trimmed) {
      setGuildIdError('Discord guild id is required.');
      return;
    }
    setSavingGuildId(true);
    setGuildIdError(null);
    try {
      await updateConfig(accountId, { guildId: trimmed });
      await loadAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save the Discord guild id.';
      setGuildIdError(message);
    } finally {
      setSavingGuildId(false);
    }
  }, [accountId, guildIdInput, loadAll, updateConfig]);

  const openRoleDialog = useCallback(() => {
    setRoleMappingError(null);
    reset({ discordRoleId: '', discordRoleName: '', permissionsText: '' });
    setDialogOpen(true);
  }, [reset]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const openEditRoleDialog = useCallback(
    (mapping: DiscordRoleMappingType) => {
      setRoleMappingError(null);
      reset({
        discordRoleId: mapping.discordRoleId,
        discordRoleName: mapping.discordRoleName,
        permissionsText: (mapping.permissions ?? []).join(', '),
      });
      setEditingMapping(mapping);
      setDialogOpen(true);
    },
    [reset],
  );

  const [editingMapping, setEditingMapping] = useState<DiscordRoleMappingType | null>(null);

  const closeRoleDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingMapping(null);
  }, []);

  const handleRoleSubmit = handleSubmit(async (values) => {
    if (!accountId) {
      return;
    }
    setRoleMappingError(null);
    const permissions = values.permissionsText
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean);

    const payload = DiscordRoleMappingUpdateSchema.parse({
      discordRoleId: values.discordRoleId.trim(),
      discordRoleName: values.discordRoleName.trim(),
      permissions,
    });

    try {
      if (editingMapping) {
        await updateRoleMapping(accountId, editingMapping.id, payload);
      } else {
        await createRoleMapping(accountId, payload);
      }
      await loadRoleMappingsData();
      setDialogOpen(false);
      setEditingMapping(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save the role mapping.';
      setRoleMappingError(message);
    }
  });

  const handleDeleteRoleMapping = useCallback(
    async (mapping: DiscordRoleMappingType) => {
      if (!accountId) {
        return;
      }
      const confirmed = window.confirm(
        `Remove Discord role mapping "${mapping.discordRoleName}"? This will revoke the associated permissions.`,
      );
      if (!confirmed) {
        return;
      }
      setRoleMappingBusyId(mapping.id);
      try {
        await deleteRoleMapping(accountId, mapping.id);
        await loadRoleMappingsData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to delete the Discord role mapping.';
        setRoleMappingError(message);
      } finally {
        setRoleMappingBusyId(null);
      }
    },
    [accountId, deleteRoleMapping, loadRoleMappingsData],
  );

  const openChannelDialog = useCallback(() => {
    setChannelError(null);
    setChannelDialogOpen(true);
  }, []);

  const handleChannelDialogSuccess = useCallback(async () => {
    await loadChannelMappings();
  }, [loadChannelMappings]);

  const handleDeleteChannelMapping = useCallback(
    async (mapping: DiscordChannelMappingType) => {
      if (!accountId) {
        return;
      }
      const confirmed = window.confirm(
        `Remove ingestion mapping for channel "${mapping.discordChannelName}"?`,
      );
      if (!confirmed) {
        return;
      }
      setChannelError(null);
      try {
        await deleteChannelMapping(accountId, mapping.id);
        await loadChannelMappings();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to delete the channel mapping.';
        setChannelError(message);
      }
    },
    [accountId, deleteChannelMapping, loadChannelMappings],
  );

  const guildDisplayName = useMemo(() => {
    if (!config?.guildId) {
      return null;
    }
    return config.guildName ? `${config.guildName} (${config.guildId})` : config.guildId;
  }, [config]);

  if (!accountId) {
    return (
      <WidgetShell
        title="Discord Integration"
        subtitle="Select an account to configure Discord."
        accent="info"
      >
        <Alert severity="info">An account identifier is required to manage Discord settings.</Alert>
      </WidgetShell>
    );
  }

  if (loading) {
    return (
      <WidgetShell title="Discord Integration" subtitle="Loading settings…" accent="info">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      </WidgetShell>
    );
  }

  if (error) {
    return (
      <WidgetShell title="Discord Integration" subtitle="Discord configuration">
        <Alert severity="error">{error}</Alert>
      </WidgetShell>
    );
  }

  if (!config?.guildId) {
    return (
      <WidgetShell
        title="Discord Integration"
        subtitle="Provide your Discord guild id to get started."
        accent="warning"
      >
        <Stack spacing={2}>
          <TextField
            label="Discord Guild ID"
            value={guildIdInput}
            onChange={(event) => {
              setGuildIdInput(event.target.value);
              setGuildIdError(null);
            }}
            error={Boolean(guildIdError)}
            helperText={
              guildIdError ??
              'Enable Developer Mode in Discord → right-click your server name → Copy Server ID.'
            }
          />
          <Alert severity="info">
            Need help? In Discord, go to <strong>User Settings &gt; Advanced</strong>, enable{' '}
            <strong>Developer Mode</strong>, then right-click your server name in the sidebar and
            choose <em>Copy Server ID</em>. Paste that value here.
          </Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="contained"
              onClick={handleGuildIdSave}
              disabled={savingGuildId || !guildIdInput.trim()}
              startIcon={savingGuildId ? <CircularProgress size={16} /> : undefined}
            >
              Save Guild ID
            </Button>
          </Stack>
        </Stack>
      </WidgetShell>
    );
  }

  return (
    <Stack spacing={3}>
      <WidgetShell
        title="Discord Bot Installation"
        subtitle="Install the Draco bot into your Discord server so members can link their accounts."
        accent="success"
      >
        <Stack spacing={2}>
          <Alert severity="success">Bot installed for {guildDisplayName}</Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={handleInstall}
              disabled={installing}
              startIcon={installing ? <CircularProgress size={16} /> : undefined}
            >
              Reinstall Bot
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={openDisconnectDialog}
              startIcon={<LinkOffIcon fontSize="small" />}
            >
              Disconnect Discord
            </Button>
          </Stack>
        </Stack>
      </WidgetShell>

      <WidgetShell
        title="Channel Ingestion"
        subtitle="Select which Discord channels should feed the Social Hub."
        accent="info"
      >
        {channelError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {channelError}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={openChannelDialog}
            disabled={!availableChannels.length}
          >
            Add Channel Mapping
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadChannelMappings}>
            Refresh
          </Button>
        </Stack>
        {!availableChannels.length && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No channels available. Ensure the Draco bot is installed and has access to your guild.
          </Alert>
        )}
        {channelMappings.length === 0 ? (
          <Alert severity="info">No Discord channels are being ingested yet.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Channel</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell>Season</TableCell>
                <TableCell>Team Season</TableCell>
                <TableCell>Label</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {channelMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    {mapping.discordChannelName}
                    {mapping.channelType ? ` (${mapping.channelType})` : ''}
                  </TableCell>
                  <TableCell>{mapping.scope}</TableCell>
                  <TableCell>{mapping.seasonId ?? '—'}</TableCell>
                  <TableCell>{mapping.teamSeasonId ?? '—'}</TableCell>
                  <TableCell>{mapping.label ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete mapping">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteChannelMapping(mapping)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </WidgetShell>

      <WidgetShell
        title="Discord Role Mappings"
        subtitle="Map Discord roles to Draco permissions for automatic access control."
        accent="secondary"
      >
        {roleMappingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {roleMappingError}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={openRoleDialog}>
            Add Role Mapping
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRoleMappingsData}>
            Refresh
          </Button>
        </Stack>
        {roleMappings.length === 0 ? (
          <Alert severity="info">No Discord role mappings have been configured yet.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Discord Role Name</TableCell>
                <TableCell>Discord Role ID</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roleMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>{mapping.discordRoleName}</TableCell>
                  <TableCell>{mapping.discordRoleId}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(mapping.permissions ?? []).map((permission) => (
                        <Chip key={permission} label={permission} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit mapping">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openEditRoleDialog(mapping)}
                            disabled={roleMappingBusyId === mapping.id}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete mapping">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRoleMapping(mapping)}
                            disabled={roleMappingBusyId === mapping.id}
                          >
                            {roleMappingBusyId === mapping.id ? (
                              <CircularProgress size={16} />
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
      </WidgetShell>

      <Dialog open={dialogOpen} onClose={closeRoleDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingMapping ? 'Edit Role Mapping' : 'Add Role Mapping'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Discord Role ID"
              {...register('discordRoleId')}
              error={Boolean(roleFormErrors.discordRoleId)}
              helperText={roleFormErrors.discordRoleId?.message ?? 'Numeric role id from Discord.'}
            />
            <TextField
              label="Discord Role Name"
              {...register('discordRoleName')}
              error={Boolean(roleFormErrors.discordRoleName)}
              helperText={roleFormErrors.discordRoleName?.message ?? 'Friendly label for admins.'}
            />
            <TextField
              label="Permissions"
              {...register('permissionsText')}
              error={Boolean(roleFormErrors.permissionsText)}
              helperText={
                roleFormErrors.permissionsText?.message ??
                'Comma-separated Draco permissions (e.g. account.manage, team.manage).'
              }
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button onClick={handleRoleSubmit} disabled={roleFormSubmitting} variant="contained">
            {roleFormSubmitting ? 'Saving…' : 'Save Mapping'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddDiscordChannelMappingDialog
        open={channelDialogOpen}
        accountId={accountId}
        availableChannels={availableChannels}
        onClose={() => setChannelDialogOpen(false)}
        onSuccess={handleChannelDialogSuccess}
      />
      <ConfirmDiscordDisconnectDialog
        open={disconnectDialogOpen}
        accountId={accountId}
        onClose={closeDisconnectDialog}
        onDisconnected={handleDisconnectSuccess}
      />
    </Stack>
  );
};

export const DiscordIntegrationAdminWidget: React.FC<DiscordIntegrationAdminWidgetProps> = ({
  accountId,
}) => {
  if (!accountId) {
    return null;
  }

  return <DiscordIntegrationAdminWidgetInner accountId={accountId} />;
};

export default DiscordIntegrationAdminWidget;
