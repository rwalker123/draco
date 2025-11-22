'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  DiscordAccountConfigType,
  DiscordRoleMappingType,
  DiscordGuildChannelType,
  DiscordChannelMappingType,
  DiscordTeamForumType,
} from '@draco/shared-schemas';
import { DiscordRoleMappingUpdateSchema } from '@draco/shared-schemas';
import WidgetShell from '../../ui/WidgetShell';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';
import AddDiscordChannelMappingDialog from './AddDiscordChannelMappingDialog';
import ConfirmDiscordDisconnectDialog from './ConfirmDiscordDisconnectDialog';
import { ROLE_DISPLAY_NAMES, ROLE_NAME_TO_ID } from '@/utils/roleUtils';

interface DiscordIntegrationAdminWidgetProps {
  accountId: string | null;
  onConfigUpdated?: (config: DiscordAccountConfigType) => void;
}

type DracoRoleOption = {
  roleName: string;
  roleId: string;
  label: string;
  description: string;
  scope: 'account' | 'season';
};

const ROLE_MAPPING_OPTIONS: DracoRoleOption[] = [
  {
    roleName: 'AccountAdmin',
    roleId: ROLE_NAME_TO_ID.AccountAdmin,
    label: ROLE_DISPLAY_NAMES.AccountAdmin,
    description: 'Full account management access across every season.',
    scope: 'account',
  },
  {
    roleName: 'AccountPhotoAdmin',
    roleId: ROLE_NAME_TO_ID.AccountPhotoAdmin,
    label: ROLE_DISPLAY_NAMES.AccountPhotoAdmin,
    description: 'Account-wide photo library and media permissions.',
    scope: 'account',
  },
  {
    roleName: 'PhotoAdmin',
    roleId: ROLE_NAME_TO_ID.PhotoAdmin,
    label: ROLE_DISPLAY_NAMES.PhotoAdmin,
    description: 'Global photo administrator for the entire account.',
    scope: 'account',
  },
  {
    roleName: 'TeamAdmin',
    roleId: ROLE_NAME_TO_ID.TeamAdmin,
    label: `${ROLE_DISPLAY_NAMES.TeamAdmin} (includes managers)`,
    description: 'Season-scoped team administrators and managers.',
    scope: 'season',
  },
  {
    roleName: 'TeamPhotoAdmin',
    roleId: ROLE_NAME_TO_ID.TeamPhotoAdmin,
    label: ROLE_DISPLAY_NAMES.TeamPhotoAdmin,
    description: 'Season-scoped team and manager photo permissions.',
    scope: 'season',
  },
  {
    roleName: 'LeagueAdmin',
    roleId: ROLE_NAME_TO_ID.LeagueAdmin,
    label: ROLE_DISPLAY_NAMES.LeagueAdmin,
    description: 'Season-scoped league administrators.',
    scope: 'season',
  },
];

const ROLE_OPTIONS_BY_ID = ROLE_MAPPING_OPTIONS.reduce<Record<string, DracoRoleOption>>(
  (acc, option) => {
    acc[option.roleId] = option;
    return acc;
  },
  {},
);

const ROLE_OPTIONS_BY_NAME = ROLE_MAPPING_OPTIONS.reduce<Record<string, DracoRoleOption>>(
  (acc, option) => {
    acc[option.roleName] = option;
    return acc;
  },
  {},
);

const ROLE_OPTIONS_BY_LABEL = ROLE_MAPPING_OPTIONS.reduce<Record<string, DracoRoleOption>>(
  (acc, option) => {
    acc[option.label] = option;
    return acc;
  },
  {},
);

const resolveRoleOptionFromToken = (token: string): DracoRoleOption | null => {
  const value = token?.trim();
  if (!value) {
    return null;
  }
  if (ROLE_OPTIONS_BY_ID[value]) {
    return ROLE_OPTIONS_BY_ID[value];
  }
  if (ROLE_OPTIONS_BY_NAME[value]) {
    return ROLE_OPTIONS_BY_NAME[value];
  }
  if (ROLE_OPTIONS_BY_LABEL[value]) {
    return ROLE_OPTIONS_BY_LABEL[value];
  }
  const normalizedId = ROLE_NAME_TO_ID[value];
  if (normalizedId && ROLE_OPTIONS_BY_ID[normalizedId]) {
    return ROLE_OPTIONS_BY_ID[normalizedId];
  }
  return null;
};

const resolveRoleIdFromToken = (token: string): string | null => {
  const option = resolveRoleOptionFromToken(token);
  return option ? option.roleId : null;
};

