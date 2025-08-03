'use client';

// Virtual scroll renderers for user components following Strategy pattern
// Single Responsibility: Each renderer handles one specific user display type
// Open/Closed: New renderers can be added without modifying existing ones
// DRY: Shared utilities and common patterns extracted

import React from 'react';
import { VirtualItemRenderer } from '../../../../types/virtualScroll';
import { EnhancedUser, CardSize } from '../../../../types/userTable';
import { User, UserRole } from '../../../../types/users';
import UserDisplayCard from '../components/UserDisplayCard';
import UserDisplayList from '../components/UserDisplayList';

// Base interface for user renderers (Interface Segregation)
interface BaseUserRendererProps {
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole?: (user: User, role: UserRole) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

// User Card Virtual Renderer
export const createUserCardRenderer = (
  props: BaseUserRendererProps & {
    cardSize: CardSize;
    selectedUserIds?: Set<string>;
    onToggleSelect?: (userId: string) => void;
    selectionMode?: 'none' | 'single' | 'multiple';
  },
): VirtualItemRenderer<EnhancedUser> => ({
  renderItem: (user: EnhancedUser, _index: number, style: React.CSSProperties) => {
    return (
      <div style={{ ...style, padding: '8px' }}>
        <UserDisplayCard
          user={user}
          cardSize={props.cardSize}
          onAssignRole={props.onAssignRole}
          onRemoveRole={props.onRemoveRole || (() => {})}
          canManageUsers={props.canManageUsers}
          getRoleDisplayName={props.getRoleDisplayName}
          showActions={true}
        />
      </div>
    );
  },

  getItemHeight: (user: EnhancedUser, _index: number) => {
    // Dynamic height based on card size and content
    const baseHeights = {
      compact: 180,
      comfortable: 220,
      spacious: 280,
    };

    let height = baseHeights[props.cardSize];

    // Add extra height for expanded content
    if (user.hasContactInfo && props.cardSize !== 'compact') {
      height += 40;
    }

    // Add padding
    height += 16;

    return height;
  },

  getItemKey: (user: EnhancedUser, index: number) => `card-${user.id}-${index}`,
});

// User List Virtual Renderer
export const createUserListRenderer = (
  props: BaseUserRendererProps & {
    density: 'compact' | 'comfortable' | 'spacious';
    showAvatar?: boolean;
    showContactInfo?: boolean;
    selectedUserIds?: Set<string>;
    onToggleSelect?: (userId: string) => void;
    selectionMode?: 'none' | 'single' | 'multiple';
  },
): VirtualItemRenderer<EnhancedUser> => ({
  renderItem: (user: EnhancedUser, _index: number, style: React.CSSProperties) => {
    return (
      <div style={style}>
        <UserDisplayList
          user={user}
          onAssignRole={props.onAssignRole}
          onRemoveRole={props.onRemoveRole || (() => {})}
          canManageUsers={props.canManageUsers}
          getRoleDisplayName={props.getRoleDisplayName}
          density={props.density}
          showAvatar={props.showAvatar ?? true}
          showContactInfo={props.showContactInfo ?? true}
        />
      </div>
    );
  },

  getItemHeight: (user: EnhancedUser, _index: number) => {
    // Dynamic height based on density and content
    const baseHeights = {
      compact: 56,
      comfortable: 72,
      spacious: 96,
    };

    let height = baseHeights[props.density];

    // Add extra height for spacious mode with contact details
    if (props.density === 'spacious' && props.showContactInfo && user.hasContactInfo) {
      height += 24;
    }

    return height;
  },

  getItemKey: (user: EnhancedUser, index: number) => `list-${user.id}-${index}`,
});

// Table Row Virtual Renderer (for future table virtualization)
export const createUserTableRowRenderer = (
  props: BaseUserRendererProps & {
    columns: Array<{ id: string; width?: number }>;
    selectedUserIds?: Set<string>;
    onToggleSelect?: (userId: string) => void;
    selectionMode?: 'none' | 'single' | 'multiple';
  },
): VirtualItemRenderer<EnhancedUser> => ({
  renderItem: (user: EnhancedUser, _index: number, style: React.CSSProperties) => {
    const isSelected = props.selectedUserIds?.has(user.id) || false;
    const isSelectable = props.selectionMode !== 'none';

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(224, 224, 224, 1)',
          backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        }}
      >
        {/* Selection checkbox */}
        {isSelectable && (
          <div style={{ width: 48, padding: '0 16px' }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => props.onToggleSelect?.(user.id)}
            />
          </div>
        )}

        {/* User columns */}
        <div style={{ flex: 1, padding: '8px 16px' }}>
          <strong>{user.displayName}</strong>
        </div>
        <div style={{ flex: 1, padding: '8px 16px' }}>{user.email}</div>
        <div style={{ flex: 1, padding: '8px 16px' }}>{user.roleCount} roles</div>

        {/* Actions */}
        {props.canManageUsers && (
          <div style={{ width: 120, padding: '8px 16px' }}>
            <button
              onClick={() => props.onAssignRole(user)}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Assign Role
            </button>
          </div>
        )}
      </div>
    );
  },

  getItemHeight: () => 48, // Fixed height for table rows

  getItemKey: (user: EnhancedUser, index: number) => `row-${user.id}-${index}`,
});

// Factory for creating virtual scroll renderers (Factory pattern)
export class VirtualUserRendererFactory {
  static createCardRenderer = createUserCardRenderer;
  static createListRenderer = createUserListRenderer;
  static createTableRowRenderer = createUserTableRowRenderer;

  // Convenience method to create renderer based on view mode
  static createRenderer(
    viewMode: 'card' | 'list' | 'table',
    baseProps: BaseUserRendererProps,
    specificProps: Record<string, unknown>,
  ): VirtualItemRenderer<EnhancedUser> {
    switch (viewMode) {
      case 'card':
        return this.createCardRenderer({ ...baseProps, ...specificProps } as Parameters<
          typeof this.createCardRenderer
        >[0]);
      case 'list':
        return this.createListRenderer({ ...baseProps, ...specificProps } as Parameters<
          typeof this.createListRenderer
        >[0]);
      case 'table':
        return this.createTableRowRenderer({ ...baseProps, ...specificProps } as Parameters<
          typeof this.createTableRowRenderer
        >[0]);
      default:
        throw new Error(`Unsupported view mode: ${viewMode}`);
    }
  }
}

// Utility functions for common renderer operations (DRY principle)
export const getUserItemKey = (user: EnhancedUser, index: number, prefix: string = 'item') =>
  `${prefix}-${user.id}-${index}`;

export const calculateDynamicHeight = (
  _user: EnhancedUser,
  baseHeight: number,
  options: {
    hasExpandedContent?: boolean;
    contentLines?: number;
    padding?: number;
  } = {},
): number => {
  let height = baseHeight;

  if (options.hasExpandedContent) {
    height += 40;
  }

  if (options.contentLines) {
    height += options.contentLines * 20;
  }

  if (options.padding) {
    height += options.padding * 2;
  }

  return height;
};

// Performance optimization utilities
export const shouldVirtualize = (itemCount: number, threshold: number = 100): boolean =>
  itemCount >= threshold;

export const calculateOverscan = (itemCount: number, _viewportSize: number): number => {
  // Adaptive overscan based on item count and viewport
  if (itemCount < 50) return 3;
  if (itemCount < 200) return 5;
  if (itemCount < 1000) return 8;
  return 10;
};
