import axios from 'axios';
import { ContactType } from '@draco/shared-schemas';
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

export const AccountRegistrationService = {
  async fetchMyContact(accountId: string, token?: string): Promise<ContactType | null> {
    try {
      const response = await axios.get(`/api/accounts/${accountId}/contacts/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const backendContact = response.data;
      if (!backendContact) return null;
      return ContactTransformationService.transformBackendContact(backendContact);
    } catch (err: unknown) {
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 404 ||
          err.response?.status === 401 ||
          err.response?.status === 403)
      ) {
        return null;
      }
      throw err;
    }
  },

  async selfRegister(
    accountId: string,
    input: SelfRegisterInput,
    token: string,
  ): Promise<ContactType> {
    const response = await axios.post(
      `/api/accounts/${accountId}/contacts/me`,
      {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        validationType: input.validationType,
        streetAddress: input.streetAddress,
        dateOfBirth: input.dateOfBirth,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const backendContact = response.data;
    return ContactTransformationService.transformBackendContact(backendContact);
  },

  async combinedRegister(
    accountId: string,
    payload: CombinedRegistrationPayload,
  ): Promise<{ token?: string; user?: unknown; contact: ContactType }> {
    const response = await axios.post(`/api/accounts/${accountId}/registration`, payload);
    const { token, user, contact } = response.data || {};
    return {
      token,
      user,
      contact: ContactTransformationService.transformBackendContact(contact),
    };
  },
};
