import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  assignRoleToUser,
  createContact as apiCreateContact,
  deleteContact as apiDeleteContact,
  getAutomaticRoleHolders as apiGetAutomaticRoleHolders,
  getContact as apiGetContact,
  getCurrentUserRoles as apiGetCurrentUserRoles,
  listRoleIdentifiers,
  removeRoleFromUser,
  searchContacts,
  unlinkContactFromUser,
  autoRegisterContact,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { UserManagementService } from '../userManagementService';

vi.mock('@draco/shared-api-client', () => ({
  assignRoleToUser: vi.fn(),
  createContact: vi.fn(),
  deleteContact: vi.fn(),
  getAutomaticRoleHolders: vi.fn(),
  getContact: vi.fn(),
  getCurrentUserRoles: vi.fn(),
  listRoleIdentifiers: vi.fn(),
  removeRoleFromUser: vi.fn(),
  searchContacts: vi.fn(),
  unlinkContactFromUser: vi.fn(),
  autoRegisterContact: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../contactTransformationService', () => ({
  ContactTransformationService: {
    transformContactUpdateResponse: vi.fn((response) => ({
      id: response.id ?? '',
      firstName: response.firstname ?? '',
      lastName: response.lastname ?? '',
      middleName: '',
      email: response.email ?? '',
      userId: '',
      contactDetails: {},
      contactroles: [],
    })),
  },
}));

