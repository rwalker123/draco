'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as RoleIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  Groups as AllContactsIcon,
} from '@mui/icons-material';

import { useRecipientSelection } from './RecipientSelectionProvider';

interface SelectedRecipientsPreviewProps {
  maxVisibleChips?: number;
  showCounts?: boolean;
  showValidationWarnings?: boolean;
  compact?: boolean;
}

/**
 * SelectedRecipientsPreview - Clean preview component showing selected recipients
 * Replaces the duplicate inline RecipientSelector for better UX
 */
export const SelectedRecipientsPreview: React.FC<SelectedRecipientsPreviewProps> = ({
  maxVisibleChips = 8,
  showCounts = true,
  showValidationWarnings = true,
  compact = false,
}) => {
  const theme = useTheme();
  const { state, actions, validation, contacts } = useRecipientSelection();

  // Get selected individual contacts
  const selectedContacts = useMemo(() => {
    return contacts.filter((contact) => state.selectedContactIds.has(contact.id));
  }, [contacts, state.selectedContactIds]);

  // Calculate summary counts
  const summaryData = useMemo(() => {
    const individualCount = selectedContacts.length;
    const teamGroupCount = state.selectedTeamGroups.length;
    const roleGroupCount = state.selectedRoleGroups.length;
    const allContactsSelected = state.allContacts;

    return {
      individualCount,
      teamGroupCount,
      roleGroupCount,
      allContactsSelected,
      totalSelections:
        individualCount + teamGroupCount + roleGroupCount + (allContactsSelected ? 1 : 0),
      totalRecipients: state.totalRecipients,
      validEmails: state.validEmailCount,
      invalidEmails: state.invalidEmailCount,
    };
  }, [selectedContacts.length, state]);

  // Combine all chips - moved chip creation inline to avoid dependency issues
  const allChips = useMemo(() => {
    const chips = [];

    // Add "All Contacts" chip if selected
    if (state.allContacts) {
      chips.push(
        <Chip
          key="all-contacts"
          icon={<AllContactsIcon />}
          label={`All Contacts (${contacts.length})`}
          size={compact ? 'small' : 'medium'}
          variant="filled"
          color="primary"
          onDelete={() => actions.deselectAllContacts()}
          deleteIcon={
            <Tooltip title="Deselect all contacts">
              <CloseIcon />
            </Tooltip>
          }
        />,
      );
    }

    // Add individual contact chips
    selectedContacts.forEach((contact) => {
      chips.push(
        <Chip
          key={`contact-${contact.id}`}
          icon={<PersonIcon />}
          label={contact.displayName}
          size={compact ? 'small' : 'medium'}
          variant="outlined"
          color={contact.hasValidEmail ? 'primary' : 'warning'}
          onDelete={() => actions.deselectContact(contact.id)}
          deleteIcon={
            <Tooltip title="Remove contact">
              <CloseIcon />
            </Tooltip>
          }
          sx={{
            '& .MuiChip-icon': {
              color: contact.hasValidEmail ? 'primary.main' : 'warning.main',
            },
          }}
        />,
      );
    });

    // Add team group chips
    state.selectedTeamGroups.forEach((team) => {
      chips.push(
        <Chip
          key={`team-${team.id}`}
          icon={<GroupIcon />}
          label={`${team.name} (${team.members.length})`}
          size={compact ? 'small' : 'medium'}
          variant="outlined"
          color="secondary"
          onDelete={() => actions.deselectTeamGroup(team.id)}
          deleteIcon={
            <Tooltip title="Remove team">
              <CloseIcon />
            </Tooltip>
          }
        />,
      );
    });

    // Add role group chips
    state.selectedRoleGroups.forEach((role) => {
      chips.push(
        <Chip
          key={`role-${role.roleId}`}
          icon={<RoleIcon />}
          label={`${role.name} (${role.members.length})`}
          size={compact ? 'small' : 'medium'}
          variant="outlined"
          color="info"
          onDelete={() => actions.deselectRoleGroup(role.roleId)}
          deleteIcon={
            <Tooltip title="Remove role group">
              <CloseIcon />
            </Tooltip>
          }
        />,
      );
    });

    return chips;
  }, [state, selectedContacts, contacts.length, compact, actions]);

  // Determine visible and hidden chips
  const visibleChips = allChips.slice(0, maxVisibleChips);
  const hiddenChipsCount = Math.max(0, allChips.length - maxVisibleChips);

  // If no selections, show empty state
  if (summaryData.totalSelections === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : 2,
          backgroundColor: alpha(theme.palette.grey[50], 0.5),
          border: `1px dashed ${theme.palette.grey[300]}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <EmailIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">
            No recipients selected
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
        borderColor: alpha(theme.palette.primary.main, 0.3),
      }}
    >
      <Stack spacing={compact ? 1 : 1.5}>
        {/* Summary Header */}
        {showCounts && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <EmailIcon color="primary" fontSize="small" />
                <Typography variant="body2" fontWeight="medium" color="primary">
                  {summaryData.totalRecipients} recipient
                  {summaryData.totalRecipients !== 1 ? 's' : ''}
                </Typography>
              </Stack>

              {summaryData.validEmails > 0 && (
                <Typography variant="caption" color="success.main">
                  {summaryData.validEmails} valid email{summaryData.validEmails !== 1 ? 's' : ''}
                </Typography>
              )}

              {summaryData.invalidEmails > 0 && (
                <Typography variant="caption" color="warning.main">
                  {summaryData.invalidEmails} invalid email
                  {summaryData.invalidEmails !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Selection Breakdown */}
        {!compact && summaryData.totalSelections > 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Selection breakdown:
            </Typography>
            <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
              {summaryData.allContactsSelected && (
                <Typography variant="caption" color="primary">
                  All contacts
                </Typography>
              )}
              {summaryData.individualCount > 0 && (
                <Typography variant="caption">
                  {summaryData.individualCount} individual
                  {summaryData.individualCount !== 1 ? 's' : ''}
                </Typography>
              )}
              {summaryData.teamGroupCount > 0 && (
                <Typography variant="caption">
                  {summaryData.teamGroupCount} team{summaryData.teamGroupCount !== 1 ? 's' : ''}
                </Typography>
              )}
              {summaryData.roleGroupCount > 0 && (
                <Typography variant="caption">
                  {summaryData.roleGroupCount} role{summaryData.roleGroupCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Divider */}
        {showCounts && !compact && <Divider />}

        {/* Selected Items as Chips */}
        <Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {visibleChips}

            {hiddenChipsCount > 0 && (
              <Chip
                label={`+${hiddenChipsCount} more`}
                size={compact ? 'small' : 'medium'}
                variant="outlined"
                color="default"
                sx={{
                  backgroundColor: alpha(theme.palette.grey[500], 0.1),
                  '& .MuiChip-label': {
                    fontSize: compact ? '0.7rem' : '0.8rem',
                    fontWeight: 500,
                  },
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Validation Warnings */}
        {showValidationWarnings && !validation.isValid && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              py: 0.5,
              '& .MuiAlert-message': {
                fontSize: '0.75rem',
              },
            }}
          >
            {validation.errors.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight="medium">
                  Issues:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {validation.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="caption">{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Alert>
        )}

        {/* Clear All Action */}
        {summaryData.totalSelections > 0 && !compact && (
          <Box>
            <Divider sx={{ mb: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Click × on any item to remove it
              </Typography>
              <Tooltip title="Clear all selections">
                <IconButton
                  size="small"
                  onClick={actions.clearAll}
                  color="error"
                  sx={{ fontSize: '0.75rem' }}
                >
                  Clear All
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
