// Access Code Types and Interfaces
// Centralized types for access code management and validation

// ============================================================================
// ACCESS CODE VERIFICATION INTERFACES
// ============================================================================

// Request to verify an access code for Teams Wanted
export interface IAccessCodeVerificationRequest {
  accountId: string;
  accessCode: string;
}

// Response from access code verification
export interface IAccessCodeVerificationResponse {
  success: boolean;
  classified?: ITeamsWantedClassified;
  message?: string;
  errorCode?: string;
}

// Teams Wanted classified data returned for access code verification
export interface ITeamsWantedClassified {
  id: string;
  accountId: string;
  dateCreated: Date | string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  birthDate: Date | string;
  // Note: accessCode is never included in responses for security
}

// ============================================================================
// ACCESS CODE INPUT COMPONENT INTERFACES
// ============================================================================

// Props for the AccessCodeInput component
export interface IAccessCodeInputProps {
  accountId: string;
  onSubmit: (accessCode: string) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
}

// Access code input state
export interface IAccessCodeInputState {
  value: string;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastAttempt: Date | null;
}

// ============================================================================
// ACCESS CODE VALIDATION INTERFACES
// ============================================================================

// Validation result for access codes
export interface IAccessCodeValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

// Rate limiting information
export interface IAccessCodeRateLimitInfo {
  attemptsRemaining: number;
  resetTime: Date;
  isBlocked: boolean;
}

// ============================================================================
// ACCESS CODE SECURITY INTERFACES
// ============================================================================

// Security event for access code operations
export interface IAccessCodeSecurityEvent {
  timestamp: Date;
  accountId: string;
  accessCodeHash: string; // Hashed for security
  operation: 'verification_attempt' | 'verification_success' | 'verification_failure';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorCode?: string;
}

// Access code verification attempt tracking
export interface IAccessCodeAttemptTracking {
  accountId: string;
  attempts: number;
  lastAttempt: Date;
  isBlocked: boolean;
  blockExpiry?: Date;
}
