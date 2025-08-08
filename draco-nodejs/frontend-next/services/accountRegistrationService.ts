import axios from 'axios';
import { Contact } from '../types/users';
import { ContactTransformationService } from './contactTransformationService';

export interface SelfRegisterInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
}

export interface CombinedNewUserPayload {
  mode: 'newUser';
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface CombinedExistingUserPayload {
  mode: 'existingUser';
  usernameOrEmail: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
}

export type CombinedRegistrationPayload = CombinedNewUserPayload | CombinedExistingUserPayload;

export const AccountRegistrationService = {
  async fetchMyContact(accountId: string, token?: string): Promise<Contact | null> {
    try {
      const response = await axios.get(`/api/accounts/${accountId}/contacts/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const backendContact = response.data?.data?.contact;
      if (!backendContact) return null;
      return ContactTransformationService.transformBackendContact(backendContact);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async selfRegister(accountId: string, input: SelfRegisterInput, token: string): Promise<Contact> {
    const response = await axios.post(
      `/api/accounts/${accountId}/contacts/me`,
      {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        email: input.email,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const backendContact = response.data?.data?.contact;
    return ContactTransformationService.transformBackendContact(backendContact);
  },

  async combinedRegister(
    accountId: string,
    payload: CombinedRegistrationPayload,
  ): Promise<{ token?: string; user?: unknown; contact: Contact }> {
    const response = await axios.post(`/api/accounts/${accountId}/registration`, payload);
    const { token, user, contact } = response.data || {};
    return {
      token,
      user,
      contact: ContactTransformationService.transformBackendContact(contact),
    };
  },
};


