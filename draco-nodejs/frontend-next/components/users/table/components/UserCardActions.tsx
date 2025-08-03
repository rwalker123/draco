'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { EnhancedUser, UserCardAction } from '../../../../types/userTable';
import { User, UserRole } from '../../../../types/users';

interface UserCardActionsProps {
  user: EnhancedUser;
  canManageUsers: boolean;
  onRemoveRole?: (user: User, role: UserRole) => void;
  showQuickActions?: boolean;
  showContextMenu?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: 'overlay' | 'inline';
  customActions?: UserCardAction[];
  onActionClick?: (action: UserCardAction, user: EnhancedUser) => void;
}

const UserCardActions: React.FC<UserCardActionsProps> = ({
  user,
  canManageUsers,
  onRemoveRole: _onRemoveRole,
  showQuickActions = true,
  showContextMenu = true,
  position = 'top-right',
  variant = 'overlay',
  customActions = [],
  onActionClick,
}) => {
  const theme = useTheme();
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);

  // Position configurations
  const positionStyles = {
    'top-right': { top: 8, right: 8 },
    'top-left': { top: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
  };

  const handleContextMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
  };

  const handleCustomAction = (action: UserCardAction) => {
    handleContextMenuClose();
    if (onActionClick) {
      onActionClick(action, user);
    } else if (action.handler) {
      action.handler([user]);
    }
  };

  // Default context menu actions
  const defaultContextActions = [
    {
      id: 'view-profile',
      label: 'View Profile',
      icon: ViewIcon,
      color: 'primary' as const,
      enabled: true,
    },
    {
      id: 'edit-user',
      label: 'Edit User',
      icon: EditIcon,
      color: 'primary' as const,
      enabled: canManageUsers,
    },
    {
      id: 'security-settings',
      label: 'Security Settings',
      icon: SecurityIcon,
      color: 'primary' as const,
      enabled: canManageUsers,
    },
  ];

  const destructiveActions = [
    {
      id: 'remove-user',
      label: 'Remove User',
      icon: DeleteIcon,
      color: 'error' as const,
      enabled: canManageUsers,
    },
  ];

  const allContextActions = [...defaultContextActions, ...customActions];
  const enabledActions = allContextActions.filter((action) => action.enabled);

  if (!canManageUsers && !showQuickActions && !showContextMenu) {
    return null;
  }

  return (
    <Box
      sx={{
        position: variant === 'overlay' ? 'absolute' : 'relative',
        ...positionStyles[position],
        zIndex: 10,
        display: 'flex',
        gap: 0.5,
      }}
    >
      {/* Context Menu Trigger */}
      {showContextMenu && enabledActions.length > 0 && (
        <Tooltip title="More actions">
          <IconButton
            size="small"
            onClick={handleContextMenuOpen}
            sx={{
              backgroundColor: variant === 'overlay' ? alpha('#fff', 0.9) : 'transparent',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor:
                  variant === 'overlay'
                    ? alpha('#fff', 1)
                    : alpha(theme.palette.action.hover, 0.08),
                color: 'text.primary',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            minWidth: 200,
            maxWidth: 280,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
            {user.displayName}
          </Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{user.email}</Box>
        </Box>

        {/* Primary Actions */}
        {enabledActions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleCustomAction(action)}
            sx={{
              color:
                action.color === 'error'
                  ? 'error.main'
                  : action.color === 'warning'
                    ? 'warning.main'
                    : 'text.primary',
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: '32px',
              }}
            >
              <action.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}

        {/* Destructive Actions */}
        {destructiveActions.some((action) => action.enabled) && [
          <Divider key="destructive-divider" />,
          ...destructiveActions
            .filter((action) => action.enabled)
            .map((action) => (
              <MenuItem
                key={action.id}
                onClick={() => handleCustomAction(action)}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: '32px' }}>
                  <action.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={action.label} />
              </MenuItem>
            )),
        ]}
      </Menu>
    </Box>
  );
};

export default UserCardActions;
