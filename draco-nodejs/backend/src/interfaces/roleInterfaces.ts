// Segregated Role Service Interfaces
// Follows Interface Segregation Principle to avoid fat interfaces

import { ContactRole, UserRoles, RoleCheckResult, RoleContext } from '../types/roles';

/**
 * Interface for role query operations
 * Used by components that need to retrieve role information
 */
export interface IRoleQuery {
  /**
   * Get all roles for a user (both global and contact roles)
   */
  getUserRoles(userId: string, accountId?: bigint): Promise<UserRoles>;

  /**
   * Get global roles for a user from aspnetuserroles table
   */
  getGlobalRoles(userId: string): Promise<string[]>;

  /**
   * Get contact roles for a user in a specific account
   */
  getContactRoles(userId: string, accountId: bigint): Promise<ContactRole[]>;

  /**
   * Get all users with a specific role in an account
   */
  getUsersWithRole(roleId: string, accountId: bigint): Promise<ContactRole[]>;

  /**
   * Get role name by ID
   */
  getRoleName(roleId: string): Promise<string | null>;

  /**
   * Get role ID by name
   */
  getRoleId(roleName: string): Promise<string | null>;
}

/**
 * Interface for role verification operations
 * Used by middleware and authorization checks
 */
export interface IRoleVerification {
  /**
   * Check if a user has a specific role in a context
   */
  hasRole(userId: string, roleId: string, context: RoleContext): Promise<RoleCheckResult>;

  /**
   * Check if user has role or higher in hierarchy
   */
  hasRoleOrHigher(userId: string, requiredRole: string, context: RoleContext): Promise<boolean>;

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: string, context: RoleContext): Promise<boolean>;
}

/**
 * Interface for role management operations
 * Used by administrative functions that modify role assignments
 */
export interface IRoleManagement {
  /**
   * Assign a role to a contact
   */
  assignRole(
    assignerUserId: string,
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<ContactRole>;

  /**
   * Remove a role from a contact
   */
  removeRole(
    assignerUserId: string,
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<boolean>;
}

/**
 * Combined interface for components that need multiple role operations
 * Use sparingly - prefer specific interfaces when possible
 */
export interface IRoleService extends IRoleQuery, IRoleVerification, IRoleManagement {}

/**
 * Interface for middleware operations
 * Combines query and verification for authentication/authorization
 */
export interface IRoleMiddleware extends IRoleQuery, IRoleVerification {}
