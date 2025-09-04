'use client';

import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  Button,
  Alert,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Sports as SportsIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { useRecipientSelection } from './RecipientSelectionProvider';
import { getSelectionSummary } from './recipientUtils';
import UserAvatar from '../../users/UserAvatar';
import { GroupSummaryDisplay } from './GroupSummaryDisplay';
import {
  GroupType,
  getTotalRecipientsFromGroups,
  // TeamGroup, // TODO: Re-enable when needed
  // RoleGroup, // TODO: Re-enable when needed
} from '../../../types/emails/recipients';

interface SelectedRecipientsListProps {
  showDetails?: boolean;
  maxDisplayCount?: number;
  showValidation?: boolean;
  compact?: boolean;
}

/**
 * SelectedRecipientsList - Display and manage selected recipients
 */
export const SelectedRecipientsList: React.FC<SelectedRecipientsListProps> = ({
  showDetails = true,
  maxDisplayCount = 10,
  showValidation = true,
  compact = false,
}) => {
  // Use recipient context - unified groups integration to be added later
  const { state, actions, contacts, validation } = useRecipientSelection();
  const selectedGroups = state?.selectedGroups;

  const [showIndividualContacts, setShowIndividualContacts] = React.useState(false);
  const [showEffectiveRecipients, setShowEffectiveRecipients] = React.useState(false);

  // Create callback for removing groups
  const handleRemoveGroup = useCallback((_groupType: GroupType, _groupIndex: number) => {
    // TODO: Implement group removal when unified groups are integrated with RecipientSelection context
    console.log('Group removal not yet implemented for RecipientSelection context');
  }, []);

  // Calculate selection summary using unified groups if available
  const selectionSummary = useMemo(() => {
    if (selectedGroups && selectedGroups.size > 0) {
      const totalRecipients = getTotalRecipientsFromGroups(selectedGroups);
      return {
        total: totalRecipients,
        description: `${totalRecipients} recipients selected from ${selectedGroups.size} group${selectedGroups.size === 1 ? '' : 's'}`,
      };
    }
    return getSelectionSummary(state, contacts);
  }, [state, contacts, selectedGroups]);

  // Get selected individual contacts
  const selectedContacts = useMemo(() => {
    // TODO: Get individual contacts from selectedGroups when backend integration is ready
    const individualsGroup = state.selectedGroups?.get('individuals');
    if (!individualsGroup || individualsGroup.length === 0) return [];

    const individualContactIds = new Set<string>();
    individualsGroup.forEach((group) => {
      group.contactIds.forEach((id) => individualContactIds.add(id));
    });

    return contacts.filter((contact) => individualContactIds.has(contact.id));
  }, [contacts, state.selectedGroups]);

  // Get effective recipients (deduplicated)
  const effectiveRecipients = useMemo(() => {
    return actions.getEffectiveRecipients();
  }, [actions]);

  // No selections
  if (selectionSummary.total === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          textAlign: 'center',
        }}
      >
        <EmailIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" color="text.secondary">
          No recipients selected
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Select contacts or groups to continue
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Validation Alerts */}
      {showValidation && (
        <>
          {validation.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Stack spacing={1}>
                {validation.errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Stack spacing={1}>
                {validation.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    {warning}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}
        </>
      )}

      {/* Selection Summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" component="h3">
            Selected Recipients
          </Typography>
          <Button size="small" color="error" onClick={actions.clearAll} startIcon={<ClearIcon />}>
            Clear All
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {selectionSummary.description}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Chip
            icon={<EmailIcon />}
            label={`${validation.validEmailCount} recipients`}
            color="primary"
            variant="filled"
            size={compact ? 'small' : 'medium'}
          />

          {validation.invalidEmailCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${validation.invalidEmailCount} invalid emails`}
              color="warning"
              variant="outlined"
              size={compact ? 'small' : 'medium'}
            />
          )}
        </Stack>
      </Paper>

      {/* Unified Group Display */}
      {selectedGroups && selectedGroups.size > 0 && (
        <GroupSummaryDisplay
          selectedGroups={selectedGroups}
          onRemoveGroup={handleRemoveGroup}
          compact={compact}
        />
      )}

      {/* Legacy Group Display (fallback when unified groups not available) */}
      {(!selectedGroups || selectedGroups.size === 0) && (
        <>
          {/* All Contacts Selection */}
          {/* TODO: Replace with selectedGroups logic when backend integration is ready */}
          {false /* TODO: Check if season-wide group is selected */ && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <GroupsIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    All Contacts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {validation.validEmailCount} contacts with valid emails
                  </Typography>
                </Box>
                <IconButton size="small" color="error" onClick={actions.deselectAllContacts}>
                  <ClearIcon />
                </IconButton>
              </Stack>
            </Paper>
          )}

          {/* Team Groups */}
          {/* TODO: Replace with selectedGroups logic when backend integration is ready */}
          {(state.selectedGroups?.get('teams')?.length || 0) > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                <SportsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Team Groups ({state.selectedGroups?.get('teams')?.length || 0})
              </Typography>

              <Stack spacing={1}>
                {(state.selectedGroups?.get('teams') || []).map((group, index) => (
                  <Chip
                    key={`team-${index}`}
                    icon={<SportsIcon />}
                    label={`${group.groupName} (${group.totalCount})`}
                    variant="outlined"
                    color="primary"
                    onDelete={() => {
                      // TODO: Remove specific team group
                    }}
                    size={compact ? 'small' : 'medium'}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Role Groups */}
          {/* TODO: Replace with selectedGroups logic when backend integration is ready */}
          {(state.selectedGroups?.get('managers')?.length || 0) > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                <SecurityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Manager Groups ({state.selectedGroups?.get('managers')?.length || 0})
              </Typography>

              <Stack spacing={1}>
                {(state.selectedGroups?.get('managers') || []).map((group, index) => (
                  <Chip
                    key={`manager-${index}`}
                    icon={<SecurityIcon />}
                    label={`${group.groupName} (${group.totalCount})`}
                    variant="outlined"
                    color="primary"
                    onDelete={() => {
                      // TODO: Remove specific manager group
                    }}
                    size={compact ? 'small' : 'medium'}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* Individual Contacts - only show if not using unified groups or if there are individual selections */}
      {(!selectedGroups ||
        selectedGroups.size === 0 ||
        (state.selectedGroups?.get('individuals')?.length || 0) > 0) &&
        selectedContacts.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: showIndividualContacts ? 2 : 0,
              }}
              onClick={() => setShowIndividualContacts(!showIndividualContacts)}
            >
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium" sx={{ flex: 1 }}>
                Individual Contacts ({selectedContacts.length})
              </Typography>
              <IconButton size="small">
                {showIndividualContacts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={showIndividualContacts}>
              <Stack spacing={1}>
                {selectedContacts.slice(0, maxDisplayCount).map((contact) => (
                  <Box
                    key={contact.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <UserAvatar
                      user={{
                        id: contact.id,
                        firstName: contact.firstname,
                        lastName: contact.lastname,
                        photoUrl: contact.avatar,
                      }}
                      size={32}
                      showHoverEffects={false}
                    />

                    <Box sx={{ flex: 1, ml: 2, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {contact.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {contact.email || 'No email'}
                      </Typography>
                    </Box>

                    {!contact.hasValidEmail && (
                      <WarningIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                    )}

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => actions.deselectContact(contact.id)}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                {selectedContacts.length > maxDisplayCount && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    ... and {selectedContacts.length - maxDisplayCount} more
                  </Typography>
                )}
              </Stack>
            </Collapse>
          </Paper>
        )}

      {/* Effective Recipients Preview */}
      {showDetails &&
        !(
          state.selectedGroups?.get('season')?.length || 0 > 0
        ) /* TODO: Replace allContacts logic */ && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: showEffectiveRecipients ? 2 : 0,
              }}
              onClick={() => setShowEffectiveRecipients(!showEffectiveRecipients)}
            >
              <VisibilityIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                Preview Final Recipients ({effectiveRecipients.length})
              </Typography>
              <IconButton size="small">
                {showEffectiveRecipients ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Shows all unique recipients after removing duplicates
            </Typography>

            <Collapse in={showEffectiveRecipients}>
              <List dense sx={{ mt: 1 }}>
                {effectiveRecipients.slice(0, maxDisplayCount).map((recipient) => (
                  <ListItem key={recipient.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <UserAvatar
                        user={{
                          id: recipient.id,
                          firstName: recipient.firstname,
                          lastName: recipient.lastname,
                          photoUrl: recipient.avatar,
                        }}
                        size={24}
                        showHoverEffects={false}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={recipient.displayName}
                      secondary={recipient.email}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {!recipient.hasValidEmail && (
                      <ListItemSecondaryAction>
                        <WarningIcon color="warning" fontSize="small" />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}

                {effectiveRecipients.length > maxDisplayCount && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`... and ${effectiveRecipients.length - maxDisplayCount} more recipients`}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                        textAlign: 'center',
                        width: '100%',
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Paper>
        )}
    </Box>
  );
};
