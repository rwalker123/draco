// PlayerClassifieds Test Utilities
// Centralized test data and utilities following DRY principles

import { vi } from 'vitest';
import {
  IPlayersWantedResponse,
  ITeamsWantedResponse,
  IClassifiedListResponse,
  IClassifiedSearchParams,
  IClassifiedSearchResult,
  IClassifiedMatch,
  IEmailVerificationResult,
  IAdminClassifiedsResponse,
  IClassifiedAnalytics,
  IServiceResponse,
} from '../types/playerClassifieds';
import { AuthContextType } from '../context/AuthContext';
import { AccountContextType } from '../context/AccountContext';
import { RoleContextType } from '../context/RoleContext';

// Union type for all possible API response types
type ApiResponseType =
  | IPlayersWantedResponse
  | ITeamsWantedResponse
  | IClassifiedListResponse<IPlayersWantedResponse>
  | IClassifiedListResponse<ITeamsWantedResponse>
  | IClassifiedListResponse<IClassifiedSearchResult>
  | IClassifiedMatch[]
  | IEmailVerificationResult
  | IAdminClassifiedsResponse
  | IClassifiedAnalytics
  | { success: boolean }
  | Record<string, unknown>;

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

export const createMockPlayersWanted = (
  overrides: Partial<IPlayersWantedResponse> = {},
): IPlayersWantedResponse => ({
  id: '1',
  accountId: '1',
  dateCreated: new Date('2024-01-15'),
  createdByContactId: '1',
  teamEventName: 'Spring Training Team',
  description: 'Looking for dedicated players for spring training season',
  positionsNeeded: 'pitcher,catcher,first-base',
  creator: {
    id: 'creator-1',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: '/1/contact-photos/creator-1-photo.png',
  },
  account: {
    id: '1',
    name: 'Test Baseball Club',
  },
  ...overrides,
});

export const createMockTeamsWanted = (
  overrides: Partial<ITeamsWantedResponse> = {},
): ITeamsWantedResponse => ({
  id: '1',
  accountId: '1',
  dateCreated: new Date('2024-01-15'),
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '2485550123',
  experience: 'Intermediate player with 3 years experience',
  positionsPlayed: 'pitcher,outfield',
  birthDate: new Date('2000-06-15'),
  account: {
    id: '1',
    name: 'Test Baseball Club',
  },
  ...overrides,
});

export const createMockSearchParams = (
  overrides: Partial<IClassifiedSearchParams> = {},
): IClassifiedSearchParams => ({
  page: 1,
  limit: 20,
  searchQuery: '',
  positions: [],
  experience: [],
  sortBy: 'dateCreated',
  sortOrder: 'desc',
  type: 'all',
  accountId: 'test-account-1',
  ...overrides,
});

// ============================================================================
// MOCK SERVICE RESPONSES
// ============================================================================

export const createMockPlayersWantedList = (
  count: number = 3,
): IClassifiedListResponse<IPlayersWantedResponse> => ({
  data: Array.from({ length: count }, (_, index) =>
    createMockPlayersWanted({
      id: `${index + 1}`,
      accountId: `${index + 1}`,
    }),
  ),
  total: count,
  pagination: {
    page: 1,
    limit: 20,
    hasNext: count > 20,
    hasPrev: false,
    totalPages: Math.ceil(count / 20),
  },
  filters: {
    type: 'players',
    positions: [],
    experience: [],
    dateRange: { from: null, to: null },
    searchQuery: null,
  },
});

// New utility function for service responses
export const createMockPlayersWantedServiceResponse = (
  count: number = 3,
): IServiceResponse<IClassifiedListResponse<IPlayersWantedResponse>> => ({
  success: true,
  data: createMockPlayersWantedList(count),
});

export const createMockTeamsWantedList = (
  count: number = 3,
): IClassifiedListResponse<ITeamsWantedResponse> => ({
  data: Array.from({ length: count }, (_, index) =>
    createMockTeamsWanted({
      id: `${index + 1}`,
      accountId: `${index + 1}`,
    }),
  ),
  total: count,
  pagination: {
    page: 1,
    limit: 20,
    hasNext: count > 20,
    hasPrev: false,
    totalPages: Math.ceil(count / 20),
  },
  filters: {
    type: 'teams',
    positions: [],
    experience: [],
    dateRange: { from: null, to: null },
    searchQuery: null,
  },
});

