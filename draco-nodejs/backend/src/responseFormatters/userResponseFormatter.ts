import { RegisteredUserSchema, RegisteredUserType } from '@draco/shared-schemas';
import { dbPasswordResetToken, dbUser } from '../repositories/index.js';
import { InternalServerError } from '../utils/customErrors.js';

export interface PasswordResetVerificationResponse {
  valid: boolean;
}

export class UserResponseFormatter {
  static formatRegisteredUserWithToken(user: dbUser, token: string): RegisteredUserType {
    if (!user.username) {
      throw new InternalServerError('User record is missing a username');
    }

    return RegisteredUserSchema.parse({
      userId: user.id,
      userName: user.username,
      token,
    });
  }

  static formatPasswordResetVerification(
    token: dbPasswordResetToken | null,
  ): PasswordResetVerificationResponse {
    return { valid: token !== null };
  }
}
