'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { fetchTeamRosterContacts, GroupContact } from '../../../services/emailRecipientService';
import { ContactGroup, GroupType } from '../../../types/emails/recipients';

export interface TeamRosterRecipientPanelProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  onRecipientsChange: (groups: Map<GroupType, ContactGroup[]>) => void;
}

const buildRecipientGroups = (
  contacts: GroupContact[],
  selectedIds: Set<string>,
  teamSeasonId: string,
): Map<GroupType, ContactGroup[]> => {
  const groups = new Map<GroupType, ContactGroup[]>();
  if (contacts.length === 0) return groups;

  const validContacts = contacts.filter((c) => c.hasValidEmail);
  const allValidSelected =
    validContacts.length > 0 && validContacts.every((c) => selectedIds.has(c.id));

  if (allValidSelected) {
    groups.set('team', [
      {
        groupType: 'team',
        groupName: 'Team Roster',
        ids: new Set([teamSeasonId]),
        totalCount: validContacts.length,
        managersOnly: false,
      },
    ]);
  } else if (selectedIds.size > 0) {
    groups.set('individuals', [
      {
        groupType: 'individuals',
        groupName: 'Team Roster (partial)',
        ids: new Set(selectedIds),
        totalCount: selectedIds.size,
        managersOnly: false,
      },
    ]);
  }

  return groups;
};

const TeamRosterRecipientPanel = ({
  accountId,
  seasonId,
  teamSeasonId,
  onRecipientsChange,
}: TeamRosterRecipientPanelProps) => {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<GroupContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const onRecipientsChangeRef = useRef(onRecipientsChange);
  onRecipientsChangeRef.current = onRecipientsChange;

  useEffect(() => {
    const controller = new AbortController();

    const loadContacts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTeamRosterContacts(accountId, token, seasonId, teamSeasonId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (result.success) {
          const loaded = result.data;
          setContacts(loaded);
          const defaultSelected = new Set(loaded.filter((c) => c.hasValidEmail).map((c) => c.id));
          setSelectedIds(defaultSelected);
          onRecipientsChangeRef.current(
            buildRecipientGroups(loaded, defaultSelected, teamSeasonId),
          );
        } else {
          setError(result.error.message || 'Failed to load roster contacts');
        }
      } catch {
        if (controller.signal.aborted) return;
        setError('Failed to load roster contacts');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadContacts();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, token]);

  const validContacts = contacts.filter((c) => c.hasValidEmail);
  const allSelected = validContacts.length > 0 && validContacts.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;
  const popoverOpen = Boolean(anchorEl);

  const applySelection = (nextSelected: Set<string>) => {
    setSelectedIds(nextSelected);
    onRecipientsChangeRef.current(buildRecipientGroups(contacts, nextSelected, teamSeasonId));
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      applySelection(new Set());
    } else {
      applySelection(new Set(validContacts.map((c) => c.id)));
    }
  };

  const handleContactToggle = (contact: GroupContact) => {
    if (!contact.hasValidEmail) return;
    const next = new Set(selectedIds);
    if (next.has(contact.id)) {
      next.delete(contact.id);
    } else {
      next.add(contact.id);
    }
    applySelection(next);
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const summaryLabel = loading
    ? 'Loading roster…'
    : validContacts.length === 0
      ? 'No recipients available'
      : allSelected
        ? `Team Roster (${validContacts.length} members)`
        : selectedCount > 0
          ? `${selectedCount} of ${validContacts.length} selected`
          : 'No recipients selected';

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight="medium"
          sx={{ minWidth: 32 }}
        >
          To
        </Typography>
        <Chip
          icon={loading ? <CircularProgress size={14} /> : <GroupIcon fontSize="small" />}
          label={summaryLabel}
          color={selectedCount > 0 ? 'primary' : 'default'}
          variant={selectedCount > 0 ? 'filled' : 'outlined'}
          size="small"
        />
        <Button
          size="small"
          endIcon={<ExpandIcon />}
          onClick={handleOpenPopover}
          disabled={loading || validContacts.length === 0}
        >
          Customize
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAllToggle}
              size="small"
              disabled={validContacts.length === 0}
            />
            <Typography variant="subtitle2">Team Roster</Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {selectedCount} of {contacts.length}
            </Typography>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {contacts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No contacts available
              </Typography>
            </Box>
          ) : (
            <List dense>
              {contacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                const disabled = !contact.hasValidEmail;

                return (
                  <ListItem
                    key={contact.id}
                    disablePadding
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleContactToggle(contact)}
                      disabled={disabled}
                      dense
                      sx={{ pl: 1, pr: 2, py: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox checked={isSelected} disabled={disabled} size="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                              variant="body2"
                              fontWeight={isSelected ? 'medium' : 'normal'}
                              noWrap
                            >
                              {contact.firstName} {contact.lastName}
                            </Typography>
                            {disabled && (
                              <Chip
                                label="no email"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          contact.email ? (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {contact.email}
                            </Typography>
                          ) : undefined
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default TeamRosterRecipientPanel;