// New utility function for service responses
export const createMockTeamsWantedServiceResponse = (
  count: number = 3,
): IServiceResponse<IClassifiedListResponse<ITeamsWantedResponse>> => ({
  success: true,
  data: createMockTeamsWantedList(count),
});

export const createMockSearchResults = (
  count: number = 3,
): IClassifiedListResponse<IClassifiedSearchResult> => ({
  data: Array.from({ length: count }, (_, index) => ({
    classified:
      index % 2 === 0
        ? createMockPlayersWanted({ id: `${index + 1}` })
        : createMockTeamsWanted({ id: `${index + 1}` }),
    relevanceScore: 0.8 + index * 0.1,
    matchReasons: [`Reason ${index + 1}`],
  })),
  total: count,
  pagination: {
    page: 1,
    limit: 20,
    hasNext: count > 20,
    hasPrev: false,
    totalPages: Math.ceil(count / 20),
  },
  filters: {
    type: 'all',
    positions: [],
    experience: [],
    dateRange: { from: null, to: null },
    searchQuery: null,
  },
});

export const createMockMatches = (count: number = 3): IClassifiedMatch[] =>
  Array.from({ length: count }, (_, index) => ({
    playersWantedId: `players-${index + 1}`,
    teamsWantedId: `teams-${index + 1}`,
    matchScore: 0.7 + index * 0.1,
    matchReasons: [`Match reason ${index + 1}`],
    positionMatch: index % 2 === 0,
    experienceMatch: index % 2 === 0,
    availabilityMatch: true,
    proximityMatch: index % 2 === 0,
  }));

export const createMockEmailVerificationResult = (): IEmailVerificationResult => ({
  success: true,
  verified: true,
  message: 'Email verified successfully',
});

export const createMockAdminClassifiedsResponse = (): IAdminClassifiedsResponse => ({
  playersWanted: Array.from({ length: 5 }, (_, index) => ({
    ...createMockPlayersWanted({ id: `${index + 1}` }),
    isFlagged: false,
  })),
  teamsWanted: Array.from({ length: 5 }, (_, index) => ({
    ...createMockTeamsWanted({ id: `${index + 1}` }),
    isFlagged: false,
  })),
  total: 10,
  flagged: 0,
});

export const createMockAnalytics = (): IClassifiedAnalytics => ({
  totalClassifieds: 50,
  totalViews: 1250,
  popularPositions: [
    { position: 'pitcher', count: 15, percentage: 30 },
    { position: 'catcher', count: 10, percentage: 20 },
    { position: 'first-base', count: 8, percentage: 16 },
  ],
  postingTrends: [
    { date: new Date('2024-01-01'), newClassifieds: 5 },
    { date: new Date('2024-01-02'), newClassifieds: 3 },
    { date: new Date('2024-01-03'), newClassifieds: 7 },
  ],
  matchSuccessRate: 0.75,
});

// ============================================================================
// MOCK CONTEXT PROVIDERS
// ============================================================================

export const createMockAuthContext = (overrides: Partial<AuthContextType> = {}) => {
  const defaultContext: AuthContextType = {
    user: {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    },
    token: 'mock-token',
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    fetchUser: vi.fn(),
    setAuthToken: vi.fn(),
    clearAllContexts: vi.fn(),
  };

  return { ...defaultContext, ...overrides };
};

export const createMockAccountContext = (overrides: Partial<AccountContextType> = {}) => {
  const defaultContext: AccountContextType = {
    currentAccount: {
      id: '1',
      name: 'Test Baseball Club',
      accountType: 'baseball',
    },
    userAccounts: [],
    loading: false,
    error: null,
    setCurrentAccount: vi.fn(),
    clearAccounts: vi.fn(),
  };

  return { ...defaultContext, ...overrides };
};

