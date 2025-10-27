'use client';

import { useCallback } from 'react';
import {
  CreateHofMemberType,
  HofClassSummaryType,
  HofClassWithMembersType,
  HofEligibleContactsResponseType,
  HofMemberType,
  HofNominationInductType,
  HofNominationListType,
  HofNominationSetupType,
  HofNominationType,
  UpdateHofMemberType,
  UpdateHofNominationSetupType,
  UpdateHofNominationType,
} from '@draco/shared-schemas';
import {
  createAccountHallOfFameMember,
  deleteAccountHallOfFameMember,
  deleteAccountHallOfFameNomination,
  getAccountHallOfFameClass,
  getAccountHallOfFameNominationSetup,
  inductAccountHallOfFameNomination,
  listAccountHallOfFameClasses,
  listAccountHallOfFameEligibleContacts,
  listAccountHallOfFameNominations,
  updateAccountHallOfFameMember,
  updateAccountHallOfFameNomination,
  updateAccountHallOfFameNominationSetup,
} from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult, assertNoApiError } from '@/utils/apiResult';

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  return fallback;
};

const coerceOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const str = coerceString(value);
  return str.length > 0 ? str : undefined;
};

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' || typeof value === 'bigint') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const normalizeContact = (input: unknown): HofEligibleContactsResponseType['contacts'][number] => {
  const contact = asRecord(input);
  return {
    id: coerceString(contact['id']),
    firstName: coerceString(contact['firstName']),
    lastName: coerceString(contact['lastName']),
    displayName: coerceString(contact['displayName']),
    photoUrl: coerceOptionalString(contact['photoUrl']),
  };
};

const normalizeMember = (input: unknown): HofMemberType => {
  const member = asRecord(input);
  const contact = asRecord(member['contact']);
  return {
    id: coerceString(member['id']),
    accountId: coerceString(member['accountId']),
    contactId: coerceString(member['contactId']),
    yearInducted: coerceNumber(member['yearInducted']),
    biographyHtml: coerceOptionalString(member['biographyHtml']),
    contact: {
      id: coerceString(contact['id']),
      firstName: coerceString(contact['firstName']),
      lastName: coerceString(contact['lastName']),
      displayName: coerceString(contact['displayName']),
      photoUrl: coerceOptionalString(contact['photoUrl']),
    },
  };
};

const normalizeNomination = (input: unknown): HofNominationType => {
  const nomination = asRecord(input);
  return {
    id: coerceString(nomination['id']),
    accountId: coerceString(nomination['accountId']),
    nominator: coerceString(nomination['nominator']),
    phoneNumber: coerceString(nomination['phoneNumber']),
    email: coerceString(nomination['email']),
    nominee: coerceString(nomination['nominee']),
    reason: coerceString(nomination['reason']),
    submittedAt:
      typeof nomination['submittedAt'] === 'string'
        ? (nomination['submittedAt'] as string)
        : undefined,
  };
};

const normalizeClassSummary = (input: unknown): HofClassSummaryType => {
  const cls = asRecord(input);
  return {
    year: coerceNumber(cls['year']),
    memberCount: coerceNumber(cls['memberCount']),
  };
};

const normalizeClassWithMembers = (
  input: unknown,
  fallbackYear: number,
): HofClassWithMembersType => {
  const cls = asRecord(input);
  const members = Array.isArray(cls['members']) ? cls['members'] : [];
  return {
    year: coerceNumber(cls['year'], fallbackYear),
    memberCount: coerceNumber(cls['memberCount']),
    members: members.map((member) => normalizeMember(member)),
  };
};

const normalizeNominationSetup = (input: unknown): HofNominationSetupType => {
  const setup = asRecord(input);
  return {
    accountId: coerceString(setup['accountId']),
    enableNomination: Boolean(setup['enableNomination']),
    criteriaText: coerceOptionalString(setup['criteriaText']),
  };
};

export interface ListEligibleContactsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListNominationsParams {
  page?: number;
  pageSize?: number;
}

export interface HallOfFameService {
  fetchClasses: () => Promise<HofClassSummaryType[]>;
  fetchClassMembers: (year: number) => Promise<HofClassWithMembersType>;
  listEligibleContacts: (
    params: ListEligibleContactsParams,
  ) => Promise<HofEligibleContactsResponseType>;
  createMember: (payload: CreateHofMemberType) => Promise<HofMemberType>;
  updateMember: (memberId: string, payload: UpdateHofMemberType) => Promise<HofMemberType>;
  deleteMember: (memberId: string) => Promise<void>;
  listNominations: (params: ListNominationsParams) => Promise<HofNominationListType>;
  updateNomination: (
    nominationId: string,
    payload: UpdateHofNominationType,
  ) => Promise<HofNominationType>;
  deleteNomination: (nominationId: string) => Promise<void>;
  inductNomination: (
    nominationId: string,
    payload: HofNominationInductType,
  ) => Promise<HofMemberType>;
  getNominationSetup: () => Promise<HofNominationSetupType>;
  updateNominationSetup: (payload: UpdateHofNominationSetupType) => Promise<HofNominationSetupType>;
}

