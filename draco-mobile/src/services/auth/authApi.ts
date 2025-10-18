import {
  getCurrentSeason,
  getMyAccounts,
  login as loginRequest,
  refreshToken as refreshTokenRequest,
  type Account,
  type RegisteredUser
} from '@draco/shared-api-client';

import type { AuthSession, LoginPayload } from '../../types/auth';
import { createApiClient } from '../api/apiClient';
import { getApiErrorMessage, unwrapApiResult } from '../api/apiResult';

const LOGIN_FAILED_MESSAGE = 'Unable to authenticate. Please try again.';
const REFRESH_FAILED_MESSAGE = 'Unable to refresh the current session.';
const ACCOUNT_SELECTION_MESSAGE =
  'Multiple accounts are associated with this user. Please enter an account ID on the login screen.';

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

  const baseSession = buildAuthSession(result.data);
  const authedClient = createApiClient({ token: baseSession.token });
  const accountId = await resolveAccountId({
    client: authedClient,
    providedAccountId: credentials.accountId
  });

  await verifyAccountAccess(authedClient, accountId);

  return {
    ...baseSession,
    accountId
  };
}

export async function refresh(token: string, accountId: string): Promise<AuthSession> {
  const client = createApiClient({ token });
  const result = await refreshTokenRequest({
    client,
    throwOnError: false
  });

  if (!result.response.ok || !result.data) {
    throw new Error(getErrorMessage(result.error, REFRESH_FAILED_MESSAGE));
  }

  const refreshed = buildAuthSession(result.data);
  return {
    ...refreshed,
    accountId
  };
}

const buildAuthSession = (payload: RegisteredUser) => {
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

type ResolveAccountIdParams = {
  client: ReturnType<typeof createApiClient>;
  providedAccountId?: string;
};

async function resolveAccountId({ client, providedAccountId }: ResolveAccountIdParams): Promise<string> {
  if (providedAccountId) {
    await ensureAccountAccessible(client, providedAccountId);
    return providedAccountId;
  }

  const accountsResult = await getMyAccounts({
    client,
    throwOnError: false
  });

  const accounts = unwrapApiResult<Account[]>(accountsResult, 'Failed to fetch accessible accounts');

  if (accounts.length === 0) {
    throw new Error('No accounts are associated with this user. Please contact your administrator.');
  }

  if (accounts.length > 1) {
    throw new Error(ACCOUNT_SELECTION_MESSAGE);
  }

  const [account] = accounts;
  return account.id;
}

async function ensureAccountAccessible(client: ReturnType<typeof createApiClient>, accountId: string): Promise<void> {
  try {
    const accountsResult = await getMyAccounts({
      client,
      throwOnError: false
    });

    const accounts = accountsResult.data ?? [];
    const hasAccess = accounts.some((account) => account.id === accountId);
    if (!hasAccess && accounts.length > 0) {
      throw new Error('You do not have access to the selected account.');
    }
  } catch {
    // If the lookup fails we will fall back to verifying via getCurrentSeason below.
  }
}

async function verifyAccountAccess(client: ReturnType<typeof createApiClient>, accountId: string): Promise<void> {
  const currentSeasonResult = await getCurrentSeason({
    client,
    path: { accountId },
    throwOnError: false
  });

  if (currentSeasonResult.error) {
    const status = currentSeasonResult.response?.status ?? 0;
    if (status === 404) {
      // The account simply lacks an active season, which is acceptable for the mobile app.
      return;
    }

    throw new Error(getApiErrorMessage(currentSeasonResult.error, 'Failed to verify account access.'));
  }
}

const getContactName = (payload: RegisteredUser): string | undefined => {
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
