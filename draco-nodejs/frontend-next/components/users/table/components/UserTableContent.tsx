'use client';

import React, { memo } from 'react';
import { Table, TableContainer, TableBody, Box, CircularProgress, Typography } from '@mui/material';
import {
  ViewMode,
  EnhancedUser,
  CardSize,
  UserViewConfig,
  DEFAULT_VIEW_CONFIG,
} from '../../../../types/userTable';
import { Contact, User, UserRole } from '../../../../types/users';
// import UserTableHeader from './UserTableHeader'; // Commented out for simplified implementation
import UserCardGrid from './UserCardGrid';
import {
  VirtualScrollContainer,
  createVirtualScrollConfig,
} from '../../../common/VirtualScrollContainer';
import { VirtualUserRendererFactory } from '../renderers/VirtualUserRenderers';

interface UserTableContentProps {
  users: EnhancedUser[];
  loading: boolean;
  isInitialLoad?: boolean;
  viewMode: ViewMode;
  cardSize?: CardSize;
  viewConfig?: Partial<UserViewConfig>;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
  selectedUsers?: string[];
  onSelectUser?: (userId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  // Table-specific props
  showHeader?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  // Actions
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onAssignRole?: (user: User) => Promise<void>;
  onRemoveRole?: (user: User, role: UserRole) => void;
  // Permissions
  canManageUsers?: boolean;
  getRoleDisplayName?: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

const UserTableContent: React.FC<UserTableContentProps> = memo(
  ({
    users,
    loading,
    isInitialLoad = false,
    viewMode,
    cardSize = 'comfortable',
    viewConfig = {},
    enableVirtualization = false,
    virtualizationThreshold = 100,
    selectedUsers: _selectedUsers = [],
    onSelectUser: _onSelectUser,
    onSelectAll: _onSelectAll,
    onDeselectAll: _onDeselectAll,
    showHeader: _showHeader = true,
    sortColumn: _sortColumn,
    sortDirection: _sortDirection,
    onSort: _onSort,
    onEditContact,
    onDeleteContact,
    onDeleteContactPhoto,
    onAssignRole,
    onRemoveRole,
    canManageUsers = false,
    getRoleDisplayName,
  }) => {
    // Loading state
    if (loading && isInitialLoad) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      );
    }

    // Empty state
    if (!loading && users.length === 0) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <Typography variant="body1" color="text.secondary">
            No users found
          </Typography>
        </Box>
      );
    }

    // Merge default view config with provided config
    const mergedViewConfig: UserViewConfig = { ...DEFAULT_VIEW_CONFIG, ...viewConfig };

    // Render content based on view mode
    const renderContent = () => {
      switch (viewMode) {
        case 'card':
          return (
            <UserCardGrid
              users={users}
              cardSize={cardSize}
              viewConfig={mergedViewConfig}
              onEditContact={onEditContact}
              onDeleteContact={onDeleteContact}
              onDeleteContactPhoto={onDeleteContactPhoto}
              onAssignRole={onAssignRole || (async () => {})}
              onRemoveRole={onRemoveRole || (() => {})}
              canManageUsers={canManageUsers}
              getRoleDisplayName={
                getRoleDisplayName ||
                ((role) =>
                  typeof role === 'string' ? role : role.roleName || `Role ${role.roleId}`)
              }
              enableVirtualization={enableVirtualization}
              virtualizationThreshold={virtualizationThreshold}
            />
          );

        case 'table':
        default:
          const tableContent = (
            <TableContainer>
              <Table>
                <TableBody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.email}</td>
                      {/* Add more table cells as needed */}
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );

          // Optionally wrap in virtualization if enabled and threshold met
          if (enableVirtualization && users.length > virtualizationThreshold) {
            // Create virtual scroll renderer for table rows
            const virtualRenderer = VirtualUserRendererFactory.createTableRowRenderer({
              onAssignRole: onAssignRole || (async () => {}),
              onRemoveRole: onRemoveRole || (() => {}),
              canManageUsers,
              getRoleDisplayName:
                getRoleDisplayName ||
                ((role) =>
                  typeof role === 'string' ? role : role.roleName || `Role ${role.roleId}`),
              columns: [
                { id: 'name', width: 200 },
                { id: 'email', width: 250 },
                { id: 'roles', width: 150 },
              ],
            });

            // Create virtual scroll config for table rows
            const virtualScrollConfig = createVirtualScrollConfig('TABLE_ROWS', {
              containerHeight: 400,
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

          return tableContent;
      }
    };

    return (
      <Box sx={{ position: 'relative' }}>
        {loading && !isInitialLoad && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        {renderContent()}
      </Box>
    );
  },
);

UserTableContent.displayName = 'UserTableContent';

export default UserTableContent;
