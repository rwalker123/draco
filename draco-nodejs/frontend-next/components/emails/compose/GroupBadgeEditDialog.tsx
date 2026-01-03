'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  EmailOutlined as NoEmailIcon,
  Person as PersonIcon,
  SupervisorAccount as ManagerIcon,
} from '@mui/icons-material';

import { RecipientGroupType } from '@draco/shared-schemas';
import { ContactGroup, GroupType } from '../../../types/emails/recipients';
import { createEmailRecipientService, GroupContact } from '../../../services/emailRecipientService';
import { useAuth } from '../../../context/AuthContext';

interface GroupBadgeEditDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (selectedContactIds: Set<string>, allContacts: GroupContact[]) => void;
  accountId: string;
  seasonId: string;
  group: ContactGroup;
}

const MAX_EDITABLE_COUNT = 150;

const GroupBadgeEditDialogComponent: React.FC<GroupBadgeEditDialogProps> = ({
  open,
  onClose,
  onApply,
  accountId,
  seasonId,
  group,
}) => {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<GroupContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const mapGroupTypeToApiGroupType = useCallback((groupType: GroupType): RecipientGroupType => {
    switch (groupType) {
      case 'season':
        return 'season';
      case 'league':
        return 'league';
      case 'division':
        return 'division';
      case 'team':
        return 'team';
      default:
        return 'season';
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchContacts = async () => {
      setLoading(true);
      setError(null);

      const service = createEmailRecipientService();
      const groupId = Array.from(group.ids)[0];

      if (!groupId) {
        if (!cancelled) {
          setError('No group ID found');
          setLoading(false);
        }
        return;
      }

      const result = await service.fetchGroupContacts(
        accountId,
        token,
        seasonId,
        mapGroupTypeToApiGroupType(group.groupType),
        groupId,
        group.managersOnly,
      );

      if (cancelled) return;

      if (!result.success) {
        setError(result.error?.message || 'Failed to load contacts');
        setLoading(false);
        return;
      }

      setContacts(result.data);
      setSelectedIds(new Set(result.data.map((c) => c.id)));
      setLoading(false);
    };

    fetchContacts();

    return () => {
      cancelled = true;
    };
  }, [open, accountId, token, seasonId, group, mapGroupTypeToApiGroupType]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query)),
    );
  }, [contacts, searchQuery]);

  const handleToggleContact = useCallback((contactId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(contacts.map((c) => c.id)));
  }, [contacts]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleApply = useCallback(() => {
    onApply(selectedIds, contacts);
    onClose();
  }, [selectedIds, contacts, onApply, onClose]);

  const handleCancel = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const selectedCount = selectedIds.size;
  const totalCount = contacts.length;
  const hasChanges = selectedCount !== totalCount;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500, maxHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <EditIcon color="primary" />
          <Typography variant="h6">Edit: {group.groupName}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <TextField
                fullWidth
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`${selectedCount} of ${totalCount} selected`}
                    size="small"
                    color={hasChanges ? 'warning' : 'default'}
                    variant="outlined"
                  />
                  {hasChanges && (
                    <Typography variant="caption" color="warning.main">
                      Changes will convert to individual selections
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={handleSelectAll}
                    disabled={selectedCount === totalCount}
                  >
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAll} disabled={selectedCount === 0}>
                    Deselect All
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <List
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  '& .MuiListItem-root': {
                    py: 0.5,
                  },
                }}
              >
                {filteredContacts.map((contact) => {
                  const isSelected = selectedIds.has(contact.id);
                  const displayName = `${contact.firstName} ${contact.lastName}`;

                  return (
                    <ListItem key={contact.id} disablePadding>
                      <ListItemButton onClick={() => handleToggleContact(contact.id)} dense>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox checked={isSelected} tabIndex={-1} disableRipple size="small" />
                        </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {contact.isManager ? (
                            <ManagerIcon fontSize="small" color="primary" />
                          ) : (
                            <PersonIcon fontSize="small" color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2">{displayName}</Typography>
                              {contact.isManager && (
                                <Chip
                                  label="Manager"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            contact.email ? (
                              <Stack
                                component="span"
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                {contact.hasValidEmail ? (
                                  <EmailIcon fontSize="inherit" color="success" />
                                ) : (
                                  <NoEmailIcon fontSize="inherit" color="error" />
                                )}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color={contact.hasValidEmail ? 'text.secondary' : 'error.main'}
                                >
                                  {contact.email}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography component="span" variant="caption" color="text.disabled">
                                No email
                              </Typography>
                            )
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}

                {filteredContacts.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          No contacts found matching &quot;{searchQuery}&quot;
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained" disabled={loading || selectedCount === 0}>
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const GroupBadgeEditDialog = React.memo(GroupBadgeEditDialogComponent);
GroupBadgeEditDialog.displayName = 'GroupBadgeEditDialog';

export const isGroupEditable = (group: ContactGroup): boolean => {
  return group.groupType !== 'individuals' && group.totalCount <= MAX_EDITABLE_COUNT;
};

export const getEditableTooltip = (group: ContactGroup): string | null => {
  if (group.groupType === 'individuals') {
    return null;
  }
  if (group.totalCount > MAX_EDITABLE_COUNT) {
    return `Groups larger than ${MAX_EDITABLE_COUNT} contacts cannot be edited`;
  }
  return null;
};
