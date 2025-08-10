'use client';

import React, { useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Sports as SportsIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

import { useRecipientSelection } from './RecipientSelectionProvider';
import { TeamGroup, RoleGroup } from '../../../types/emails/recipients';

interface GroupSelectorProps {
  showAllContacts?: boolean;
  showTeamGroups?: boolean;
  showRoleGroups?: boolean;
}

/**
 * GroupSelector - Team and role-based recipient selection
 */
export const GroupSelector: React.FC<GroupSelectorProps> = ({
  showAllContacts = true,
  showTeamGroups = true,
  showRoleGroups = true,
}) => {
  const { state, actions, config, teamGroups, roleGroups, validation, contacts } =
    useRecipientSelection();

  // Calculate total contacts with valid emails for "All Contacts"
  const totalValidContacts = contacts.filter((c) => c.hasValidEmail).length;

  // Handle All Contacts toggle
  const handleAllContactsToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        actions.selectAllContacts();
      } else {
        actions.deselectAllContacts();
      }
    },
    [actions],
  );

  // Handle team group selection
  const handleTeamGroupToggle = useCallback(
    (team: TeamGroup) => {
      const isSelected = state.selectedTeamGroups.some((t) => t.id === team.id);
      if (isSelected) {
        actions.deselectTeamGroup(team.id);
      } else {
        actions.selectTeamGroup(team);
      }
    },
    [actions, state.selectedTeamGroups],
  );

  // Handle role group selection
  const handleRoleGroupToggle = useCallback(
    (role: RoleGroup) => {
      const isSelected = state.selectedRoleGroups.some((r) => r.roleId === role.roleId);
      if (isSelected) {
        actions.deselectRoleGroup(role.roleId);
      } else {
        actions.selectRoleGroup(role);
      }
    },
    [actions, state.selectedRoleGroups],
  );

  return (
    <Box>
      {/* Warning for large selections */}
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

      <Stack spacing={3}>
        {/* All Contacts Selection */}
        {showAllContacts && config.allowAllContacts && (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <GroupsIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h3">
                    All Contacts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Send to all contacts with valid email addresses
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6" color="primary.main">
                    {totalValidContacts}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    recipients
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
            <CardActions>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.allContacts}
                    onChange={(e) => handleAllContactsToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label={state.allContacts ? 'Selected' : 'Select All Contacts'}
              />
              {state.allContacts && (
                <Chip label="Active" color="primary" size="small" variant="filled" />
              )}
            </CardActions>
          </Card>
        )}

        {/* Team Groups */}
        {showTeamGroups && config.allowTeamGroups && teamGroups.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <SportsIcon color="primary" />
                <Box>
                  <Typography variant="h6" component="h3">
                    Team Groups
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Send to specific team members
                  </Typography>
                </Box>
              </Stack>

              <List dense>
                {teamGroups.map((team) => {
                  const isSelected = state.selectedTeamGroups.some((t) => t.id === team.id);

                  return (
                    <ListItem key={team.id} divider>
                      <ListItemText
                        primary={team.name}
                        secondary={`${team.estimatedCount} recipients`}
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isSelected && (
                            <Chip
                              label="Selected"
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                          <IconButton
                            edge="end"
                            onClick={() => handleTeamGroupToggle(team)}
                            color={isSelected ? 'error' : 'primary'}
                            size="small"
                          >
                            {isSelected ? <RemoveIcon /> : <AddIcon />}
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Role Groups */}
        {showRoleGroups && config.allowRoleGroups && roleGroups.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <SecurityIcon color="primary" />
                <Box>
                  <Typography variant="h6" component="h3">
                    Role Groups
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Send to contacts with specific roles
                  </Typography>
                </Box>
              </Stack>

              <List dense>
                {roleGroups.map((role) => {
                  const isSelected = state.selectedRoleGroups.some((r) => r.roleId === role.roleId);

                  return (
                    <ListItem key={role.roleId} divider>
                      <ListItemText
                        primary={role.roleName}
                        secondary={`${role.estimatedCount} recipients`}
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isSelected && (
                            <Chip
                              label="Selected"
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                          <IconButton
                            edge="end"
                            onClick={() => handleRoleGroupToggle(role)}
                            color={isSelected ? 'error' : 'primary'}
                            size="small"
                          >
                            {isSelected ? <RemoveIcon /> : <AddIcon />}
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}

        {/* No Groups Available */}
        {!teamGroups.length && !roleGroups.length && !config.allowAllContacts && (
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
            <PeopleIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No groups available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Use the Contacts tab to select individual recipients
            </Typography>
          </Box>
        )}

        {/* Selection Summary */}
        {(state.selectedTeamGroups.length > 0 ||
          state.selectedRoleGroups.length > 0 ||
          state.allContacts) && (
          <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Selected Groups
              </Typography>

              <Stack spacing={1}>
                {state.allContacts && (
                  <Chip
                    icon={<GroupsIcon />}
                    label={`All Contacts (${totalValidContacts})`}
                    color="primary"
                    variant="filled"
                    onDelete={() => actions.deselectAllContacts()}
                  />
                )}

                {state.selectedTeamGroups.map((team) => (
                  <Chip
                    key={team.id}
                    icon={<SportsIcon />}
                    label={`${team.name} (${team.estimatedCount})`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => actions.deselectTeamGroup(team.id)}
                  />
                ))}

                {state.selectedRoleGroups.map((role) => (
                  <Chip
                    key={role.roleId}
                    icon={<SecurityIcon />}
                    label={`${role.roleName} (${role.estimatedCount})`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => actions.deselectRoleGroup(role.roleId)}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Estimated total recipients: {validation.totalRecipients}
                </Typography>

                {(state.selectedTeamGroups.length > 0 || state.selectedRoleGroups.length > 0) && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      state.selectedTeamGroups.forEach((team) =>
                        actions.deselectTeamGroup(team.id),
                      );
                      state.selectedRoleGroups.forEach((role) =>
                        actions.deselectRoleGroup(role.roleId),
                      );
                    }}
                  >
                    Clear Groups
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
};
