'use client';

import React from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import { KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import { EnhancedUser, CardSize, UserViewConfig } from '../../../../types/userTable';
import { User, UserRole } from '../../../../types/users';
import UserDisplayCard from './UserDisplayCard';
import UserEmptyState from '../../UserEmptyState';
import VirtualScrollContainer, {
  createVirtualScrollConfig,
} from '../../../common/VirtualScrollContainer';
import { VirtualUserRendererFactory, shouldVirtualize } from '../renderers/VirtualUserRenderers';

interface UserCardGridProps {
  users: EnhancedUser[];
  cardSize: CardSize;
  viewConfig: UserViewConfig;
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
  onEditContact?: (contact: import('../../../../types/users').Contact) => void;
  onDeleteContact?: (contact: import('../../../../types/users').Contact) => void;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
  searchTerm?: string;
  hasFilters?: boolean;
}

const UserCardGrid: React.FC<UserCardGridProps> = ({
  users,
  cardSize,
  viewConfig: _viewConfig,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContact,
  onDeleteContactPhoto,
  onRevokeRegistration,
  canManageUsers,
  getRoleDisplayName,
  enableVirtualization = false,
  virtualizationThreshold = 100,
  searchTerm,
  hasFilters = false,
}) => {
  // Component initialization

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = React.useState(false);

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

  // Determine if virtual scrolling should be enabled
  const useVirtualScrolling =
    enableVirtualization && shouldVirtualize(users.length, virtualizationThreshold);

  // Create virtual scroll renderer (always call hooks before any early returns)
  const virtualRenderer = React.useMemo(() => {
    if (!useVirtualScrolling) return null;

    return VirtualUserRendererFactory.createCardRenderer({
      onAssignRole,
      onRemoveRole,
      canManageUsers,
      getRoleDisplayName,
      cardSize,
    });
  }, [
    useVirtualScrolling,
    onAssignRole,
    onRemoveRole,
    canManageUsers,
    getRoleDisplayName,
    cardSize,
  ]);

  // Create virtual scroll config (always call hooks before any early returns)
  const virtualScrollConfig = React.useMemo(() => {
    if (!useVirtualScrolling) return null;

    return createVirtualScrollConfig('USER_CARDS', {
      itemHeight: cardSize === 'compact' ? 280 : cardSize === 'comfortable' ? 360 : 420,
      containerHeight: 600,
      threshold: virtualizationThreshold,
    });
  }, [useVirtualScrolling, cardSize, virtualizationThreshold]);

  // Render empty state inline instead of returning early

  // Spacing configuration based on card size
  const spacing = {
    compact: 1.5,
    comfortable: 2,
    spacious: 3,
  }[cardSize];

  return (
    <Box sx={{ position: 'relative' }}>
      {useVirtualScrolling && virtualRenderer && virtualScrollConfig ? (
        // Virtual Scrolling Mode
        <Box sx={{ p: 2 }}>
          {users.length === 0 ? (
            // Empty state within the virtual scroll structure
            <UserEmptyState searchTerm={searchTerm} hasFilters={hasFilters} />
          ) : (
            <VirtualScrollContainer
              items={users}
              config={virtualScrollConfig}
              renderer={virtualRenderer}
            />
          )}
        </Box>
      ) : (
        // Traditional Flexbox Mode
        <Box sx={{ p: 2 }}>
          {users.length === 0 ? (
            // Empty state within the card structure
            <UserEmptyState searchTerm={searchTerm} hasFilters={hasFilters} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              {users.map((user) => (
                <UserDisplayCard
                  key={user.id}
                  user={user}
                  cardSize={cardSize}
                  onAssignRole={onAssignRole}
                  onRemoveRole={onRemoveRole}
                  onEditContact={onEditContact}
                  onDeleteContact={onDeleteContact}
                  onDeleteContactPhoto={onDeleteContactPhoto}
                  canManageUsers={canManageUsers}
                  getRoleDisplayName={getRoleDisplayName}
                  showActions={true}
                  onRevokeRegistration={onRevokeRegistration}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

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

// Memoize to prevent unnecessary re-renders during pagination
export default React.memo(UserCardGrid, (prevProps, nextProps) => {
  // Only re-render if users array or critical props change
  return (
    prevProps.users === nextProps.users &&
    prevProps.cardSize === nextProps.cardSize &&
    prevProps.enableVirtualization === nextProps.enableVirtualization &&
    prevProps.canManageUsers === nextProps.canManageUsers
  );
});
