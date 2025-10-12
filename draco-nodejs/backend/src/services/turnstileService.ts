import { HumanVerificationError } from '../utils/customErrors.js';

type TurnstileVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
};

const DEFAULT_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_HEADER_NAME = 'cf-turnstile-token';
const IS_DEBUG = process.env.NODE_ENV !== 'production';

export class TurnstileService {
  private readonly secretKey: string | undefined;
  private readonly verifyEndpoint: string;

  constructor({
    secretKey = process.env.TURNSTILE_SECRET_KEY,
    verifyEndpoint = process.env.TURNSTILE_VERIFY_ENDPOINT || DEFAULT_VERIFY_ENDPOINT,
  }: {
    secretKey?: string;
    verifyEndpoint?: string;
  } = {}) {
    this.secretKey = secretKey;
    this.verifyEndpoint = verifyEndpoint;

    if (IS_DEBUG) {
      console.info(
        '[TurnstileService] Initialized. Secret present:',
        Boolean(this.secretKey),
        'Verify endpoint:',
        this.verifyEndpoint,
      );
    }
  }

  isEnabled(): boolean {
    return Boolean(this.secretKey);
  }

  getHeaderName(): string {
    return TURNSTILE_HEADER_NAME;
  }

  async assertValid(token: string | null | undefined, remoteIp?: string | null): Promise<void> {
    if (!this.isEnabled()) {
      if (IS_DEBUG) {
        console.warn('[TurnstileService] Verification skipped: no secret configured.');
      }
      return;
    }

    if (!token) {
      if (IS_DEBUG) {
        console.warn(
          '[TurnstileService] Missing Turnstile token. Remote IP:',
          remoteIp ?? 'unknown',
        );
      }
      throw new HumanVerificationError('Verification challenge is required.');
    }

    try {
      if (IS_DEBUG) {
        console.info('[TurnstileService] Verifying token (length:', token.length, ').');
      }
      await this.verifyToken(token, remoteIp ?? undefined);
      if (IS_DEBUG) {
        console.info('[TurnstileService] Token verified successfully.');
      }
    } catch (error) {
      if (error instanceof HumanVerificationError) {
        if (IS_DEBUG) {
          console.warn('[TurnstileService] Validation error:', error.message);
        }
        throw error;
      }

      if (IS_DEBUG) {
        console.error('[TurnstileService] Verification failed:', error);
      }
      throw new HumanVerificationError();
    }
  }

  private async verifyToken(token: string, remoteIp?: string): Promise<void> {
    const secret = this.secretKey;
    if (!secret) {
      return;
    }

    const payload = new URLSearchParams({
      secret,
      response: token,
    });

    if (remoteIp) {
      payload.append('remoteip', remoteIp);
    }

    const response = await fetch(this.verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      throw new HumanVerificationError();
    }

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      console.warn(
        '[TurnstileService] Verification failed',
        result['error-codes'] ?? ['unknown_error'],
      );
      throw new HumanVerificationError();
    }
  }
}
