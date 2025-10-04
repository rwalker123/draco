import {
  getCurrentUserContact,
  registerContact,
  type ContactValidationWithSignIn,
  type RegisteredUser,
} from '@draco/shared-api-client';
import { ContactType } from '@draco/shared-schemas';
import { createApiClient } from '../lib/apiClientFactory';
import { getApiErrorMessage, unwrapApiResult } from '../utils/apiResult';
import { ContactTransformationService } from './contactTransformationService';

export interface SelfRegisterInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  validationType?: 'streetAddress' | 'dateOfBirth';
  streetAddress?: string;
  dateOfBirth?: string;
}

export interface CombinedNewUserPayload {
  mode: 'newUser'; // TODO: moved to Query string
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  validationType?: 'streetAddress' | 'dateOfBirth';
  streetAddress?: string;
  dateOfBirth?: string;
}

export interface CombinedExistingUserPayload {
  mode: 'existingUser'; // TODO: moved to Query string
  usernameOrEmail: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  validationType?: 'streetAddress' | 'dateOfBirth';
  streetAddress?: string;
  dateOfBirth?: string;
}

// TODO: replace with ContactValidationType
export type CombinedRegistrationPayload = CombinedNewUserPayload | CombinedExistingUserPayload;

const FETCH_CONTACT_ERROR_MESSAGE = 'Failed to load contact information.';
const REGISTRATION_ERROR_MESSAGE =
  'Registration failed. Please check your information and try again.';
const DEFAULT_VALIDATION_TYPE: 'streetAddress' | 'dateOfBirth' = 'streetAddress';

type ContactDetailsPayload = Partial<NonNullable<ContactValidationWithSignIn['contactDetails']>>;

const buildContactDetails = (
  validationType: 'streetAddress' | 'dateOfBirth' | undefined,
  streetAddress?: string,
  dateOfBirth?: string,
): ContactDetailsPayload | undefined => {
  const details: ContactDetailsPayload = {};

  if (validationType === 'streetAddress' && streetAddress) {
    details.streetAddress = streetAddress;
  }

  if (validationType === 'dateOfBirth' && dateOfBirth) {
    details.dateOfBirth = dateOfBirth;
  }

  return Object.keys(details).length > 0 ? details : undefined;
};

const buildRegistrationPayload = (
  payload: CombinedRegistrationPayload,
): ContactValidationWithSignIn => {
  const validationType = payload.validationType ?? DEFAULT_VALIDATION_TYPE;
  const contactDetails = buildContactDetails(
    validationType,
    payload.streetAddress,
    payload.dateOfBirth,
  );

  return {
    firstName: payload.firstName,
    middleName: payload.middleName,
    lastName: payload.lastName ?? '',
    validationType,
    contactDetails,
    email: payload.mode === 'newUser' ? payload.email : undefined,
    userName: payload.mode === 'newUser' ? payload.email : payload.usernameOrEmail,
    password: payload.password,
  };
};

const assertRegisteredContact = (
  registered: RegisteredUser | undefined,
): Record<string, unknown> => {
  if (!registered?.contact) {
    throw new Error(REGISTRATION_ERROR_MESSAGE);
  }

  return registered.contact as Record<string, unknown>;
};

export const AccountRegistrationService = {
  async fetchMyContact(accountId: string, token?: string): Promise<ContactType | null> {
    const client = createApiClient({ token: token || undefined });

    try {
      const result = await getCurrentUserContact({
        client,
        path: { accountId },
        throwOnError: false,
      });

      if (result.error) {
        const status = result.response.status;
        if (status === 401 || status === 403 || status === 404) {
          return null;
        }

        throw new Error(getApiErrorMessage(result.error, FETCH_CONTACT_ERROR_MESSAGE));
      }

      const backendContact = result.data as Record<string, unknown> | undefined;
      if (!backendContact) {
        return null;
      }

      return ContactTransformationService.transformBackendContact(backendContact);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(FETCH_CONTACT_ERROR_MESSAGE);
    }
  },

  async selfRegister(
    accountId: string,
    input: SelfRegisterInput,
    token: string,
  ): Promise<ContactType> {
    const client = createApiClient({ token });
    const validationType = input.validationType ?? DEFAULT_VALIDATION_TYPE;
    const contactDetails = buildContactDetails(
      validationType,
      input.streetAddress,
      input.dateOfBirth,
    );

    const result = await client.post<{ 200: RegisteredUser }, unknown, false>({
      url: '/api/accounts/{accountId}/contacts/me',
      path: { accountId },
      headers: { 'Content-Type': 'application/json' },
      body: {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        validationType,
        contactDetails,
      },
      throwOnError: false,
    });

    if (result.error) {
      throw new Error(getApiErrorMessage(result.error, REGISTRATION_ERROR_MESSAGE));
    }

    const backendContact = assertRegisteredContact(result.data as RegisteredUser | undefined);
    return ContactTransformationService.transformBackendContact(backendContact);
  },

  async combinedRegister(
    accountId: string,
    payload: CombinedRegistrationPayload,
  ): Promise<{ token?: string; user?: unknown; contact: ContactType }> {
    const client = createApiClient();

    const registrationPayload = buildRegistrationPayload(payload);
    const result = await registerContact({
      client,
      path: { accountId },
      query: { mode: payload.mode },
      headers: { 'Content-Type': 'application/json' },
      body: registrationPayload,
      throwOnError: false,
    });

    const registered = unwrapApiResult(result, REGISTRATION_ERROR_MESSAGE) as RegisteredUser;
    const backendContact = assertRegisteredContact(registered);

    return {
      token: registered.token,
      user: registered,
      contact: ContactTransformationService.transformBackendContact(backendContact),
    };
  },
};
