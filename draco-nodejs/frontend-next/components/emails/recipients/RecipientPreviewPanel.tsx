'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Divider,
  Alert,
  Collapse,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Clear as ClearAllIcon,
} from '@mui/icons-material';

import { ExtendedRecipientSelectionState } from './hooks/useRecipientSelection';
import { RecipientContact, TeamGroup, RoleGroup } from '../../../types/emails/recipients';
import { sanitizeDisplayText } from '../../../utils/emailValidation';

export interface RecipientPreviewPanelProps {
  selectionState: ExtendedRecipientSelectionState;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  onRemoveContact: (contactId: string) => void;
  onRemoveTeamGroup: (group: TeamGroup) => void;
  onRemoveRoleGroup: (group: RoleGroup) => void;
  onClearAll: () => void;
  compact?: boolean;
}

/**
 * RecipientPreviewPanel - Shows selected recipients with validation and management
 * Displays summary, validation messages, and allows removal of selections
 */
const RecipientPreviewPanel: React.FC<RecipientPreviewPanelProps> = ({
  selectionState,
  validation,
  onRemoveContact,
  onRemoveTeamGroup,
  onRemoveRoleGroup,
  onClearAll,
  compact = false,
}) => {
  // const theme = useTheme(); // Available for future styling needs
  const [showDetails, setShowDetails] = useState(!compact);
  const [expandedSection, setExpandedSection] = useState<string | null>('contacts');

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get contact initials for avatar
  const getContactInitials = (contact: RecipientContact) => {
    const names = contact.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return contact.displayName.substring(0, 2).toUpperCase();
  };

  // Get effective recipients that will actually receive emails
  const effectiveRecipientsWithEmail = selectionState.effectiveRecipients.filter(
    (recipient) => recipient.email && recipient.email.trim(),
  );

  const recipientsWithoutEmail = selectionState.effectiveRecipients.filter(
    (recipient) => !recipient.email || !recipient.email.trim(),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, flexShrink: 0, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="medium">
            Recipients
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            sx={{ display: compact ? 'flex' : 'none' }}
          >
            {showDetails ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Stack>

        {/* Summary */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
          <Chip
            label={`${selectionState.totalRecipients} total`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {effectiveRecipientsWithEmail.length !== selectionState.totalRecipients && (
            <Chip
              label={`${effectiveRecipientsWithEmail.length} with email`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {selectionState.totalRecipients > 0 && (
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={onClearAll}
              color="error"
              variant="text"
            >
              Clear
            </Button>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Validation Messages */}
      <Collapse
        in={showDetails && (validation.errors.length > 0 || validation.warnings.length > 0)}
      >
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Stack spacing={1}>
            {validation.errors.map((error, index) => (
              <Alert key={index} severity="error" variant="outlined">
                {error}
              </Alert>
            ))}
            {validation.warnings.map((warning, index) => (
              <Alert key={index} severity="warning" variant="outlined">
                {warning}
              </Alert>
            ))}
          </Stack>
        </Box>
      </Collapse>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Collapse in={showDetails}>
          {selectionState.totalRecipients === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No recipients selected
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Use the tabs above to select contacts or groups
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {/* All Contacts Mode */}
              {selectionState.allContacts && (
                <Paper variant="outlined" sx={{ m: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        All Contacts
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All available contacts in the account
                      </Typography>
                    </Box>
                    <Chip
                      label={`${selectionState.totalRecipients} contacts`}
                      size="small"
                      color="primary"
                    />
                  </Stack>
                </Paper>
              )}

              {/* Individual Contacts */}
              {!selectionState.allContacts && selectionState.selectedContactIds.size > 0 && (
                <Box>
                  <ListItem>
                    <ListItemButton onClick={() => toggleSection('contacts')}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Individual Contacts"
                        secondary={`${selectionState.selectedContactIds.size} selected`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          {expandedSection === 'contacts' ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={expandedSection === 'contacts'}>
                    <List dense sx={{ pl: 2 }}>
                      {Array.from(selectionState.selectedContactIds)
                        .map((contactId) =>
                          selectionState.effectiveRecipients.find((r) => r.id === contactId),
                        )
                        .filter((contact): contact is RecipientContact => contact !== undefined)
                        .slice(0, compact ? 5 : 20)
                        .map((contact) => (
                          <ListItem key={contact.id}>
                            <ListItemIcon>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {getContactInitials(contact)}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={sanitizeDisplayText(contact.displayName)}
                              secondary={sanitizeDisplayText(contact.email || '')}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton size="small" onClick={() => onRemoveContact(contact.id)}>
                                <CloseIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      {selectionState.selectedContactIds.size > (compact ? 5 : 20) && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${selectionState.selectedContactIds.size - (compact ? 5 : 20)} more`}
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Collapse>
                </Box>
              )}

              {/* Team Groups */}
              {selectionState.selectedTeamGroups.length > 0 && (
                <Box>
                  <ListItem>
                    <ListItemButton onClick={() => toggleSection('teams')}>
                      <ListItemIcon>
                        <GroupIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Team Groups"
                        secondary={`${selectionState.selectedTeamGroups.length} groups selected`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          {expandedSection === 'teams' ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={expandedSection === 'teams'}>
                    <List dense sx={{ pl: 2 }}>
                      {selectionState.selectedTeamGroups.map((group) => (
                        <ListItem key={group.id}>
                          <ListItemIcon>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                              <GroupIcon sx={{ fontSize: '1rem' }} />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={group.name}
                            secondary={`${group.members.length} members`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton size="small" onClick={() => onRemoveTeamGroup(group)}>
                              <CloseIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}

              {/* Role Groups */}
              {selectionState.selectedRoleGroups.length > 0 && (
                <Box>
                  <ListItem>
                    <ListItemButton onClick={() => toggleSection('roles')}>
                      <ListItemIcon>
                        <AdminIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Role Groups"
                        secondary={`${selectionState.selectedRoleGroups.length} roles selected`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          {expandedSection === 'roles' ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={expandedSection === 'roles'}>
                    <List dense sx={{ pl: 2 }}>
                      {selectionState.selectedRoleGroups.map((group) => (
                        <ListItem key={group.id}>
                          <ListItemIcon>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'warning.main' }}>
                              <AdminIcon sx={{ fontSize: '1rem' }} />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={group.name}
                            secondary={`${group.members.length} members • ${group.roleType}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton size="small" onClick={() => onRemoveRoleGroup(group)}>
                              <CloseIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}

              {/* Recipients without email warning */}
              {recipientsWithoutEmail.length > 0 && (
                <Alert severity="warning" variant="outlined" sx={{ m: 2 }} icon={<WarningIcon />}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {recipientsWithoutEmail.length} recipient
                    {recipientsWithoutEmail.length !== 1 ? 's' : ''} without email
                  </Typography>
                  <Typography variant="caption">
                    These contacts will be excluded from email delivery
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </Collapse>
      </Box>
    </Box>
  );
};

export default RecipientPreviewPanel;
