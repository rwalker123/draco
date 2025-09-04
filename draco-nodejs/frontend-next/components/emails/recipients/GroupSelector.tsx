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
      // TODO: Replace with selectedGroups logic when backend integration is ready
      const teamGroups = state.selectedGroups?.get('teams') || [];
      const isSelected = teamGroups.some((g) => g.metadata?.teamIds?.has(team.id));
      if (isSelected) {
        actions.deselectTeamGroup(team.id);
      } else {
        actions.selectTeamGroup(team);
      }
    },
    [actions, state.selectedGroups],
  );

  // Handle role group selection
  const handleRoleGroupToggle = useCallback(
    (role: RoleGroup) => {
      // TODO: Replace with selectedGroups logic when backend integration is ready
      const managerGroups = state.selectedGroups?.get('managers') || [];
      const isSelected = managerGroups.some((g) => g.metadata?.managerIds?.has(role.roleId));
      if (isSelected) {
        actions.deselectRoleGroup(role.roleId);
      } else {
        actions.selectRoleGroup(role);
      }
    },
    [actions, state.selectedGroups],
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
                    checked={false /* TODO: Replace with allContacts logic */}
                    onChange={(e) => handleAllContactsToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label={'Select All Contacts' /* TODO: Replace with allContacts logic */}
              />
              {/* TODO: Show active chip when all contacts are selected */}
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
                  // TODO: Replace with selectedGroups logic when backend integration is ready
                  const teamGroupsSelected = state.selectedGroups?.get('teams') || [];
                  const isSelected = teamGroupsSelected.some((g) =>
                    g.metadata?.teamIds?.has(team.id),
                  );

                  return (
                    <ListItem key={team.id} divider>
                      <ListItemText
                        primary={team.name}
                        secondary={`${team.members.length} recipients`}
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
                  // TODO: Replace with selectedGroups logic when backend integration is ready
                  const managerGroupsSelected = state.selectedGroups?.get('managers') || [];
                  const isSelected = managerGroupsSelected.some((g) =>
                    g.metadata?.managerIds?.has(role.roleId),
                  );

                  return (
                    <ListItem key={role.roleId} divider>
                      <ListItemText
                        primary={role.name}
                        secondary={`${role.members.length} recipients`}
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
        {/* TODO: Replace with selectedGroups logic when backend integration is ready */}
        {((state.selectedGroups?.get('teams')?.length || 0) > 0 ||
          (state.selectedGroups?.get('managers')?.length || 0) > 0 ||
          false) /* TODO: allContacts logic */ && (
          <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Selected Groups
              </Typography>

              <Stack spacing={1}>
                {/* TODO: Show all contacts chip when selected */}
                {false /* TODO: allContacts logic */ && (
                  <Chip
                    icon={<GroupsIcon />}
                    label={`All Contacts (${totalValidContacts})`}
                    color="primary"
                    variant="filled"
                    onDelete={() => actions.deselectAllContacts()}
                  />
                )}

                {/* TODO: Show selected team groups from selectedGroups */}
                {(state.selectedGroups?.get('teams') || []).map((group, index) => (
                  <Chip
                    key={`team-${index}`}
                    icon={<SportsIcon />}
                    label={`${group.groupName} (${group.totalCount})`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => {
                      // TODO: Remove specific team group
                    }}
                  />
                ))}

                {/* TODO: Show selected manager groups from selectedGroups */}
                {(state.selectedGroups?.get('managers') || []).map((group, index) => (
                  <Chip
                    key={`manager-${index}`}
                    icon={<SecurityIcon />}
                    label={`${group.groupName} (${group.totalCount})`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => {
                      // TODO: Remove specific manager group
                    }}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Estimated total recipients: {validation.totalRecipients}
                </Typography>

                {/* TODO: Replace with selectedGroups logic when backend integration is ready */}
                {((state.selectedGroups?.get('teams')?.length || 0) > 0 ||
                  (state.selectedGroups?.get('managers')?.length || 0) > 0) && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      // TODO: Clear team and manager groups from selectedGroups
                      actions.clearAll();
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