export const createMockRoleContext = (overrides: Partial<RoleContextType> = {}) => {
  const defaultContext: RoleContextType = {
    userRoles: {
      accountId: '1',
      globalRoles: ['TeamAdmin'],
      contactRoles: [
        {
          id: '1',
          roleId: 'role-1',
          roleName: 'TeamAdmin',
          roleData: '{}',
        },
      ],
    },
    loading: false,
    error: null,
    hasRole: vi.fn(),
    hasPermission: vi.fn(),
    hasRoleInAccount: vi.fn(),
    hasRoleInTeam: vi.fn(),
    hasRoleInLeague: vi.fn(),
    fetchUserRoles: vi.fn(),
    clearRoles: vi.fn(),
  };

  let mergedUserRoles: RoleContextType['userRoles'] = defaultContext.userRoles;

  if (Object.prototype.hasOwnProperty.call(overrides, 'userRoles')) {
    const overrideUserRoles = overrides.userRoles;

    if (overrideUserRoles && overrideUserRoles !== null) {
      mergedUserRoles = {
        accountId: overrideUserRoles.accountId ?? defaultContext.userRoles?.accountId ?? '1',
        globalRoles: overrideUserRoles.globalRoles ?? defaultContext.userRoles?.globalRoles ?? [],
        contactRoles:
          overrideUserRoles.contactRoles ?? defaultContext.userRoles?.contactRoles ?? [],
      };
    } else {
      // preserve explicit null/undefined override value
      mergedUserRoles = overrideUserRoles as RoleContextType['userRoles'];
    }
  }

  const context: RoleContextType = {
    ...defaultContext,
    ...overrides,
    userRoles: mergedUserRoles,
  };

  // Override hasRole to use the actual userRoles from the context
  context.hasRole = (roleId: string) => {
    if (!context.userRoles) return false;
    return (
      context.userRoles.globalRoles.includes(roleId) ||
      context.userRoles.contactRoles.some((role) => role.roleName === roleId)
    );
  };

  // Override hasRoleInAccount to use the actual userRoles from the context
  context.hasRoleInAccount = (roleId: string, accountId: string) => {
    if (!context.userRoles) return false;
    return context.userRoles.contactRoles.some(
      (role) => role.roleName === roleId && context.userRoles?.accountId === accountId,
    );
  };

  return context;
};

// ============================================================================
// MOCK SERVICE FUNCTIONS
// ============================================================================

export const createMockPlayerClassifiedService = () => ({
  createPlayersWanted: vi.fn(),
  getPlayersWanted: vi.fn(),
  getPlayersWantedById: vi.fn(),
  updatePlayersWanted: vi.fn(),
  deletePlayersWanted: vi.fn(),
  createTeamsWanted: vi.fn(),
  getTeamsWanted: vi.fn(),
  getTeamsWantedById: vi.fn(),
  getTeamsWantedOwnerById: vi.fn(),
  updateTeamsWanted: vi.fn(),
  deleteTeamsWanted: vi.fn(),
  searchClassifieds: vi.fn(),
  getSearchSuggestions: vi.fn(),
  getMatchSuggestions: vi.fn(),
  verifyEmail: vi.fn(),
  getAdminClassifieds: vi.fn(),
  getClassifiedsAnalytics: vi.fn(),
});

export const createMockNotificationsHook = () => ({
  showNotification: vi.fn(),
  clearNotification: vi.fn(),
});

// ============================================================================
// TEST HELPERS
// ============================================================================

export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to complete
  await new Promise((resolve) => setTimeout(resolve, 0));
};

export const createTestProps = <T extends Record<string, unknown>>(
  defaultProps: T,
  overrides: Partial<T> = {},
): T => ({
  ...defaultProps,
  ...overrides,
});

export const mockFetchResponse = (response: ApiResponseType, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

export const mockFetchError = (error: string, status: number = 500) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: error,
    json: async () => ({ error }),
    text: async () => error,
  });
};

// ============================================================================
// COMMON TEST SETUP
// ============================================================================

export const setupPlayerClassifiedsTest = () => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(() => 'mock-auth-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export const expectComponentToRender = (component: React.ReactElement) => {
  expect(component).toBeDefined();
  expect(component).not.toBeNull();
};

export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectButtonToBeEnabled = (button: HTMLElement | null) => {
  expect(button).toBeEnabled();
  expect(button).not.toBeDisabled();
};

export const expectButtonToBeDisabled = (button: HTMLElement | null) => {
  expect(button).toBeDisabled();
  expect(button).not.toBeEnabled();
};
