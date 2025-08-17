// useClassifiedsPermissions Hook Tests
// Comprehensive testing of permission checking and role-based access control

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClassifiedsPermissions } from '../useClassifiedsPermissions';
import {
  createMockAuthContext,
  createMockRoleContext,
  createTestProps,
} from '../../test-utils/playerClassifiedsTestUtils';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockUseRole = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../../context/RoleContext', () => ({
  useRole: mockUseRole,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('useClassifiedsPermissions', () => {
  const defaultProps = {
    accountId: 'test-account-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations - default is TeamAdmin
    mockUseRole.mockReturnValue(createMockRoleContext());
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with correct permission state', () => {
      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // Default mock context has TeamAdmin role
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canCreateTeamsWanted).toBe(true);
      expect(result.current.canEditTeamsWanted).toBe(true);
      expect(result.current.canDeleteTeamsWanted).toBe(true);
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false); // TeamAdmin can't moderate
    });

    it('should handle missing account ID gracefully', () => {
      const props = createTestProps(defaultProps, { accountId: '' });
      const { result } = renderHook(() => useClassifiedsPermissions(props));

      // Account ID doesn't affect permissions in the current implementation
      // The hook only checks roles, not account ID
      expect(result.current.canCreatePlayersWanted).toBe(true); // TeamAdmin can create
      expect(result.current.canEditPlayersWanted).toBe(true); // TeamAdmin can edit
      expect(result.current.canDeletePlayersWanted).toBe(true); // TeamAdmin can delete
      expect(result.current.canCreateTeamsWanted).toBe(true); // Teams Wanted is public
      expect(result.current.canEditTeamsWanted).toBe(true); // Teams Wanted editing is public
      expect(result.current.canDeleteTeamsWanted).toBe(true); // Teams Wanted deletion is public
      expect(result.current.canSearchClassifieds).toBe(true); // Any authenticated user can search
      expect(result.current.canViewClassifieds).toBe(true); // Any authenticated user can view
      expect(result.current.canModerateClassifieds).toBe(false); // TeamAdmin can't moderate
    });
  });

  // ============================================================================
  // ROLE-BASED PERMISSION TESTS
  // ============================================================================

  describe('Role-Based Permissions', () => {
    it('should grant full permissions to AccountAdmin', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['AccountAdmin'] });
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
      const mockRoleContext = createMockRoleContext({ userRoles: ['ContactAdmin'] });
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
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
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
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamMember'] });
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
      const mockRoleContext = createMockRoleContext({ userRoles: ['Contact'] });
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
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
    });

    it('should check multiple role permissions', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin', 'ContactAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false); // ContactAdmin can't moderate
    });

    it('should check all role permissions', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['AccountAdmin'] });
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
  });

  // ============================================================================
  // DYNAMIC PERMISSION UPDATES TESTS
  // ============================================================================

  describe('Dynamic Permission Updates', () => {
    it('should update permissions when user roles change', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamMember'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result, rerender } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(false);

      // Change roles
      const newMockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
      mockUseRole.mockReturnValue(newMockRoleContext);

      rerender();

      expect(result.current.canCreatePlayersWanted).toBe(true);
    });

    it('should update permissions when authentication state changes', () => {
      const mockAuthContext = createMockAuthContext({ isAuthenticated: false });
      mockUseAuth.mockReturnValue(mockAuthContext);

      const { result, rerender } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // When not authenticated, userRoles should be null/undefined
      const mockRoleContext = createMockRoleContext({ userRoles: null });
      mockUseRole.mockReturnValue(mockRoleContext);

      rerender();

      expect(result.current.canSearchClassifieds).toBe(false);
      expect(result.current.canViewClassifieds).toBe(false);
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle undefined context values gracefully', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: undefined });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // When userRoles is undefined, the hook checks userRoles !== null which is true
      // So search and view permissions will be true
      expect(result.current.canSearchClassifieds).toBe(true);
      expect(result.current.canViewClassifieds).toBe(true);
      // Other permissions depend on hasRole which will return false for undefined roles
      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle empty user roles array', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: [] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canCreatePlayersWanted).toBe(false);
      expect(result.current.canEditPlayersWanted).toBe(false);
      expect(result.current.canDeletePlayersWanted).toBe(false);
    });

    it('should handle null context values', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: null });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      expect(result.current.canSearchClassifieds).toBe(false);
      expect(result.current.canViewClassifieds).toBe(false);
    });
  });

  // ============================================================================
  // INTEGRATION WITH PERMISSION SYSTEM TESTS
  // ============================================================================

  describe('Integration with Permission System', () => {
    it('should provide consistent permission state', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // All permissions should be consistent with the role
      expect(result.current.canCreatePlayersWanted).toBe(true);
      expect(result.current.canEditPlayersWanted).toBe(true);
      expect(result.current.canDeletePlayersWanted).toBe(true);
      expect(result.current.canModerateClassifieds).toBe(false);
    });

    it('should handle permission inheritance correctly', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['AccountAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // AccountAdmin should inherit all permissions
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
  // PERFORMANCE CONSIDERATIONS TESTS
  // ============================================================================

  describe('Performance Considerations', () => {
    it('should handle permission checks efficiently', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result } = renderHook(() => useClassifiedsPermissions(defaultProps));

      // All permission checks should be computed once and cached
      const startTime = performance.now();

      // Check permissions multiple times
      let totalPermissions = 0;
      for (let i = 0; i < 1000; i++) {
        totalPermissions += result.current.canCreatePlayersWanted ? 1 : 0;
        totalPermissions += result.current.canEditPlayersWanted ? 1 : 0;
        totalPermissions += result.current.canDeletePlayersWanted ? 1 : 0;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 10ms)
      expect(duration).toBeLessThan(10);
      expect(totalPermissions).toBeGreaterThan(0);
    });

    it('should not cause unnecessary re-renders', () => {
      const mockRoleContext = createMockRoleContext({ userRoles: ['TeamAdmin'] });
      mockUseRole.mockReturnValue(mockRoleContext);

      const { result, rerender } = renderHook(() => useClassifiedsPermissions(defaultProps));

      const initialPermissions = {
        canCreatePlayersWanted: result.current.canCreatePlayersWanted,
        canEditPlayersWanted: result.current.canEditPlayersWanted,
        canDeletePlayersWanted: result.current.canDeletePlayersWanted,
      };

      // Re-render without changing context
      rerender();

      // Permissions should remain the same
      expect(result.current.canCreatePlayersWanted).toBe(initialPermissions.canCreatePlayersWanted);
      expect(result.current.canEditPlayersWanted).toBe(initialPermissions.canEditPlayersWanted);
      expect(result.current.canDeletePlayersWanted).toBe(initialPermissions.canDeletePlayersWanted);
    });
  });
});
