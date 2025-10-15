import {
  getCurrentUserContact,
  registerContact,
  selfRegisterContact,
} from '@draco/shared-api-client';
import {
  ContactType,
  ContactValidationWithSignInType,
  RegisteredUserType,
} from '@draco/shared-schemas';
import { createApiClient } from '../lib/apiClientFactory';
import { ApiClientError, getApiErrorMessage, unwrapApiResult } from '../utils/apiResult';
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

type ContactDetailsPayload = NonNullable<ContactValidationWithSignInType['contactDetails']>;

const buildContactDetails = (
  validationType: 'streetAddress' | 'dateOfBirth' | undefined,
  streetAddress?: string,
  dateOfBirth?: string,
): ContactDetailsPayload | undefined => {
  const details: ContactDetailsPayload = {
    phone1: null,
    phone2: null,
    phone3: null,
    streetAddress: null,
    city: null,
    state: null,
    zip: null,
    dateOfBirth: null,
  };
  let hasValue = false;

  if (validationType === 'streetAddress' && streetAddress) {
    details.streetAddress = streetAddress;
    hasValue = true;
  }

  if (validationType === 'dateOfBirth' && dateOfBirth) {
    details.dateOfBirth = dateOfBirth;
    hasValue = true;
  }

  return hasValue ? details : undefined;
};

const buildRegistrationPayload = (
  payload: CombinedRegistrationPayload,
): ContactValidationWithSignInType => {
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
  registered: RegisteredUserType | undefined,
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

      const backendContact = unwrapApiResult(result, FETCH_CONTACT_ERROR_MESSAGE) as
        | Record<string, unknown>
        | undefined;
      if (!backendContact) {
        return null;
      }

      return ContactTransformationService.transformBackendContact(backendContact);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status && [401, 403, 404].includes(error.status)) {
          return null;
        }

        throw error;
      }

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

    try {
      const result = await selfRegisterContact({
        client,
        path: { accountId },
        headers: { 'Content-Type': 'application/json' },
        body: {
          firstName: input.firstName,
          middleName: input.middleName,
          lastName: input.lastName,
          validationType,
          contactDetails,
          photo: undefined,
        },
        throwOnError: false,
      });

      const registered = unwrapApiResult(result, REGISTRATION_ERROR_MESSAGE) as RegisteredUserType;
      const backendContact = assertRegisteredContact(registered);
      return ContactTransformationService.transformBackendContact(backendContact);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(getApiErrorMessage(error.details ?? error, REGISTRATION_ERROR_MESSAGE));
      }

      throw error;
    }
  },

  async combinedRegister(
    accountId: string,
    payload: CombinedRegistrationPayload,
    captchaToken?: string,
    authToken?: string,
  ): Promise<{ token?: string; user?: unknown; contact: ContactType }> {
    const client = createApiClient({ token: authToken });

    const registrationPayload = buildRegistrationPayload(payload);
    const result = await registerContact({
      client,
      path: { accountId },
      query: { mode: payload.mode },
      headers: {
        'Content-Type': 'application/json',
        ...(captchaToken ? { 'cf-turnstile-token': captchaToken } : {}),
      },
      body: { ...registrationPayload, photo: undefined },
      throwOnError: false,
    });

    const registered = unwrapApiResult(result, REGISTRATION_ERROR_MESSAGE) as RegisteredUserType;
    const backendContact = assertRegisteredContact(registered);

    return {
      token: registered.token,
      user: registered,
      contact: ContactTransformationService.transformBackendContact(backendContact),
    };
  },
};
