// PlayerClassifieds Interfaces for Draco Sports Manager
// Follows existing interface patterns and naming conventions

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

// Base interface for Players Wanted classifieds (database representation)
export interface IPlayersWantedClassified {
  id: bigint;
  accountId: bigint;
  dateCreated: string | null;
  createdByContactId: bigint;
  teamEventName: string;
  description: string;
  positionsNeeded: string;
}

// Base interface for Teams Wanted classifieds
export interface ITeamsWantedClassified {
  id: bigint;
  accountId: bigint;
  dateCreated: string | null;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  accessCode: string; // UUID for editing
  birthDate: string | null;
}

// ============================================================================
// INPUT VALIDATION INTERFACES
// ============================================================================

// Players Wanted creation request
export interface IPlayersWantedCreateRequest {
  teamEventName: string;
  description: string;
  positionsNeeded: string;
}

// Teams Wanted creation request (anonymous/public)
export interface ITeamsWantedCreateRequest {
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  birthDate: string;
}

// Update request for Players Wanted
export interface IPlayersWantedUpdateRequest {
  teamEventName?: string;
  description?: string;
  positionsNeeded?: string;
}

// Update request for Teams Wanted (requires access code)
export interface ITeamsWantedUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  positionsPlayed?: string;
  birthDate?: string;
  // Access code for security
  accessCode: string;
}

// Contact creator request (anonymous/public)
export interface IContactCreatorRequest {
  senderName: string;
  senderEmail: string;
  message: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

// Base response for classified listings
export interface IClassifiedListResponse<T> {
  data: T[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
  filters: IClassifiedSearchFilters;
}

// Players Wanted response with creator details (transformed for API response)
export interface IPlayersWantedResponse {
  id: string; // Converted from database bigint to string for frontend
  accountId: string;
  dateCreated: string | null;
  createdByContactId: string;
  teamEventName: string;
  description: string;
  positionsNeeded: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
  account: {
    id: string;
    name: string;
  };
}

// Teams Wanted response (authenticated account members - transformed for API response)
// Teams Wanted response (public view without contact info - enhanced security)
export interface ITeamsWantedPublicResponse {
  id: string; // Converted from database bigint to string for frontend
  accountId: string;
  dateCreated: string | null;
  name: string;
  // email: excluded for privacy/security
  // phone: excluded for privacy/security
  experience: string;
  positionsPlayed: string;
  birthDate: string | null;
  // accessCode never included for security
  account: {
    id: string;
    name: string;
  };
}

export interface ITeamsWantedResponse {
  id: string; // Converted from database bigint to string for frontend
  accountId: string;
  dateCreated: string | null;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  birthDate: string | null;
  // accessCode never included for security
  account: {
    id: string;
    name: string;
  };
}

// Teams Wanted response (owner view without access code for security - transformed for API response)
export interface ITeamsWantedOwnerResponse {
  id: string; // Converted from database bigint to string for frontend
  accountId: string;
  dateCreated: string | null;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  birthDate: string | null;
  // accessCode never included for security
  account: {
    id: string;
    name: string;
  };
}

// ============================================================================
// SEARCH AND FILTERING INTERFACES
// ============================================================================

// Search parameters for classifieds
export interface IClassifiedSearchParams {
  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'dateCreated' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Type filtering
  type?: 'players' | 'teams' | 'all';

  // Content filtering
  searchQuery?: string;
  positions?: string[];
  experience?: string[];

  // Date filtering
  dateFrom?: Date;
  dateTo?: Date;

  // Account context
  accountId: bigint;
}

// Search filters applied to results
export interface IClassifiedSearchFilters {
  type: 'players' | 'teams' | 'all';
  positions: string[];
  experience: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  searchQuery: string | null;
}

// Search result with relevance scoring
export interface IClassifiedSearchResult {
  classified: IPlayersWantedResponse | ITeamsWantedResponse;
  relevanceScore: number;
  matchReasons: string[];
}

// ============================================================================
// MATCHING ALGORITHM INTERFACES
// ============================================================================

// Match suggestion between Players Wanted and Teams Wanted
export interface IClassifiedMatch {
  playersWantedId: bigint;
  teamsWantedId: bigint;
  matchScore: number; // 0.0 to 1.0
  matchReasons: string[];
  positionMatch: boolean;
  experienceMatch: boolean;
  availabilityMatch: boolean;
  proximityMatch: boolean;
}

// Match notification request
export interface IMatchNotificationRequest {
  matchId: string;
  playersWantedId: bigint;
  teamsWantedId: bigint;
  notificationType: 'immediate' | 'daily' | 'weekly';
  recipientEmails: string[];
}

// ============================================================================
// EMAIL NOTIFICATION INTERFACES
// ============================================================================

// Email verification for Teams Wanted
export interface IEmailVerificationRequest {
  classifiedId: bigint;
  email: string;
  accessCode: string;
}

// Email verification result
export interface IEmailVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  accessCode?: string;
}

// Notification preferences
export interface INotificationPreferences {
  matchNotifications: boolean;
  weeklyDigest: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
}

// ============================================================================
// ADMIN AND MODERATION INTERFACES
// ============================================================================

// Admin view of all classifieds
export interface IAdminClassifiedsResponse {
  playersWanted: Array<IPlayersWantedResponse & { isFlagged: boolean; flagReason?: string }>;
  teamsWanted: Array<ITeamsWantedResponse & { isFlagged: boolean; flagReason?: string }>;
  total: number;
  flagged: number;
}

// Admin action request
export interface IAdminActionRequest {
  classifiedId: bigint;
  classifiedType: 'players' | 'teams';
  action: 'flag' | 'delete';
  reason?: string;
}

// ============================================================================
// ANALYTICS AND REPORTING INTERFACES
// ============================================================================

// Usage analytics for an account
export interface IClassifiedAnalytics {
  totalClassifieds: number;
  totalViews: number;
  popularPositions: Array<{
    position: string;
    count: number;
    percentage: number;
  }>;
  postingTrends: Array<{
    date: Date;
    newClassifieds: number;
  }>;
  matchSuccessRate: number;
}

// Performance metrics
export interface IClassifiedPerformanceMetrics {
  searchResponseTime: number;
  averageLoadTime: number;
  cacheHitRate: number;
  databaseQueryCount: number;
  activeUsers: number;
}

// ============================================================================
// VALIDATION AND ERROR INTERFACES
// ============================================================================

// Validation error details
export interface IClassifiedValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

// Validation result
export interface IClassifiedValidationResult {
  isValid: boolean;
  errors: IClassifiedValidationError[];
  warnings: IClassifiedValidationError[];
}

// Rate limiting information
export interface IRateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// ============================================================================
// UTILITY AND HELPER INTERFACES
// ============================================================================

// Baseball position constants
export interface IBaseballPosition {
  id: string;
  name: string;
  category: 'pitching' | 'infield' | 'outfield' | 'catching' | 'utility';
  abbreviation: string;
}

// Experience level constants
export interface IExperienceLevel {
  id: string;
  name: string;
  description: string;
  yearsRequired: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Access code security info
export interface IAccessCodeInfo {
  hashedCode: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date | null;
  useCount: number;
}
