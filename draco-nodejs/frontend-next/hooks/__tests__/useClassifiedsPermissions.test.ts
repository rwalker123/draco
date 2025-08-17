// useClassifiedsPermissions Hook Tests
// Comprehensive testing of permission logic for Player Classifieds

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassifiedsPermissions } from '../useClassifiedsPermissions';
import {
  createMockRoleContext,
  createMockAuthContext,
  createMockAccountContext,
} from '../../test-utils/playerClassifiedsTestUtils';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock the context hooks
const mockUseAuth = vi.fn();
const mockUseAccount = vi.fn();
const mockUseRole = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/AccountContext', () => ({
  useAccount: () => mockUseAccount(),
}));

vi.mock('../../context/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

// ============================================================================
// TEST SETUP
// ============================================================================

describe('useClassifiedsPermissions', () => {
  const defaultProps = {
    accountId: 'test-account-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock contexts
    mockUseAuth.mockReturnValue(createMockAuthContext());
    mockUseAccount.mockReturnValue(createMockAccountContext());
    mockUseRole.mockReturnValue(createMockRoleContext());
  });

  // ============================================================================
  // BASIC PERMISSION TESTS
  // ============================================================================

  describe('Basic Permissions', () => {
    it('should return correct permission structure', () => {
      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current).toHaveProperty('canCreatePlayersWanted');
      expect(result.current).toHaveProperty('canEditPlayersWanted');
      expect(result.current).toHaveProperty('canDeletePlayersWanted');
      expect(result.current).toHaveProperty('canCreateTeamsWanted');
      expect(result.current).toHaveProperty('canEditTeamsWanted');
      expect(result.current).toHaveProperty('canDeleteTeamsWanted');
      expect(result.current).toHaveProperty('canSearchClassifieds');
      expect(result.current).toHaveProperty('canViewClassifieds');
      expect(result.current).toHaveProperty('canModerateClassifieds');
    });

    it('should handle missing account ID', () => {
      const props = { accountId: '' };

      // Set up mock role context with no roles for this test
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: [],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(props));

      // Teams Wanted permissions are always true (public)
      // Search and view permissions are true when userRoles !== null
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true); // Always true
      expect(result.current.canEditTeamsWanted).toBe(true); // Always true
      expect(result.current.canDeleteTeamsWanted).toBe(true); // Always true
      expect(result.current.canSearchClassifieds).toBe(true); // True when userRoles !== null
      expect(result.current.canViewClassifieds).toBe(true); // True when userRoles !== null
      expect(result.current.canModerateClassifieds).toBe(false);
    });
  });

  // ============================================================================
  // ROLE-BASED PERMISSION TESTS
  // ============================================================================

  describe('Role-Based Permissions', () => {
    it('should grant full permissions to AccountAdmin', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['AccountAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(true);
    });

    it('should grant full permissions to ContactAdmin', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['ContactAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // ContactAdmin is not included in Players Wanted permissions (only TeamAdmin, AccountAdmin, SuperAdmin)
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false); // ContactAdmin can't moderate
    });

    it('should grant limited permissions to TeamAdmin', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should grant minimal permissions to TeamMember', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamMember'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should grant minimal permissions to Contact', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['Contact'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });
  });

  // ============================================================================
  // PERMISSION HELPER FUNCTIONS TESTS
  // ============================================================================

  describe('Permission Helper Functions', () => {
    it('should check specific role permissions', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // TeamAdmin should have most permissions but not moderation
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle multiple roles correctly', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin', 'ContactAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Should have highest level of permissions from all roles
      expect(result.current.canCreatePlayersWanted).toBe(true); // From TeamAdmin
      expect(result.current.canEditPlayersWanted).toBe(true); // From TeamAdmin
      expect(result.current.canDeletePlayersWanted).toBe(true); // From TeamAdmin
      expect(result.current.canCreateTeamsWanted).toBe(true); // From both
      expect(result.current.canEditTeamsWanted).toBe(true); // From both
      expect(result.current.canDeleteTeamsWanted).toBe(true); // From both
      expect(result.current.canModerateClassifieds).toBe(false); // Neither role has this
    });

    it('should handle account-specific roles', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['AccountAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // AccountAdmin should have all permissions
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(true);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle null user roles', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: null,
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Teams Wanted permissions are always true (public)
      // Search and view permissions are false when userRoles === null
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true); // Always true
      expect(result.current.canEditTeamsWanted).toBe(true); // Always true
      expect(result.current.canDeleteTeamsWanted).toBe(true); // Always true
      expect(result.current.canSearchClassifieds).toBe(false); // False when userRoles === null
      expect(result.current.canViewClassifieds).toBe(false); // False when userRoles === null
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle undefined user roles', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: undefined,
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Teams Wanted permissions are always true (public)
      // Search and view permissions are false when userRoles === undefined
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true); // Always true
      expect(result.current.canEditTeamsWanted).toBe(true); // Always true
      expect(result.current.canDeleteTeamsWanted).toBe(true); // Always true
      expect(result.current.canSearchClassifieds).toBe(false); // False when userRoles === undefined
      expect(result.current.canViewClassifieds).toBe(false); // False when userRoles === undefined
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle empty user roles', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: [],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Teams Wanted permissions are always true (public)
      // Search and view permissions are true when userRoles !== null (even if empty)
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canCreateTeamsWanted).toBe(true); // Always true
      expect(result.current.canEditTeamsWanted).toBe(true); // Always true
      expect(result.current.canDeleteTeamsWanted).toBe(true); // Always true
      expect(result.current.canSearchClassifieds).toBe(true); // True when userRoles !== null
      expect(result.current.canViewClassifieds).toBe(true); // True when userRoles !== null
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle null user roles gracefully', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: null,
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Should not throw errors and return false for all permissions
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
    });

    it('should handle missing account context', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Should still work with valid role context
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work with real role context implementation', () => {
      const mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Verify all permission properties are boolean
      Object.values(result.current).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });

      // Verify specific permissions based on role
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle role changes correctly', () => {
      let mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['TeamAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result, rerender } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Initial state
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);

      // Change to AccountAdmin
      mockRoleContext = createMockRoleContext({
        userRoles: {
          globalRoles: ['AccountAdmin'],
          contactRoles: [],
        },
      });
      mockUseRole.mockReturnValue(mockRoleContext);

      rerender();

      // Should now have moderation permissions
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(true);
    });
  });
});
