// playerClassifiedService Tests
// Comprehensive testing of the PlayerClassifieds API service layer

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { playerClassifiedService } from '../playerClassifiedService';
import { axiosInstance } from '../../utils/axiosConfig';
import {
  createMockPlayersWanted,
  createMockTeamsWanted,
  createMockPlayersWantedServiceResponse,
  createMockTeamsWantedServiceResponse,
  createMockSearchResults,
  createMockMatches,
  createMockEmailVerificationResult,
  createMockAdminClassifiedsResponse,
  createMockAnalytics,
} from '../../test-utils/playerClassifiedsTestUtils';

// Mock axios
vi.mock('../../utils/axiosConfig', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('playerClassifiedService', () => {
  const accountId = 'test-account-1';
  const mockAuthToken = 'mock-auth-token';

  const mockAxios = axiosInstance as typeof axiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage to return auth token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => mockAuthToken),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Reset axios mocks
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockAxios.put.mockReset();
    mockAxios.delete.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAxiosResponse = (data: unknown, status = 200) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  });

  const mockAxiosError = (message: string, status = 500) => {
    const error = new Error(message) as Error & {
      response?: {
        data: { message: string };
        status: number;
        statusText: string;
      };
    };
    error.response = {
      data: { message },
      status,
      statusText: status === 404 ? 'Not Found' : status === 400 ? 'Bad Request' : 'Error',
    };
    return error;
  };

  // ============================================================================
  // PLAYERS WANTED CRUD TESTS
  // ============================================================================

  describe('Players Wanted CRUD Operations', () => {
    describe('createPlayersWanted', () => {
      it('should create players wanted successfully', async () => {
        const mockResponse = createMockPlayersWanted();
        mockAxios.post.mockResolvedValue(mockAxiosResponse({ data: mockResponse }));

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        const result = await playerClassifiedService.createPlayersWanted(
          accountId,
          createData,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
          createData,
        );
      });

      it('should handle creation errors gracefully', async () => {
        mockAxios.post.mockRejectedValue(mockAxiosError('Bad Request', 400));

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.createPlayersWanted(accountId, createData, mockAuthToken),
        ).rejects.toThrow('Bad Request');
      });

      it('should handle network errors', async () => {
        mockAxios.post.mockRejectedValue(mockAxiosError('Network Error'));

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.createPlayersWanted(accountId, createData, mockAuthToken),
        ).rejects.toThrow('Network Error');
      });
    });

    describe('getPlayersWanted', () => {
      it('should fetch players wanted successfully', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(3);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

        const result = await playerClassifiedService.getPlayersWanted(accountId);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
        );
      });

      it('should fetch players wanted with search parameters', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(2);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

        const searchParams = {
          page: 2,
          limit: 10,
          searchQuery: 'pitcher',
          positions: ['pitcher', 'catcher'],
          sortBy: 'dateCreated' as const,
          sortOrder: 'desc' as const,
        };

        const result = await playerClassifiedService.getPlayersWanted(accountId, searchParams);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/players-wanted?page=2&limit=10&searchQuery=pitcher&positions=pitcher&positions=catcher&sortBy=dateCreated&sortOrder=desc`,
          ),
        );
      });

      it('should handle fetch errors gracefully', async () => {
        mockAxios.get.mockRejectedValue(mockAxiosError('Internal Server Error', 500));

        const result = await playerClassifiedService.getPlayersWanted(accountId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Internal Server Error');
      });

      it('should handle empty search parameters', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(0);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

        const result = await playerClassifiedService.getPlayersWanted(accountId, {});

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
        );
      });
    });

    describe('updatePlayersWanted', () => {
      it('should update players wanted successfully', async () => {
        const mockResponse = createMockPlayersWanted({ id: '1' });
        mockAxios.put.mockResolvedValue(mockAxiosResponse({ success: true, data: mockResponse }));

        const updateData = {
          teamEventName: 'Updated Team Name',
          description: 'Updated description',
          positionsNeeded: 'pitcher,catcher,first-base',
        };

        const result = await playerClassifiedService.updatePlayersWanted(
          accountId,
          '1',
          updateData,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.put).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted/1`),
          updateData,
        );
      });

      it('should handle update errors gracefully', async () => {
        mockAxios.put.mockRejectedValue(mockAxiosError('Not Found', 404));

        const updateData = {
          teamEventName: 'Updated Team Name',
          description: 'Updated description',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.updatePlayersWanted(accountId, '1', updateData, mockAuthToken),
        ).rejects.toThrow('Not Found');
      });
    });

    describe('deletePlayersWanted', () => {
      it('should delete players wanted successfully', async () => {
        mockAxios.delete.mockResolvedValue(mockAxiosResponse({ success: true }));

        await playerClassifiedService.deletePlayersWanted(accountId, '1', mockAuthToken);

        expect(mockAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted/1`),
        );
      });

      it('should handle deletion errors gracefully', async () => {
        mockAxios.delete.mockRejectedValue(mockAxiosError('Forbidden', 403));

        await expect(
          playerClassifiedService.deletePlayersWanted(accountId, '1', mockAuthToken),
        ).rejects.toThrow('Forbidden');
      });
    });
  });

  // ============================================================================
  // TEAMS WANTED CRUD TESTS
  // ============================================================================

  describe('Teams Wanted CRUD Operations', () => {
    describe('createTeamsWanted', () => {
      it('should create teams wanted successfully', async () => {
        const mockResponse = createMockTeamsWanted();
        mockAxios.post.mockResolvedValue(mockAxiosResponse({ data: mockResponse }));

        const createData = {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '2485550123',
          experience: 'Intermediate',
          positionsPlayed: 'pitcher,catcher',
          birthDate: new Date('2000-06-15'),
        };

        const result = await playerClassifiedService.createTeamsWanted(accountId, createData);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted`),
          createData,
        );
      });

      it('should handle creation errors gracefully', async () => {
        mockAxios.post.mockRejectedValue(mockAxiosError('Bad Request', 400));

        const createData = {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123',
          experience: 'Intermediate',
          positionsPlayed: 'pitcher,catcher',
          birthDate: new Date('2000-06-15'),
        };

        await expect(
          playerClassifiedService.createTeamsWanted(accountId, createData),
        ).rejects.toThrow('Bad Request');
      });
    });

    describe('getTeamsWanted', () => {
      it('should fetch teams wanted successfully', async () => {
        const mockResponse = createMockTeamsWantedServiceResponse(2);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

        const result = await playerClassifiedService.getTeamsWanted(
          accountId,
          undefined,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String));
      });

      it('should fetch teams wanted with search parameters', async () => {
        const mockResponse = createMockTeamsWantedServiceResponse(2);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

        const searchParams = {
          page: 1,
          limit: 15,
          searchQuery: 'experienced',
          positions: ['pitcher'],
          experience: ['advanced'],
        };

        const result = await playerClassifiedService.getTeamsWanted(
          accountId,
          searchParams,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String));
      });
    });

    describe('updateTeamsWanted', () => {
      it('should update teams wanted successfully', async () => {
        const mockResponse = createMockTeamsWanted({ id: '1' });
        mockAxios.put.mockResolvedValue(mockAxiosResponse({ success: true, data: mockResponse }));

        const updateData = {
          name: 'Updated Player Name',
          experience: 'Advanced',
          positionsPlayed: 'pitcher,catcher,outfield',
          accessCode: 'valid-access-code',
        };

        const result = await playerClassifiedService.updateTeamsWanted(accountId, '1', updateData);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.put).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted/1`),
          updateData,
        );
      });
    });

    describe('deleteTeamsWanted', () => {
      it('should delete teams wanted successfully', async () => {
        mockAxios.delete.mockResolvedValue(mockAxiosResponse({ success: true }));

        await playerClassifiedService.deleteTeamsWanted(accountId, '1');

        expect(mockAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted/1`),
          { data: {} },
        );
      });
    });
  });

  // ============================================================================
  // SEARCH AND FILTERING TESTS
  // ============================================================================

  describe('Search and Filtering', () => {
    describe('searchClassifieds', () => {
      it('should search classifieds successfully', async () => {
        const mockResponse = createMockSearchResults(4);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse));

        const searchParams = {
          searchQuery: 'experienced pitcher',
          type: 'all' as const,
          positions: ['pitcher'],
          experience: ['intermediate'],
          accountId,
        };

        const result = await playerClassifiedService.searchClassifieds(
          accountId,
          searchParams,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/search?searchQuery=experienced+pitcher&type=all&positions=pitcher&experience=intermediate&accountId=test-account-1`,
          ),
        );
      });

      it('should handle search errors gracefully', async () => {
        mockAxios.get.mockRejectedValue(mockAxiosError('Search failed', 500));

        const searchParams = {
          searchQuery: 'pitcher',
          type: 'players' as const,
          accountId,
        };

        await expect(
          playerClassifiedService.searchClassifieds(accountId, searchParams, mockAuthToken),
        ).rejects.toThrow('Search failed');
      });
    });

    describe('getMatchSuggestions', () => {
      it('should get match suggestions successfully', async () => {
        const mockResponse = createMockMatches(3);
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse));

        const result = await playerClassifiedService.getMatches(
          accountId,
          '1',
          'players-wanted',
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/players-wanted/1/matches`,
          ),
        );
      });
    });
  });

  // ============================================================================
  // EMAIL VERIFICATION TESTS
  // ============================================================================

  describe('Email Verification', () => {
    describe('verifyEmail', () => {
      it('should verify email successfully', async () => {
        const mockResponse = createMockEmailVerificationResult();
        mockAxios.post.mockResolvedValue(mockAxiosResponse(mockResponse));

        const verificationData = {
          classifiedId: '1',
          email: 'test@example.com',
          accessCode: 'valid-access-code',
        };

        const result = await playerClassifiedService.verifyEmail(verificationData);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/verify-email`),
          verificationData,
        );
      });

      it('should handle verification errors gracefully', async () => {
        mockAxios.post.mockRejectedValue(mockAxiosError('Invalid access code', 400));

        const verificationData = {
          classifiedId: '1',
          email: 'test@example.com',
          accessCode: 'invalid-access-code',
        };

        await expect(playerClassifiedService.verifyEmail(verificationData)).rejects.toThrow(
          'Invalid access code',
        );
      });
    });
  });

  // ============================================================================
  // ADMIN OPERATIONS TESTS
  // ============================================================================

  describe('Admin Operations', () => {
    describe('getAdminClassifieds', () => {
      it('should get admin classifieds successfully', async () => {
        const mockResponse = createMockAdminClassifiedsResponse();
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse));

        const result = await playerClassifiedService.getAdminClassifieds(accountId, mockAuthToken);

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`/api/admin/accounts/${accountId}/player-classifieds`),
        );
      });
    });
  });

  // ============================================================================
  // ANALYTICS TESTS
  // ============================================================================

  describe('Analytics', () => {
    describe('getClassifiedsAnalytics', () => {
      it('should get analytics successfully', async () => {
        const mockResponse = createMockAnalytics();
        mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse));

        const result = await playerClassifiedService.getAnalytics(
          accountId,
          undefined,
          mockAuthToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/analytics`),
        );
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors consistently', async () => {
      mockAxios.get.mockRejectedValue(mockAxiosError('Network error'));

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle HTTP error responses', async () => {
      mockAxios.get.mockRejectedValue(mockAxiosError('Not Found', 404));

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not Found');
    });

    it('should handle malformed JSON responses', async () => {
      const error = new Error('Invalid JSON');
      mockAxios.get.mockRejectedValue(error);

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle missing auth token gracefully', async () => {
      // Mock localStorage to return null for auth token
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // ============================================================================
  // URL CONSTRUCTION TESTS
  // ============================================================================

  describe('URL Construction', () => {
    it('should construct correct API URLs', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      await playerClassifiedService.getPlayersWanted(accountId);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
      );
    });

    it('should handle URL encoding correctly', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const searchParams = {
        searchQuery: 'pitcher & catcher',
        positions: ['first-base', 'outfield (left)'],
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'searchQuery=pitcher+%26+catcher&positions=first-base&positions=outfield+%28left%29',
        ),
      );
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Considerations', () => {
    it('should handle large data sets efficiently', async () => {
      const largeResponse = createMockPlayersWantedServiceResponse(1000);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(largeResponse.data!));

      const startTime = performance.now();

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toEqual(largeResponse);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const startTime = performance.now();

      const promises = Array.from({ length: 10 }, () =>
        playerClassifiedService.getPlayersWanted(accountId),
      );

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(200); // Should complete in < 200ms
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long account IDs', async () => {
      const longAccountId = 'a'.repeat(1000);
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const result = await playerClassifiedService.getPlayersWanted(longAccountId);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${longAccountId}/player-classifieds/players-wanted`),
      );
    });

    it('should handle special characters in search parameters', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const searchParams = {
        searchQuery: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        positions: ['position-with-dash', 'position_with_underscore'],
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'searchQuery=%21%40%23%24%25%5E%26*%28%29_%2B-%3D%5B%5D%7B%7D%7C%3B%3A%2C.%3C%3E%3F&positions=position-with-dash&positions=position_with_underscore',
        ),
      );
    });

    it('should handle empty and null values in search parameters', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockAxios.get.mockResolvedValue(mockAxiosResponse(mockResponse.data!));

      const searchParams = {
        searchQuery: '',
        positions: [],
        experience: [],
        sortBy: undefined,
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
      );
    });
  });
});
