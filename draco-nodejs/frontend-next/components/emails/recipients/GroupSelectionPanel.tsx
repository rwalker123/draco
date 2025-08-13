'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Collapse,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Groups as TeamIcon,
  AdminPanelSettings as AdminIcon,
  People as RoleIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Sports as SportsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { TeamGroup, RoleGroup } from '../../../types/emails/recipients';

export interface GroupSelectionPanelProps {
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  selectedTeamGroups: TeamGroup[];
  selectedRoleGroups: RoleGroup[];
  onTeamGroupToggle: (group: TeamGroup) => void;
  onRoleGroupToggle: (group: RoleGroup) => void;
  compact?: boolean;
}

type GroupTabValue = 'teams' | 'roles';

/**
 * GroupSelectionPanel - Team and role group selection interface
 * Provides tabbed interface for different group types with member previews
 */
const GroupSelectionPanel: React.FC<GroupSelectionPanelProps> = ({
  teamGroups,
  roleGroups,
  selectedTeamGroups,
  selectedRoleGroups,
  onTeamGroupToggle,
  onRoleGroupToggle,
  compact = false,
}) => {
  const [currentTab, setCurrentTab] = useState<GroupTabValue>('teams');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: GroupTabValue) => {
    setCurrentTab(newValue);
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Check if team group is selected
  const isTeamGroupSelected = (group: TeamGroup) => {
    return selectedTeamGroups.some((selected) => selected.id === group.id);
  };

  // Check if role group is selected
  const isRoleGroupSelected = (group: RoleGroup) => {
    return selectedRoleGroups.some((selected) => selected.id === group.id);
  };

  // Get team icon based on type
  const getTeamIcon = (type: string) => {
    switch (type) {
      case 'sports':
        return <SportsIcon />;
      case 'managers':
        return <BusinessIcon />;
      default:
        return <TeamIcon />;
    }
  };

  // Get role icon based on role type
  const getRoleIcon = (roleType: string) => {
    if (roleType.includes('ADMIN')) {
      return <AdminIcon />;
    }
    return <RoleIcon />;
  };

  // Get role color based on type
  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'GLOBAL_ADMIN':
        return 'error';
      case 'ACCOUNT_ADMIN':
        return 'warning';
      case 'CONTACT_ADMIN':
        return 'info';
      default:
        return 'default';
    }
  };

  // Render team group item
  const renderTeamGroup = (group: TeamGroup) => {
    const isSelected = isTeamGroupSelected(group);
    const isExpanded = expandedGroups.has(group.id);

    return (
      <Box key={group.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => onTeamGroupToggle(group)}
            selected={isSelected}
            sx={{ pl: 1, pr: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Checkbox checked={isSelected} />
            </ListItemIcon>

            <Avatar sx={{ mr: 2, bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
              {getTeamIcon(group.type)}
            </Avatar>

            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={isSelected ? 'medium' : 'normal'}>
                    {group.name}
                  </Typography>
                  <Badge badgeContent={group.members.length} color="primary" max={999}>
                    <Box />
                  </Badge>
                </Stack>
              }
              secondary={
                !compact && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={group.type} size="small" variant="outlined" color="primary" />
                    {group.description && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {group.description}
                      </Typography>
                    )}
                  </Stack>
                )
              }
            />

            <ListItemSecondaryAction>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupExpansion(group.id);
                }}
              >
                {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItemButton>
        </ListItem>

        {/* Member preview */}
        <Collapse in={isExpanded}>
          <Box sx={{ pl: 6, pr: 2, pb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Members ({group.members.length})
            </Typography>
            <Stack spacing={0.5}>
              {group.members.slice(0, 5).map((member) => (
                <Typography key={member.id} variant="caption" color="text.secondary">
                  • {member.displayName}
                  {member.email && ` (${member.email})`}
                </Typography>
              ))}
              {group.members.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  ... and {group.members.length - 5} more
                </Typography>
              )}
            </Stack>
          </Box>
        </Collapse>

        <Divider variant="inset" component="li" />
      </Box>
    );
  };

  // Render role group item
  const renderRoleGroup = (group: RoleGroup) => {
    const isSelected = isRoleGroupSelected(group);
    const isExpanded = expandedGroups.has(group.id);

    return (
      <Box key={group.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => onRoleGroupToggle(group)}
            selected={isSelected}
            sx={{ pl: 1, pr: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Checkbox checked={isSelected} />
            </ListItemIcon>

            <Avatar sx={{ mr: 2, bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
              {getRoleIcon(group.roleType)}
            </Avatar>

            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={isSelected ? 'medium' : 'normal'}>
                    {group.name}
                  </Typography>
                  <Badge badgeContent={group.members.length} color="primary" max={999}>
                    <Box />
                  </Badge>
                </Stack>
              }
              secondary={
                !compact && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={group.roleType.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      color={
                        getRoleColor(group.roleType) as 'error' | 'warning' | 'info' | 'default'
                      }
                    />
                    {group.permissions.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {group.permissions.length} permission
                        {group.permissions.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Stack>
                )
              }
            />

            <ListItemSecondaryAction>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupExpansion(group.id);
                }}
              >
                {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItemButton>
        </ListItem>

        {/* Member preview and permissions */}
        <Collapse in={isExpanded}>
          <Box sx={{ pl: 6, pr: 2, pb: 1 }}>
            <Stack spacing={1}>
              {/* Members */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Members ({group.members.length})
                </Typography>
                <Stack spacing={0.25}>
                  {group.members.slice(0, 3).map((member) => (
                    <Typography key={member.id} variant="caption" color="text.secondary">
                      • {member.displayName}
                      {member.email && ` (${member.email})`}
                    </Typography>
                  ))}
                  {group.members.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      ... and {group.members.length - 3} more
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Permissions */}
              {group.permissions.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Permissions
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {group.permissions.slice(0, 3).map((permission) => (
                      <Chip
                        key={permission}
                        label={permission.toLowerCase().replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    ))}
                    {group.permissions.length > 3 && (
                      <Chip
                        label={`+${group.permissions.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </Collapse>

        <Divider variant="inset" component="li" />
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<TeamIcon />}
            label={
              <Badge badgeContent={selectedTeamGroups.length} color="primary" max={99}>
                <Box>Teams</Box>
              </Badge>
            }
            value="teams"
            iconPosition="start"
          />
          <Tab
            icon={<RoleIcon />}
            label={
              <Badge badgeContent={selectedRoleGroups.length} color="primary" max={99}>
                <Box>Roles</Box>
              </Badge>
            }
            value="roles"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Group Lists */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Team Groups */}
        {currentTab === 'teams' && (
          <Box>
            {teamGroups.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <TeamIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No team groups available
                </Typography>
              </Box>
            ) : (
              <List dense={compact}>{teamGroups.map(renderTeamGroup)}</List>
            )}
          </Box>
        )}

        {/* Role Groups */}
        {currentTab === 'roles' && (
          <Box>
            {roleGroups.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <RoleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No role groups available
                </Typography>
              </Box>
            ) : (
              <List dense={compact}>{roleGroups.map(renderRoleGroup)}</List>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GroupSelectionPanel;
