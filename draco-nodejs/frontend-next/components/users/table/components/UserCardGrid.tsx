'use client';

import React from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import { KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import { EnhancedUser, CardSize, UserViewConfig } from '../../../../types/userTable';
import UserDisplayCard from './UserDisplayCard';
import UserEmptyState from '../../UserEmptyState';
import { ContactRoleType, BaseContactType } from '@draco/shared-schemas';

interface UserCardGridProps {
  users: EnhancedUser[];
  cardSize: CardSize;
  viewConfig: UserViewConfig;
  onAssignRole: (user: BaseContactType) => Promise<void>;
  onRemoveRole: (user: BaseContactType, role: ContactRoleType) => Promise<void>;
  onEditContact?: (contact: BaseContactType) => Promise<void>;
  onDeleteContact?: (contact: BaseContactType) => Promise<void>;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: BaseContactType) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
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
  onAutoRegister,
  canManageUsers,
  getRoleDisplayName,
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

  // Spacing configuration based on card size
  const spacing = {
    compact: 1.5,
    comfortable: 2,
    spacious: 3,
  }[cardSize];

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ p: 2 }}>
        {users.length === 0 ? (
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
                onAutoRegister={onAutoRegister}
              />
            ))}
          </Box>
        )}
      </Box>

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
    prevProps.canManageUsers === nextProps.canManageUsers
  );
});