export function useHallOfFameService(accountId: string): HallOfFameService {
  const apiClient = useApiClient();

  const fetchClasses = useCallback(async (): Promise<HofClassSummaryType[]> => {
    const result = await listAccountHallOfFameClasses({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });

    const classes = unwrapApiResult(result, 'Failed to load Hall of Fame classes') ?? [];
    const list = Array.isArray(classes) ? classes : [];
    return list.map((cls) => normalizeClassSummary(cls));
  }, [accountId, apiClient]);

  const fetchClassMembers = useCallback(
    async (year: number): Promise<HofClassWithMembersType> => {
      const result = await getAccountHallOfFameClass({
        client: apiClient,
        path: { accountId, year },
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to load Hall of Fame class.');
      return normalizeClassWithMembers(raw, year);
    },
    [accountId, apiClient],
  );

  const listEligibleContacts = useCallback(
    async ({
      search,
      page = 1,
      pageSize = 10,
    }: ListEligibleContactsParams): Promise<HofEligibleContactsResponseType> => {
      const result = await listAccountHallOfFameEligibleContacts({
        client: apiClient,
        path: { accountId },
        query: {
          search: search && search.trim().length > 0 ? search.trim() : undefined,
          page,
          pageSize,
        },
        throwOnError: false,
      });

      const raw = unwrapApiResult(
        result,
        'Failed to load eligible contacts for Hall of Fame nominations.',
      );
      return {
        contacts: (raw?.contacts ?? []).map(normalizeContact),
        pagination: raw?.pagination
          ? {
              page: Number(raw.pagination.page ?? 1),
              limit: Number(raw.pagination.limit ?? 0),
              skip: Number(raw.pagination.skip ?? 0),
              sortOrder: (raw.pagination.sortOrder as 'asc' | 'desc') ?? 'asc',
              sortBy: raw.pagination.sortBy ?? undefined,
            }
          : undefined,
      };
    },
    [accountId, apiClient],
  );

  const createMember = useCallback(
    async (payload: CreateHofMemberType): Promise<HofMemberType> => {
      const result = await createAccountHallOfFameMember({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to create Hall of Fame member.');
      return normalizeMember(raw);
    },
    [accountId, apiClient],
  );

  const updateMember = useCallback(
    async (memberId: string, payload: UpdateHofMemberType): Promise<HofMemberType> => {
      const result = await updateAccountHallOfFameMember({
        client: apiClient,
        path: { accountId, memberId },
        body: payload,
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to update Hall of Fame member.');
      return normalizeMember(raw);
    },
    [accountId, apiClient],
  );

  const deleteMember = useCallback(
    async (memberId: string): Promise<void> => {
      const result = await deleteAccountHallOfFameMember({
        client: apiClient,
        path: { accountId, memberId },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete Hall of Fame member.');
    },
    [accountId, apiClient],
  );

  const listNominations = useCallback(
    async ({ page = 1, pageSize = 10 }: ListNominationsParams): Promise<HofNominationListType> => {
      const result = await listAccountHallOfFameNominations({
        client: apiClient,
        path: { accountId },
        query: {
          page,
          pageSize,
        },
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to load Hall of Fame nominations.');
      const nominations = (raw?.nominations ?? []).map(normalizeNomination);
      return {
        nominations,
        total: Number(raw?.total ?? nominations.length),
        pagination: raw?.pagination
          ? {
              page: Number(raw.pagination.page ?? 1),
              limit: Number(raw.pagination.limit ?? pageSize),
              skip: Number(raw.pagination.skip ?? 0),
              sortOrder: (raw.pagination.sortOrder as 'asc' | 'desc') ?? 'desc',
              sortBy: raw.pagination.sortBy ?? undefined,
            }
          : {
              page,
              limit: pageSize,
              skip: (page - 1) * pageSize,
              sortOrder: 'desc',
            },
      };
    },
    [accountId, apiClient],
  );

  const updateNomination = useCallback(
    async (nominationId: string, payload: UpdateHofNominationType): Promise<HofNominationType> => {
      const result = await updateAccountHallOfFameNomination({
        client: apiClient,
        path: { accountId, nominationId },
        body: {
          ...payload,
          phoneNumber: payload.phoneNumber ?? '',
        },
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to update nomination.');
      return normalizeNomination(raw);
    },
    [accountId, apiClient],
  );

  const deleteNomination = useCallback(
    async (nominationId: string): Promise<void> => {
      const result = await deleteAccountHallOfFameNomination({
        client: apiClient,
        path: { accountId, nominationId },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete nomination.');
    },
    [accountId, apiClient],
  );

  const inductNomination = useCallback(
    async (nominationId: string, payload: HofNominationInductType): Promise<HofMemberType> => {
      const result = await inductAccountHallOfFameNomination({
        client: apiClient,
        path: { accountId, nominationId },
        body: payload,
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to induct Hall of Fame nomination.');
      return normalizeMember(raw);
    },
    [accountId, apiClient],
  );

  const getNominationSetup = useCallback(async (): Promise<HofNominationSetupType> => {
    const result = await getAccountHallOfFameNominationSetup({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });

    const raw = unwrapApiResult(result, 'Failed to load nomination settings.');
    return normalizeNominationSetup(raw);
  }, [accountId, apiClient]);

  const updateNominationSetup = useCallback(
    async (payload: UpdateHofNominationSetupType): Promise<HofNominationSetupType> => {
      const result = await updateAccountHallOfFameNominationSetup({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const raw = unwrapApiResult(result, 'Failed to update nomination settings.');
      return normalizeNominationSetup(raw);
    },
    [accountId, apiClient],
  );

  return {
    fetchClasses,
    fetchClassMembers,
    listEligibleContacts,
    createMember,
    updateMember,
    deleteMember,
    listNominations,
    updateNomination,
    deleteNomination,
    inductNomination,
    getNominationSetup,
    updateNominationSetup,
  };
}
