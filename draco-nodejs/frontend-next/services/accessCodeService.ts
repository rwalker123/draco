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
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';

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

      const classified = unwrapApiResult(result, 'Failed to verify access code');

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
        classified,
        message: 'Access code verified successfully',
      };
    } catch (error) {
      // Record failed attempt
      recordAttempt(accountId, false);

      let errorCode: string = 'NETWORK_ERROR';
      let message = 'Network error occurred while verifying access code';

      if (error instanceof ApiClientError) {
        message = error.message || 'Failed to verify access code';

        if (
          error.details &&
          typeof error.details === 'object' &&
          'errorCode' in error.details &&
          typeof (error.details as { errorCode?: unknown }).errorCode === 'string'
        ) {
          errorCode = (error.details as { errorCode: string }).errorCode;
        } else {
          errorCode = 'API_ERROR';
        }
      } else if (error instanceof Error) {
        message = error.message || message;
      }

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