const convertPermissionsToRoleIds = (permissions?: string[]): string[] => {
  if (!permissions?.length) {
    return [];
  }
  const seen = new Set<string>();
  permissions.forEach((permission) => {
    const roleId = resolveRoleIdFromToken(permission);
    if (roleId) {
      seen.add(roleId);
    }
  });
  return Array.from(seen);
};

const formatMappingRoleEntries = (
  permissions?: string[],
): { key: string; label: string; isLegacy: boolean }[] => {
  if (!permissions?.length) {
    return [];
  }
  return permissions.map((permission, index) => {
    const option = resolveRoleOptionFromToken(permission);
    if (option) {
      return {
        key: `${option.roleId}-${index}`,
        label: option.label,
        isLegacy: false,
      };
    }
    return {
      key: `${permission}-${index}`,
      label: `Legacy: ${permission}`,
      isLegacy: true,
    };
  });
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const getTeamForumStatusColor = (status: string): 'success' | 'warning' | 'default' => {
  if (status === 'provisioned') {
    return 'success';
  }
  if (status === 'needsRepair') {
    return 'warning';
  }
  return 'default';
};

const getTeamForumStatusLabel = (status: string): string => {
  switch (status) {
    case 'provisioned':
      return 'Provisioned';
    case 'needsRepair':
      return 'Needs repair';
    case 'disabled':
      return 'Disabled';
    default:
      return status;
  }
};

const RoleMappingFormSchema = DiscordRoleMappingUpdateSchema.extend({
  dracoRoleIds: z.array(z.string().trim()).min(1, 'Select at least one Draco role'),
}).omit({ permissions: true });

type RoleMappingFormValues = z.infer<typeof RoleMappingFormSchema>;

const DiscordIntegrationAdminWidgetInner: React.FC<{
  accountId: string;
  onConfigUpdated?: (config: DiscordAccountConfigType) => void;
}> = ({ accountId, onConfigUpdated }) => {
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
    fetchTeamForums,
    repairTeamForums,
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
  const [teamForums, setTeamForums] = useState<DiscordTeamForumType[]>([]);
  const [teamForumsLoading, setTeamForumsLoading] = useState(false);
  const [teamForumsError, setTeamForumsError] = useState<string | null>(null);
  const [teamForumActionBusy, setTeamForumActionBusy] = useState(false);
  const [teamForumDialogOpen, setTeamForumDialogOpen] = useState(false);
  const [teamForumCleanupMode, setTeamForumCleanupMode] = useState<'retain' | 'remove'>('retain');
  const [teamForumSuccess, setTeamForumSuccess] = useState<string | null>(null);
  const [teamForumOperation, setTeamForumOperation] = useState<
    'enable' | 'disable' | 'repair' | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors: roleFormErrors, isSubmitting: roleFormSubmitting },
  } = useForm<RoleMappingFormValues>({
    resolver: zodResolver(RoleMappingFormSchema),
    defaultValues: {
      discordRoleId: '',
      discordRoleName: '',
      dracoRoleIds: [],
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

  const loadTeamForums = useCallback(async () => {
    if (!accountId) {
      setTeamForums([]);
      return;
    }
    setTeamForumsLoading(true);
    setTeamForumsError(null);
    try {
      const payload = await fetchTeamForums(accountId);
      setTeamForums(payload.forums);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load Discord team forums.';
      setTeamForumsError(message);
      setTeamForums([]);
    } finally {
      setTeamForumsLoading(false);
    }
  }, [accountId, fetchTeamForums]);

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
      await Promise.all([loadAvailableChannelsData(), loadTeamForums()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Discord settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    accountId,
    loadChannelMappings,
    loadConfig,
    loadRoleMappingsData,
    loadAvailableChannelsData,
    loadTeamForums,
  ]);

  useEffect(() => {
    if (accountId) {
      void loadAll();
    }
  }, [accountId, loadAll]);

  const updateTeamForumSetting = useCallback(
    async (enabled: boolean, cleanupMode?: 'retain' | 'remove') => {
      if (!accountId) {
        return;
      }
      setTeamForumActionBusy(true);
      setTeamForumsError(null);
      setTeamForumSuccess(null);
      setTeamForumOperation(enabled ? 'enable' : 'disable');
      try {
        await updateConfig(accountId, {
          teamForumEnabled: enabled,
          teamForumCleanupMode: enabled ? undefined : cleanupMode,
        });
        await Promise.all([loadConfig(), loadTeamForums()]);
        setTeamForumSuccess(
          enabled
            ? 'Team forums enabled. Provisioning will continue shortly.'
            : cleanupMode === 'remove'
              ? 'Team forums disabled and Discord channels removed.'
              : 'Team forums disabled. Existing channels were left untouched.',
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to update team forum settings.';
        setTeamForumsError(message);
      } finally {
        setTeamForumActionBusy(false);
        setTeamForumOperation(null);
      }
    },
    [accountId, loadConfig, loadTeamForums, updateConfig],
  );

  const handleTeamForumToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        void updateTeamForumSetting(true);
      } else {
        setTeamForumCleanupMode('retain');
        setTeamForumDialogOpen(true);
      }
    },
    [updateTeamForumSetting],
  );

  const handleRepairTeamForums = useCallback(async () => {
    if (!accountId) {
      return;
    }
    setTeamForumActionBusy(true);
    setTeamForumsError(null);
    setTeamForumSuccess(null);
    setTeamForumOperation('repair');
    try {
      const result = await repairTeamForums(accountId);
      if (result?.message) {
        setTeamForumSuccess(result.message);
      }
      await loadTeamForums();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to repair Discord team forums.';
      setTeamForumsError(message);
    } finally {
      setTeamForumActionBusy(false);
      setTeamForumOperation(null);
    }
  }, [accountId, loadTeamForums, repairTeamForums]);

  const confirmDisableTeamForums = useCallback(async () => {
    setTeamForumDialogOpen(false);
    await updateTeamForumSetting(false, teamForumCleanupMode);
  }, [teamForumCleanupMode, updateTeamForumSetting]);

  const handleCloseTeamForumDialog = useCallback(() => {
    setTeamForumDialogOpen(false);
  }, []);

  const handleTeamForumCleanupChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTeamForumCleanupMode(event.target.value as 'retain' | 'remove');
  }, []);

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

  const handleDisconnectSuccess = useCallback(
    async (configAfterDisconnect: DiscordAccountConfigType) => {
      setConfig(configAfterDisconnect);
      setGuildIdInput(configAfterDisconnect.guildId ?? '');
      onConfigUpdated?.(configAfterDisconnect);
      await Promise.all([
        loadRoleMappingsData(),
        loadChannelMappings(),
        loadAvailableChannelsData(),
        loadTeamForums(),
      ]);
    },
    [
      loadAvailableChannelsData,
      loadChannelMappings,
      loadRoleMappingsData,
      loadTeamForums,
      onConfigUpdated,
    ],
  );

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
      const updated = await updateConfig(accountId, { guildId: trimmed });
      setConfig(updated);
      setGuildIdInput(updated.guildId ?? '');
      onConfigUpdated?.(updated);
      await Promise.all([
        loadRoleMappingsData(),
        loadChannelMappings(),
        loadAvailableChannelsData(),
        loadTeamForums(),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save the Discord guild id.';
      setGuildIdError(message);
    } finally {
      setSavingGuildId(false);
    }
  }, [
    accountId,
    guildIdInput,
    loadAvailableChannelsData,
    loadChannelMappings,
    loadRoleMappingsData,
    loadTeamForums,
    onConfigUpdated,
    updateConfig,
  ]);

  const openRoleDialog = useCallback(() => {
    setRoleMappingError(null);
    reset({ discordRoleId: '', discordRoleName: '', dracoRoleIds: [] });
    setDialogOpen(true);
  }, [reset]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const openEditRoleDialog = useCallback(
    (mapping: DiscordRoleMappingType) => {
      setRoleMappingError(null);
      reset({
        discordRoleId: mapping.discordRoleId,
        discordRoleName: mapping.discordRoleName,
        dracoRoleIds: convertPermissionsToRoleIds(mapping.permissions),
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

    const payload = DiscordRoleMappingUpdateSchema.parse({
      discordRoleId: values.discordRoleId.trim(),
      discordRoleName: values.discordRoleName.trim(),
      permissions: values.dracoRoleIds,
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
        `Remove Discord role mapping "${mapping.discordRoleName}"? This will revoke the associated Draco roles.`,
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

      {config?.guildId ? (
        <WidgetShell
          title="Discord Team Forums"
          subtitle="Automatically provision a Discord forum for every team in the current season."
          accent="info"
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(config?.teamForumEnabled)}
                  onChange={handleTeamForumToggle}
                  disabled={teamForumActionBusy}
                />
              }
              label="Enable Discord team forums"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRepairTeamForums}
              disabled={!config?.teamForumEnabled || teamForumActionBusy || teamForumsLoading}
            >
              Repair Forums
            </Button>
          </Stack>
          {teamForumSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {teamForumSuccess}
            </Alert>
          ) : null}
          {teamForumsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {teamForumsError}
            </Alert>
          ) : null}
          {teamForumActionBusy && teamForumOperation ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {teamForumOperation === 'enable'
                  ? 'Provisioning Discord forums for each team. This can take several seconds for large accounts.'
                  : teamForumOperation === 'disable'
                    ? 'Removing Discord team forums. This may take a few seconds for large accounts.'
                    : 'Repairing Discord team forums. This may take a few seconds for large accounts.'}
              </Typography>
              <LinearProgress />
            </Box>
          ) : null}
          {teamForumsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : config?.teamForumEnabled ? (
            teamForums.length === 0 ? (
              <Alert severity="info">No team forums have been created yet.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Discord Channel</TableCell>
                    <TableCell>Team Season ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Synced</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamForums.map((forum) => (
                    <TableRow key={forum.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{forum.discordChannelName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Channel ID: {forum.discordChannelId}
                        </Typography>
                      </TableCell>
                      <TableCell>{forum.teamSeasonId}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getTeamForumStatusColor(forum.status)}
                          label={getTeamForumStatusLabel(forum.status)}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(forum.lastSyncedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <Alert severity="info">
              Enable Discord team forums to automatically create and sync team-specific discussion
              spaces in Discord.
            </Alert>
          )}
        </WidgetShell>
      ) : null}

      <WidgetShell
        title="Discord Role Mappings"
        subtitle="Map Discord roles to Draco account and team roles for automatic access control."
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Account roles stay active across every season. Team and league roles follow the
          member&apos;s season assignments when syncing to Discord.
        </Typography>
        {roleMappings.length === 0 ? (
          <Alert severity="info">No Discord role mappings have been configured yet.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Discord Role Name</TableCell>
                <TableCell>Discord Role ID</TableCell>
                <TableCell>Draco Roles</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roleMappings.map((mapping) => {
                const roleEntries = formatMappingRoleEntries(mapping.permissions);
                return (
                  <TableRow key={mapping.id}>
                    <TableCell>{mapping.discordRoleName}</TableCell>
                    <TableCell>{mapping.discordRoleId}</TableCell>
                    <TableCell>
                      {roleEntries.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      ) : (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {roleEntries.map((entry) => (
                            <Chip
                              key={entry.key}
                              label={entry.label}
                              size="small"
                              color={entry.isLegacy ? 'warning' : 'default'}
                              variant={entry.isLegacy ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Stack>
                      )}
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
                );
              })}
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
            <Controller
              name="dracoRoleIds"
              control={control}
              render={({ field }) => {
                const selectedOptions = ROLE_MAPPING_OPTIONS.filter((option) =>
                  (field.value ?? []).includes(option.roleId),
                );
                return (
                  <Autocomplete
                    multiple
                    options={ROLE_MAPPING_OPTIONS}
                    disableCloseOnSelect
                    value={selectedOptions}
                    onChange={(_, newValue) =>
                      field.onChange(newValue.map((option) => option.roleId))
                    }
                    isOptionEqualToValue={(option, value) => option.roleId === value.roleId}
                    getOptionLabel={(option) => option.label}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          <Box>
                            <Typography variant="body2">{option.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    onBlur={field.onBlur}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Draco Roles"
                        placeholder="Select Draco roles"
                        error={Boolean(roleFormErrors.dracoRoleIds)}
                        helperText={
                          roleFormErrors.dracoRoleIds?.message ??
                          'Account roles apply globally; team/league roles sync per season.'
                        }
                      />
                    )}
                  />
                );
              }}
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

      <Dialog open={teamForumDialogOpen} onClose={handleCloseTeamForumDialog}>
        <DialogTitle>Disable Discord Team Forums?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose what to do with the existing Discord forums for this account.
          </Typography>
          <RadioGroup value={teamForumCleanupMode} onChange={handleTeamForumCleanupChange}>
            <FormControlLabel
              value="retain"
              control={<Radio />}
              label="Leave the Discord forums in place for now"
            />
            <FormControlLabel
              value="remove"
              control={<Radio />}
              label="Remove the Discord forums and their access roles"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeamForumDialog}>Cancel</Button>
          <Button
            onClick={confirmDisableTeamForums}
            color="error"
            variant="contained"
            disabled={teamForumActionBusy}
          >
            Disable Forums
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
      <Backdrop
        open={teamForumActionBusy}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography variant="body2">
            {teamForumOperation === 'enable'
              ? 'Provisioning Discord forums for each team...'
              : teamForumOperation === 'disable'
                ? 'Removing Discord team forums...'
                : 'Repairing Discord team forums...'}
          </Typography>
        </Stack>
      </Backdrop>
    </Stack>
  );
};

export const DiscordIntegrationAdminWidget: React.FC<DiscordIntegrationAdminWidgetProps> = ({
  accountId,
  onConfigUpdated,
}) => {
  if (!accountId) {
    return null;
  }

  return (
    <DiscordIntegrationAdminWidgetInner accountId={accountId} onConfigUpdated={onConfigUpdated} />
  );
};

export default DiscordIntegrationAdminWidget;