vi.mock('../contactMediaService', () => ({
  createContactMediaService: vi.fn(() => ({
    deletePhoto: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@draco/shared-api-client/generated/client', () => ({
  formDataBodySerializer: {},
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-7';
const CONTACT_ID = 'c-20';
const TOKEN = 'bearer-tok';

const contact = {
  id: CONTACT_ID,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  userId: 'u-1',
  contactDetails: {},
  contactroles: [],
};

describe('UserManagementService', () => {
  let service: UserManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserManagementService(TOKEN);
  });

  describe('searchUsers', () => {
    it('returns mapped contacts with pagination', async () => {
      vi.mocked(searchContacts).mockResolvedValue(
        makeOk({
          contacts: [contact],
          pagination: { page: 1, limit: 10, hasNext: false, hasPrev: false },
          total: 1,
        }),
      );

      const result = await service.searchUsers(ACCOUNT_ID, 'Jane');

      expect(searchContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(CONTACT_ID);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
    });

    it('passes advanced filter params to the query', async () => {
      vi.mocked(searchContacts).mockResolvedValue(
        makeOk({ contacts: [], pagination: null, total: 0 }),
      );

      await service.searchUsers(ACCOUNT_ID, '', null, false, {}, {
        filterField: 'email',
        filterOp: 'contains',
        filterValue: '@example.com',
      } as never);

      const query = vi.mocked(searchContacts).mock.calls[0][0].query;
      expect(query!.filterField).toBe('email');
      expect(query!.filterValue).toBe('@example.com');
    });

    it('throws when the API errors', async () => {
      vi.mocked(searchContacts).mockResolvedValue(makeError('Server error', 500));
      await expect(service.searchUsers(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchRoles', () => {
    it('maps role identifiers to id and name', async () => {
      vi.mocked(listRoleIdentifiers).mockResolvedValue(
        makeOk([
          { roleId: 'role-1', roleName: 'Administrator' },
          { roleId: 'role-2', roleName: null },
        ]),
      );

      const result = await service.fetchRoles();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'role-1', name: 'Administrator' });
      expect(result[1]).toEqual({ id: 'role-2', name: 'role-2' });
    });

    it('throws when API errors', async () => {
      vi.mocked(listRoleIdentifiers).mockResolvedValue(makeError('Unauthorized', 401));
      await expect(service.fetchRoles()).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('fetchAutomaticRoleHolders', () => {
    it('returns automatic role holders data', async () => {
      const holders = {
        accountOwner: {
          id: 'c-owner',
          firstName: 'Owner',
          lastName: 'Person',
          email: 'owner@example.com',
        },
        teamManagers: [],
      };
      vi.mocked(apiGetAutomaticRoleHolders).mockResolvedValue(makeOk(holders));

      const result = await service.fetchAutomaticRoleHolders(ACCOUNT_ID);

      expect(result).toEqual(holders);
    });
  });

  describe('getCurrentUserRoles', () => {
    it('returns mapped current user roles', async () => {
      vi.mocked(apiGetCurrentUserRoles).mockResolvedValue(
        makeOk({
          userId: 'u-5',
          userName: 'alice',
          globalRoles: ['global-admin'],
          contactRoles: [
            {
              id: 'cr-1',
              contact: { id: CONTACT_ID },
              roleId: 'role-1',
              roleData: 'data',
              accountId: ACCOUNT_ID,
            },
          ],
        }),
      );

      const result = await service.getCurrentUserRoles(ACCOUNT_ID);

      expect(result.userId).toBe('u-5');
      expect(result.username).toBe('alice');
      expect(result.globalRoles).toEqual(['global-admin']);
      expect(result.contactRoles).toHaveLength(1);
      expect(result.contactRoles[0].roleId).toBe('role-1');
      expect(result.contactRoles[0].contactId).toBe(CONTACT_ID);
    });
  });

  describe('assignRole', () => {
    it('assigns a role and returns the result', async () => {
      const roleWithContact = { id: 'cr-99', roleId: 'role-1', contactId: CONTACT_ID };
      vi.mocked(assignRoleToUser).mockResolvedValue(makeOk(roleWithContact));

      const result = await service.assignRole(ACCOUNT_ID, CONTACT_ID, 'role-1', 'data');

      expect(assignRoleToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID },
          body: { roleId: 'role-1', roleData: 'data' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(roleWithContact);
    });

    it('throws when role assignment fails', async () => {
      vi.mocked(assignRoleToUser).mockResolvedValue(makeError('Forbidden', 403));
      await expect(service.assignRole(ACCOUNT_ID, CONTACT_ID, 'role-1', '')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('removeRole', () => {
    it('removes a role and returns the contact role', async () => {
      const removedRole = { id: 'cr-1', roleId: 'role-1', contactId: CONTACT_ID };
      vi.mocked(removeRoleFromUser).mockResolvedValue(makeOk(removedRole));

      const result = await service.removeRole(ACCOUNT_ID, CONTACT_ID, 'role-1', 'data');

      expect(removeRoleFromUser).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID, roleId: 'role-1' },
          body: { roleData: 'data' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(removedRole);
    });
  });

  describe('createContact', () => {
    it('creates a contact without a photo', async () => {
      vi.mocked(apiCreateContact).mockResolvedValue(makeOk(contact));

      const dto = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' };
      const result = await service.createContact(ACCOUNT_ID, dto);

      expect(apiCreateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: expect.objectContaining({ firstName: 'Jane' }),
          throwOnError: false,
        }),
      );
      expect(result).toEqual(contact);
    });

    it('throws when contact creation fails', async () => {
      vi.mocked(apiCreateContact).mockResolvedValue(makeError('Validation error', 422));
      await expect(
        service.createContact(ACCOUNT_ID, { firstName: 'X', lastName: 'Y' }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('checkContactDependencies', () => {
    it('returns contact and dependency check result', async () => {
      const checkData = {
        contact: { id: CONTACT_ID },
        dependencyCheck: {
          canDelete: true,
          dependencies: [],
          message: 'Safe to delete',
          totalDependencies: 0,
        },
      };
      vi.mocked(apiDeleteContact).mockResolvedValue(makeOk(checkData));

      const result = await service.checkContactDependencies(ACCOUNT_ID, CONTACT_ID);

      expect(apiDeleteContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID },
          query: { check: true },
          throwOnError: false,
        }),
      );
      expect(result.dependencyCheck.canDelete).toBe(true);
      expect(result.dependencyCheck.totalDependencies).toBe(0);
    });

    it('throws when dependencyCheck is absent from response', async () => {
      vi.mocked(apiDeleteContact).mockResolvedValue(makeOk({ contact: {}, dependencyCheck: null }));
      await expect(service.checkContactDependencies(ACCOUNT_ID, CONTACT_ID)).rejects.toThrow(
        'Failed to check dependencies',
      );
    });
  });

  describe('deleteContact', () => {
    it('deletes contact and returns a success summary', async () => {
      vi.mocked(apiDeleteContact).mockResolvedValue(
        makeOk({
          deletedContact: { id: CONTACT_ID },
          dependenciesDeleted: 3,
          wasForced: false,
        }),
      );

      const result = await service.deleteContact(ACCOUNT_ID, CONTACT_ID);

      expect(apiDeleteContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID },
          query: undefined,
          throwOnError: false,
        }),
      );
      expect(result.message).toBe('Contact deleted successfully');
      expect(result.dependenciesDeleted).toBe(3);
    });

    it('passes force flag and uses forced message', async () => {
      vi.mocked(apiDeleteContact).mockResolvedValue(
        makeOk({
          deletedContact: { id: CONTACT_ID },
          dependenciesDeleted: 5,
          wasForced: true,
        }),
      );

      const result = await service.deleteContact(ACCOUNT_ID, CONTACT_ID, true);

      expect(vi.mocked(apiDeleteContact).mock.calls[0][0].query).toEqual({ force: true });
      expect(result.message).toBe('Contact deleted with dependencies');
    });
  });

  describe('revokeRegistration', () => {
    it('unlinks contact from user without error', async () => {
      vi.mocked(unlinkContactFromUser).mockResolvedValue(makeOk({ success: true }));

      await expect(service.revokeRegistration(ACCOUNT_ID, CONTACT_ID)).resolves.toBeUndefined();
      expect(unlinkContactFromUser).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID },
        }),
      );
    });
  });

  describe('autoRegisterContact', () => {
    it('returns the auto-register response on success', async () => {
      const responseData = { userId: 'u-new', email: 'new@example.com' };
      vi.mocked(autoRegisterContact).mockResolvedValue({
        data: responseData,
        request: {} as Request,
        response: { status: 200 } as Response,
      } as never);

      const result = await service.autoRegisterContact(ACCOUNT_ID, CONTACT_ID);
      expect(result).toEqual(responseData);
    });

    it('returns the error body on 409 conflict', async () => {
      const conflictData = { alreadyRegistered: true, userId: 'u-existing' };
      vi.mocked(autoRegisterContact).mockResolvedValue({
        data: undefined,
        error: conflictData,
        request: {} as Request,
        response: { status: 409 } as Response,
      } as never);

      const result = await service.autoRegisterContact(ACCOUNT_ID, CONTACT_ID);
      expect(result).toEqual(conflictData);
    });

    it('throws ApiClientError on non-409 error', async () => {
      vi.mocked(autoRegisterContact).mockResolvedValue({
        data: undefined,
        error: { message: 'Server error' },
        request: {} as Request,
        response: { status: 500 } as Response,
      } as never);

      await expect(service.autoRegisterContact(ACCOUNT_ID, CONTACT_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('getContact', () => {
    it('returns the contact from the API', async () => {
      vi.mocked(apiGetContact).mockResolvedValue(makeOk(contact));

      const result = await service.getContact(ACCOUNT_ID, CONTACT_ID);

      expect(apiGetContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, contactId: CONTACT_ID },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(contact);
    });

    it('throws ApiClientError when contact is not found', async () => {
      vi.mocked(apiGetContact).mockResolvedValue(makeError('Not found', 404));
      await expect(service.getContact(ACCOUNT_ID, CONTACT_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
