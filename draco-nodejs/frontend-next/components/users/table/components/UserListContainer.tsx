'use client';

import React, { useState } from 'react';
import {
  Box,
  List,
  Paper,
  Typography,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Zoom,
  Fab,
} from '@mui/material';
import {
  ViewHeadline as CompactIcon,
  ViewStream as ComfortableIcon,
  ViewList as SpaciousIcon,
  Settings as SettingsIcon,
  KeyboardArrowUp as ScrollTopIcon,
} from '@mui/icons-material';
import { EnhancedUser, UserViewConfig } from '../../../../types/userTable';
import { User, UserRole } from '../../../../types/users';
import UserDisplayList from './UserDisplayList';
import VirtualScrollContainer, {
  createVirtualScrollConfig,
} from '../../../common/VirtualScrollContainer';
import { VirtualUserRendererFactory, shouldVirtualize } from '../renderers/VirtualUserRenderers';

interface UserListContainerProps {
  users: EnhancedUser[];
  viewConfig: UserViewConfig;
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
  onEditContact?: (contact: import('../../../../types/users').Contact) => void;
  onDeleteContact?: (contact: import('../../../../types/users').Contact) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
}

const UserListContainer: React.FC<UserListContainerProps> = ({
  users,
  viewConfig,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContact,
  canManageUsers,
  getRoleDisplayName,
  enableVirtualization = false,
  virtualizationThreshold = 100,
}) => {
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(
    viewConfig.listDensity,
  );
  const [showAvatars, setShowAvatars] = useState(viewConfig.showAvatars);
  const [showContactInfo, setShowContactInfo] = useState(viewConfig.showContactInfo);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Settings menu handlers
  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  // Density change handler
  const handleDensityChange = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    setDensity(newDensity);
    handleSettingsMenuClose();
  };

  // Scroll to top functionality
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Empty state
  if (users.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6" gutterBottom>
          No users to display
        </Typography>
        <Typography variant="body2">Try adjusting your search or filter criteria.</Typography>
      </Box>
    );
  }

  // Get density icon (used in settings menu)
  const getDensityIcon = (densityType: string) => {
    switch (densityType) {
      case 'compact':
        return <CompactIcon fontSize="small" />;
      case 'comfortable':
        return <ComfortableIcon fontSize="small" />;
      case 'spacious':
        return <SpaciousIcon fontSize="small" />;
      default:
        return <ComfortableIcon fontSize="small" />;
    }
  };
  // Suppress ESLint warning - function is available for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getDensityIcon = getDensityIcon;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* List Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* List Info */}
          <Box>
            <Typography variant="h6" component="h2">
              {users.length} {users.length === 1 ? 'User' : 'Users'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {density.charAt(0).toUpperCase() + density.slice(1)} density
              {showAvatars && ' • With avatars'}
              {showContactInfo && ' • With contact info'}
            </Typography>
          </Box>

          {/* Controls */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="View Settings">
              <IconButton size="small" onClick={handleSettingsMenuOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* List Content */}
      <Paper sx={{ backgroundColor: 'background.paper' }}>
        {(() => {
          // Determine if virtual scrolling should be enabled
          const useVirtualScrolling =
            enableVirtualization && shouldVirtualize(users.length, virtualizationThreshold);

          if (useVirtualScrolling) {
            // Create virtual scroll renderer
            const virtualRenderer = VirtualUserRendererFactory.createListRenderer({
              onAssignRole,
              onRemoveRole,
              canManageUsers,
              getRoleDisplayName,
              density,
              showAvatar: showAvatars,
              showContactInfo,
            });

            // Create virtual scroll config based on density
            const presetName =
              density === 'compact'
                ? 'USER_LIST_COMPACT'
                : density === 'comfortable'
                  ? 'USER_LIST_COMFORTABLE'
                  : 'USER_LIST_SPACIOUS';

            const virtualScrollConfig = createVirtualScrollConfig(presetName, {
              containerHeight: 500,
              threshold: virtualizationThreshold,
            });

            return (
              <VirtualScrollContainer
                items={users}
                config={virtualScrollConfig}
                renderer={virtualRenderer}
              />
            );
          }

          // Traditional List Mode
          return (
            <List
              sx={{
                py: 1,
                maxHeight: 'auto',
                overflow: 'visible',
              }}
            >
              {users.map((user, index) => (
                <React.Fragment key={user.id}>
                  <UserDisplayList
                    user={user}
                    onAssignRole={onAssignRole}
                    onRemoveRole={onRemoveRole}
                    onEditContact={onEditContact}
                    onDeleteContact={onDeleteContact}
                    canManageUsers={canManageUsers}
                    getRoleDisplayName={getRoleDisplayName}
                    density={density}
                    showAvatar={showAvatars}
                    showContactInfo={showContactInfo}
                  />
                  {/* Add divider between items for spacious mode */}
                  {density === 'spacious' && index < users.length - 1 && (
                    <Divider variant="inset" component="li" sx={{ ml: showAvatars ? 9 : 2 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          );
        })()}
      </Paper>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsMenuClose}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        {/* Density Options */}
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            List Density
          </Typography>
        </MenuItem>

        <MenuItem onClick={() => handleDensityChange('compact')} selected={density === 'compact'}>
          <CompactIcon sx={{ mr: 2 }} />
          Compact
        </MenuItem>

        <MenuItem
          onClick={() => handleDensityChange('comfortable')}
          selected={density === 'comfortable'}
        >
          <ComfortableIcon sx={{ mr: 2 }} />
          Comfortable
        </MenuItem>

        <MenuItem onClick={() => handleDensityChange('spacious')} selected={density === 'spacious'}>
          <SpaciousIcon sx={{ mr: 2 }} />
          Spacious
        </MenuItem>

        <Divider />

        {/* Display Options */}
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Display Options
          </Typography>
        </MenuItem>

        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showAvatars}
                onChange={(e) => setShowAvatars(e.target.checked)}
                size="small"
              />
            }
            label="Show Avatars"
            sx={{ m: 0 }}
          />
        </MenuItem>

        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showContactInfo}
                onChange={(e) => setShowContactInfo(e.target.checked)}
                size="small"
              />
            }
            label="Show Contact Info"
            sx={{ m: 0 }}
          />
        </MenuItem>

        <Divider />

        {/* Performance Info */}
        {enableVirtualization && users.length > virtualizationThreshold && (
          <MenuItem disabled>
            <Typography variant="caption" color="success.main">
              Virtual scrolling enabled ({users.length} users)
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <ScrollTopIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default UserListContainer;
