export class OauthError extends Error {
  readonly error: string;
  readonly errorDescription?: string;
  readonly httpStatus: number;
  readonly includeBasicChallenge: boolean;

  constructor(
    error: string,
    errorDescription?: string,
    options: { httpStatus?: number; includeBasicChallenge?: boolean } = {},
  ) {
    super(errorDescription ?? error);
    this.name = 'OauthError';
    this.error = error;
    this.errorDescription = errorDescription;
    this.httpStatus = options.httpStatus ?? 400;
    this.includeBasicChallenge = options.includeBasicChallenge ?? false;
  }
}

export class OauthAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OauthAuthenticationError';
  }
}
