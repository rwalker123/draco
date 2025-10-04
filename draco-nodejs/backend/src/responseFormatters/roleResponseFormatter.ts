import {
  BaseRoleType,
  ContactRoleType,
  ContactWithContactRolesType,
  RegisteredUserWithRolesType,
  RoleCheckType,
  RoleWithContactType,
  UserRolesType,
} from '@draco/shared-schemas';
import {
  dbAspnetRole,
  dbBaseContact,
  dbContactRoles,
  dbContactWithAccountRoles,
  dbGlobalRoles,
} from '../repositories/index.js';
import { ROLE_NAMES } from '../config/roles.js';

interface RegisteredUserContext {
  userId: string;
  userName: string;
}

export class RoleResponseFormatter {
  static formatRoleIdentifiers(dbRoles: dbAspnetRole[]): BaseRoleType[] {
    return dbRoles.map((role) => ({
      roleId: role.id,
      roleName: role.name ?? undefined,
    }));
  }

  static formatGlobalRoles(dbRoles: dbGlobalRoles[]): string[] {
    return dbRoles.map((role) => role.roleid);
  }

  static formatContactRole(dbContactRole: dbContactRoles): ContactRoleType {
    return {
      id: dbContactRole.id.toString(),
      roleId: dbContactRole.roleid,
      roleData: dbContactRole.roledata.toString(),
    };
  }

  static formatRoleWithContact(
    dbContact: dbBaseContact,
    dbContactRoles: dbContactRoles[],
    contextNames?: Map<string, string>,
  ): RoleWithContactType[] {
    return dbContactRoles.map((role) => {
      const roleName = ROLE_NAMES[role.roleid];
      const contextKey = `${role.roleid}-${role.roledata}`;
      const contextName = contextNames?.get(contextKey);

      return {
        id: role.id.toString(),
        contact: {
          id: dbContact.id.toString(),
        },
        roleId: role.roleid,
        roleName,
        roleData: role.roledata.toString(),
        contextName,
        accountId: role.accountid.toString(),
      };
    });
  }

  static formatRoleWithContacts(dbContactRoles: dbContactRoles[]): RoleWithContactType[] {
    return dbContactRoles.map((role) => ({
      id: role.id.toString(),
      contact: {
        id: role.contactid.toString(),
      },
      roleId: role.roleid,
      roleData: role.roledata.toString(),
      accountId: role.accountid.toString(),
    }));
  }

  static formatGlobalRoleCheckResult(roleId: string, userId: string): RoleCheckType {
    return {
      roleId,
      userId,
      hasRole: true,
      roleLevel: 'global',
      context: '',
    };
  }

  static formatContactRoleCheckResult(
    dbContactRole: dbContactRoles,
    userId: string,
  ): RoleCheckType {
    return {
      roleId: dbContactRole.roleid,
      userId,
      hasRole: true,
      roleLevel: 'contact',
      context: dbContactRole.accountid.toString(),
    };
  }

  static formatContactsWithRoles(
    dbContacts: dbContactWithAccountRoles[],
  ): ContactWithContactRolesType[] {
    return dbContacts.map((contact) => ({
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename ?? undefined,
      email: contact.email ?? undefined,
      userId: contact.userid ?? undefined,
      roles: contact.contactroles.map((role) => ({
        id: role.id.toString(),
        roleId: role.roleid,
        roleData: role.roledata.toString(),
      })),
    }));
  }

  static formatRegisteredUserWithRoles(
    user: RegisteredUserContext,
    userRoles: UserRolesType,
  ): RegisteredUserWithRolesType {
    return {
      userId: user.userId,
      userName: user.userName,
      globalRoles: userRoles.globalRoles,
      contactRoles: userRoles.contactRoles,
    };
  }
}
