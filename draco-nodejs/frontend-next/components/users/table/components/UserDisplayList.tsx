'use client';

import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Badge,
  Stack,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { UserDisplayListProps } from '../../../../types/userTable';
import { User } from '../../../../types/users';

const UserDisplayList: React.FC<UserDisplayListProps> = ({
  user,
  onAssignRole,
  onRemoveRole: _onRemoveRole,
  onEditContact,
  onDeleteContact,
  canManageUsers,
  getRoleDisplayName,
  density,
  showAvatar,
  showContactInfo,
}) => {
  const theme = useTheme();

  // Density configurations
  const densityConfig = {
    compact: {
      padding: 1,
      avatarSize: 32,
      primaryText: 'body2' as const,
      secondaryText: 'caption' as const,
      maxRoles: 1,
      showDetails: false,
    },
    comfortable: {
      padding: 1.5,
      avatarSize: 40,
      primaryText: 'body1' as const,
      secondaryText: 'body2' as const,
      maxRoles: 2,
      showDetails: true,
    },
    spacious: {
      padding: 2,
      avatarSize: 48,
      primaryText: 'subtitle1' as const,
      secondaryText: 'body2' as const,
      maxRoles: 3,
      showDetails: true,
    },
  };

  const config = densityConfig[density];

  const handleAssignRole = async (userToAssign: User) => {
    await onAssignRole(userToAssign);
  };

  // Generate user initials for avatar
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  // Get role color based on role type
  const getRoleColor = (roleName: string) => {
    const lowerRole = roleName.toLowerCase();
    if (lowerRole.includes('admin')) return 'error';
    if (lowerRole.includes('contact')) return 'success';
    return 'primary';
  };

  // Build secondary text content
  const buildSecondaryContent = () => {
    const parts = [];

    if (showContactInfo) {
      if (user.email) parts.push(user.email);
      if (user.primaryPhone) parts.push(user.primaryPhone);
      if (user.fullAddress && config.showDetails) {
        parts.push(user.fullAddress.substring(0, 50) + (user.fullAddress.length > 50 ? '...' : ''));
      }
    }

    if (user.roleCount > 0) {
      parts.push(`${user.roleCount} role${user.roleCount !== 1 ? 's' : ''}`);
    }

    return parts.join(' • ');
  };

  return (
    <ListItem
      sx={{
        py: config.padding,
        px: 2,
        cursor: 'default',
        backgroundColor: 'transparent',
        borderLeft: '3px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04),
          transform: 'translateX(4px)',
        },
        borderRadius: 1,
        mb: 0.5,
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <ListItemAvatar>
          <Avatar
            sx={{
              width: config.avatarSize,
              height: config.avatarSize,
              bgcolor: 'primary.main',
              fontSize: config.avatarSize * 0.4,
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
        </ListItemAvatar>
      )}

      {/* Main Content */}
      <ListItemText
        primary={
          <Typography variant={config.primaryText} component="span" fontWeight={600}>
            {user.displayName}
          </Typography>
        }
        secondary={
          <Box>
            {/* Contact and Role Info */}
            <Typography variant={config.secondaryText} color="text.secondary" sx={{ mb: 0.5 }}>
              {buildSecondaryContent()}
            </Typography>

            {/* Role Chips */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
              {user.activeRoleNames.length > 0 && (
                <>
                  {user.activeRoleNames.slice(0, config.maxRoles).map((roleName) => (
                    <Chip
                      key={roleName}
                      label={typeof roleName === 'string' ? roleName : getRoleDisplayName(roleName)}
                      size="small"
                      color={getRoleColor(
                        typeof roleName === 'string'
                          ? roleName
                          : (roleName as { roleName?: string })?.roleName || 'Unknown',
                      )}
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  ))}
                  {user.activeRoleNames.length > config.maxRoles && (
                    <Chip
                      label={`+${user.activeRoleNames.length - config.maxRoles}`}
                      size="small"
                      variant="outlined"
                      color="default"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  )}
                </>
              )}
              {canManageUsers && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignRole(user);
                  }}
                  sx={{
                    backgroundColor: 'action.hover',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Assign Role"
                >
                  <Badge
                    badgeContent={user.roleCount}
                    color="primary"
                    max={99}
                    showZero={false}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        minWidth: '14px',
                        height: '14px',
                      },
                    }}
                  >
                    <PersonAddIcon sx={{ fontSize: 16 }} />
                  </Badge>
                </IconButton>
              )}
            </Stack>

            {/* Additional Contact Info for Spacious Mode */}
            {config.showDetails && density === 'spacious' && (
              <Stack direction="row" spacing={2} sx={{ mt: 1, opacity: 0.8 }}>
                {user.primaryPhone && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="caption">{user.primaryPhone}</Typography>
                  </Stack>
                )}

                {user.hasContactInfo && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="caption">Has address</Typography>
                  </Stack>
                )}

                {user.lastActivity && (
                  <Typography variant="caption" color="success.main">
                    Active {new Date(user.lastActivity).toLocaleDateString()}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        }
        sx={{ pr: canManageUsers ? 8 : 1 }}
      />

      {/* Direct Action Icons */}
      {canManageUsers && (
        <ListItemSecondaryAction>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit User">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  // Convert EnhancedUser to Contact for the edit dialog
                  const contact = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userId: user.userId,
                    contactDetails: user.contactDetails,
                    contactroles: user.roles?.map((role) => ({
                      id: role.id,
                      roleId: role.roleId,
                      roleName: role.roleName,
                      roleData: role.roleData,
                      contextName: role.contextName,
                    })),
                  };

                  // This will be passed down from the parent component that uses useUserManagement
                  if (typeof onEditContact === 'function') {
                    onEditContact(contact);
                  }
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {onDeleteContact && (
              <Tooltip title="Delete Contact">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteContact({
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      userId: user.userId,
                      contactDetails: user.contactDetails,
                    });
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                      backgroundColor: 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

export default UserDisplayList;
