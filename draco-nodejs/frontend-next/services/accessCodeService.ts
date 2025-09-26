// Access Code Service
// Centralized access code management with security features

import {
  IAccessCodeVerificationResponse,
  IAccessCodeRateLimitInfo,
  IAccessCodeSecurityEvent,
  IAccessCodeAttemptTracking,
} from '../types/accessCode';

import {
  validateAccessCode,
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  getAllRateLimitTracking,
} from '../utils/accessCodeValidation';

import { getTeamsWantedByAccessCode as getTeamsWantedByAccessCodeApi } from '@draco/shared-api-client';
import { createApiClient } from '../lib/apiClientFactory';
import { getApiErrorMessage } from '../utils/apiResult';

// ============================================================================
// SECURITY LOGGING
// ============================================================================

// Log security events (in production, send to security monitoring system)
export const logSecurityEvent = (event: Omit<IAccessCodeSecurityEvent, 'timestamp'>): void => {
  const securityEvent: IAccessCodeSecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY] Access Code Event:', securityEvent);
  }

  // In production, this would send to security monitoring
  // await securityMonitoringService.logEvent(securityEvent);
};

// ============================================================================
// MAIN ACCESS CODE SERVICE
// ============================================================================

export const accessCodeService = {
  // Verify access code for Teams Wanted
  async verifyAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<IAccessCodeVerificationResponse> {
    // Validate input
    const validation = validateAccessCode(accessCode);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error,
        errorCode: 'INVALID_FORMAT',
      };
    }

    // Check rate limiting
    const rateLimitInfo = checkRateLimit(accountId);
    if (rateLimitInfo.isBlocked) {
      return {
        success: false,
        message: `Too many failed attempts. Please try again after ${new Date(rateLimitInfo.resetTime).toLocaleTimeString()}`,
        errorCode: 'RATE_LIMITED',
      };
    }

    try {
      const client = createApiClient();
      const result = await getTeamsWantedByAccessCodeApi({
        client,
        path: { accountId },
        body: { accessCode: validation.sanitizedValue ?? '' },
        throwOnError: false,
      });

      if (result.error) {
        const message = getApiErrorMessage(result.error, 'Failed to verify access code');
        const errorCode =
          typeof (result.error as { errorCode?: string }).errorCode === 'string'
            ? (result.error as { errorCode?: string }).errorCode
            : 'API_ERROR';

        // Record failed attempt
        recordAttempt(accountId, false);

        // Log security event
        logSecurityEvent({
          accountId,
          accessCodeHash: '***', // Never log actual access codes
          operation: 'verification_failure',
          success: false,
          errorCode,
        });

        return {
          success: false,
          message,
          errorCode,
        };
      }

      // Record successful attempt
      recordAttempt(accountId, true);

      // Log security event
      logSecurityEvent({
        accountId,
        accessCodeHash: '***', // Never log actual access codes
        operation: 'verification_success',
        success: true,
      });

      return {
        success: true,
        classified: result.data,
        message: 'Access code verified successfully',
      };
    } catch {
      // Record failed attempt
      recordAttempt(accountId, false);

      // Log security event
      logSecurityEvent({
        accountId,
        accessCodeHash: '***', // Never log actual access codes
        operation: 'verification_failure',
        success: false,
        errorCode: 'NETWORK_ERROR',
      });

      return {
        success: false,
        message: 'Network error occurred while verifying access code',
        errorCode: 'NETWORK_ERROR',
      };
    }
  },

  // Get rate limit information for an account
  getRateLimitInfo(accountId: string): IAccessCodeRateLimitInfo {
    return checkRateLimit(accountId);
  },

  // Reset rate limiting for an account (admin function)
  resetRateLimit(accountId: string): void {
    // This would need to be implemented in the utilities
    // For now, we'll use the utility function
    resetRateLimit(accountId);
  },

  // Get all rate limit tracking (admin function)
  getAllRateLimitTracking(): IAccessCodeAttemptTracking[] {
    // This would need to be implemented in the utilities
    // For now, we'll use the utility function
    return getAllRateLimitTracking();
  },
};
