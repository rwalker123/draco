import { login as loginRequest, refreshToken as refreshTokenRequest } from '@draco/shared-api-client';
import type { RegisteredUserType } from '@draco/shared-schemas';

import type { AuthSession, LoginPayload } from '../../types/auth';
import { createApiClient } from '../api/apiClient';

const LOGIN_FAILED_MESSAGE = 'Unable to authenticate. Please try again.';
const REFRESH_FAILED_MESSAGE = 'Unable to refresh the current session.';

export async function login(credentials: LoginPayload): Promise<AuthSession> {
  const client = createApiClient();
  const result = await loginRequest({
    client,
    body: credentials,
    throwOnError: false
  });

  if (!result.response.ok || !result.data) {
    if (result.response.status === 401) {
      throw new Error('Invalid username or password.');
    }

    throw new Error(getErrorMessage(result.error, LOGIN_FAILED_MESSAGE));
  }

  return buildAuthSession(result.data);
}

export async function refresh(token: string): Promise<AuthSession> {
  const client = createApiClient({ token });
  const result = await refreshTokenRequest({
    client,
    throwOnError: false
  });

  if (!result.response.ok || !result.data) {
    throw new Error(getErrorMessage(result.error, REFRESH_FAILED_MESSAGE));
  }

  return buildAuthSession(result.data);
}

const buildAuthSession = (payload: RegisteredUserType): AuthSession => {
  const token = payload.token;

  if (!token) {
    throw new Error('Authentication response did not include a token.');
  }

  return {
    token,
    user: {
      userId: payload.userId,
      userName: payload.userName,
      contactName: getContactName(payload)
    }
  };
};

const getContactName = (payload: RegisteredUserType): string | undefined => {
  const parts: Array<string | undefined> = [
    payload.contact?.firstName,
    payload.contact?.middleName,
    payload.contact?.lastName
  ];

  const name = parts
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(' ')
    .trim();

  return name.length > 0 ? name : undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
};
