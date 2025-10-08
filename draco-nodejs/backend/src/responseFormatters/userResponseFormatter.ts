import { dbPasswordResetToken } from '../repositories/index.js';

export interface PasswordResetVerificationResponse {
  valid: boolean;
}

export class UserResponseFormatter {
  static formatPasswordResetVerification(
    token: dbPasswordResetToken | null,
  ): PasswordResetVerificationResponse {
    return { valid: token !== null };
  }
}
