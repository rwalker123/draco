import type { RegisteredUserType, SignInCredentialsType } from '@draco/shared-schemas';

export type AuthenticatedUser = Pick<RegisteredUserType, 'userId' | 'userName'> & {
  contactName?: string;
};

export type AuthTokens = {
  token: string;
};

export type AuthSession = AuthTokens & {
  user: AuthenticatedUser;
};

export type LoginPayload = SignInCredentialsType;
