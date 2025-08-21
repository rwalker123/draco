// playerClassifiedService Tests
// Comprehensive testing of the PlayerClassifieds API service layer

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { playerClassifiedService } from '../playerClassifiedService';
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
  setupPlayerClassifiedsTest,
  mockFetchResponse,
  mockFetchError,
} from '../../test-utils/playerClassifiedsTestUtils';

// ============================================================================
// TEST SUITE
// ============================================================================

describe('playerClassifiedService', () => {
  const accountId = 'test-account-1';
  const mockAuthToken = 'mock-auth-token';

  beforeEach(() => {
    setupPlayerClassifiedsTest();
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // PLAYERS WANTED CRUD TESTS
  // ============================================================================

  describe('Players Wanted CRUD Operations', () => {
    describe('createPlayersWanted', () => {
      it('should create players wanted successfully', async () => {
        const mockResponse = createMockPlayersWanted();
        mockFetchResponse(mockResponse);

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        const result = await playerClassifiedService.createPlayersWanted(accountId, createData);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockAuthToken}`,
            },
            body: JSON.stringify(createData),
          }),
        );
      });

      it('should handle creation errors gracefully', async () => {
        mockFetchError('Bad Request', 400);

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.createPlayersWanted(accountId, createData),
        ).rejects.toThrow('Failed to create Players Wanted: Bad Request');
      });

      it('should handle network errors', async () => {
        mockFetchError('Network error');

        const createData = {
          teamEventName: 'Spring Training Team',
          description: 'Looking for dedicated players',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.createPlayersWanted(accountId, createData),
        ).rejects.toThrow('Failed to create Players Wanted: Network error');
      });
    });

    describe('getPlayersWanted', () => {
      it('should fetch players wanted successfully', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(3);
        mockFetchResponse(mockResponse.data!);

        const result = await playerClassifiedService.getPlayersWanted(accountId);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
          expect.any(Object),
        );
      });

      it('should fetch players wanted with search parameters', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(2);
        mockFetchResponse(mockResponse.data!);

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
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/players-wanted?page=2&limit=10&searchQuery=pitcher&positions=pitcher&positions=catcher&sortBy=dateCreated&sortOrder=desc`,
          ),
          expect.any(Object),
        );
      });

      it('should handle fetch errors gracefully', async () => {
        mockFetchError('Internal Server Error', 500);

        const result = await playerClassifiedService.getPlayersWanted(accountId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Internal Server Error');
      });

      it('should handle empty search parameters', async () => {
        const mockResponse = createMockPlayersWantedServiceResponse(0);
        mockFetchResponse(mockResponse.data!);

        const result = await playerClassifiedService.getPlayersWanted(accountId, {});

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
          expect.any(Object),
        );
      });
    });

    describe('updatePlayersWanted', () => {
      it('should update players wanted successfully', async () => {
        const mockResponse = createMockPlayersWanted({ id: '1' });
        mockFetchResponse(mockResponse);

        const updateData = {
          teamEventName: 'Updated Team Name',
          description: 'Updated description',
          positionsNeeded: 'pitcher,catcher,first-base',
        };

        const result = await playerClassifiedService.updatePlayersWanted(
          accountId,
          '1',
          updateData,
        );

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted/1`),
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockAuthToken}`,
            },
            body: JSON.stringify(updateData),
          }),
        );
      });

      it('should handle update errors gracefully', async () => {
        mockFetchError('Not Found', 404);

        const updateData = {
          teamEventName: 'Updated Team Name',
          description: 'Updated description',
          positionsNeeded: 'pitcher,catcher',
        };

        await expect(
          playerClassifiedService.updatePlayersWanted(accountId, '1', updateData),
        ).rejects.toThrow('Failed to update Players Wanted: Not Found');
      });
    });

    describe('deletePlayersWanted', () => {
      it('should delete players wanted successfully', async () => {
        mockFetchResponse({ success: true });

        await playerClassifiedService.deletePlayersWanted(accountId, '1');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted/1`),
          expect.objectContaining({
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockAuthToken}`,
            },
          }),
        );
      });

      it('should handle deletion errors gracefully', async () => {
        mockFetchError('Forbidden', 403);

        await expect(playerClassifiedService.deletePlayersWanted(accountId, '1')).rejects.toThrow(
          'Failed to delete Players Wanted: Forbidden',
        );
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
        mockFetchResponse(mockResponse);

        const createData = {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123',
          experience: 'Intermediate',
          positionsPlayed: 'pitcher,catcher',
          birthDate: new Date('2000-06-15'),
        };

        const result = await playerClassifiedService.createTeamsWanted(accountId, createData);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted`),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockAuthToken}`,
            },
            body: JSON.stringify(createData),
          }),
        );
      });

      it('should handle creation errors gracefully', async () => {
        mockFetchError('Bad Request', 400);

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
        ).rejects.toThrow('Failed to create Teams Wanted: Bad Request');
      });
    });

    describe('getTeamsWanted', () => {
      it('should fetch teams wanted successfully', async () => {
        const mockResponse = createMockTeamsWantedServiceResponse(2);
        mockFetchResponse(mockResponse.data!);

        const result = await playerClassifiedService.getTeamsWanted(accountId);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
      });

      it('should fetch teams wanted with search parameters', async () => {
        const mockResponse = createMockTeamsWantedServiceResponse(2);
        mockFetchResponse(mockResponse.data!);

        const searchParams = {
          page: 1,
          limit: 15,
          searchQuery: 'experienced',
          positions: ['pitcher'],
          experience: ['advanced'],
        };

        const result = await playerClassifiedService.getTeamsWanted(accountId, searchParams);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
      });
    });

    describe('updateTeamsWanted', () => {
      it('should update teams wanted successfully', async () => {
        const mockResponse = createMockTeamsWanted({ id: '1' });
        mockFetchResponse(mockResponse);

        const updateData = {
          name: 'Updated Player Name',
          experience: 'Advanced',
          positionsPlayed: 'pitcher,catcher,outfield',
          accessCode: 'valid-access-code',
        };

        const result = await playerClassifiedService.updateTeamsWanted(accountId, '1', updateData);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted/1`),
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockAuthToken}`,
            },
            body: JSON.stringify(updateData),
          }),
        );
      });
    });

    describe('deleteTeamsWanted', () => {
      it('should delete teams wanted successfully', async () => {
        mockFetchResponse({ success: true });

        await playerClassifiedService.deleteTeamsWanted(accountId, '1');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/teams-wanted/1`),
          expect.objectContaining({
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockAuthToken}`,
            },
          }),
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
        mockFetchResponse(mockResponse);

        const searchParams = {
          searchQuery: 'experienced pitcher',
          type: 'all' as const,
          positions: ['pitcher'],
          experience: ['intermediate'],
          accountId,
        };

        const result = await playerClassifiedService.searchClassifieds(accountId, searchParams);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/search?searchQuery=experienced+pitcher&type=all&positions=pitcher&experience=intermediate&accountId=test-account-1`,
          ),
          expect.any(Object),
        );
      });

      it('should handle search errors gracefully', async () => {
        mockFetchError('Search failed', 500);

        const searchParams = {
          searchQuery: 'pitcher',
          type: 'players' as const,
          accountId,
        };

        await expect(
          playerClassifiedService.searchClassifieds(accountId, searchParams),
        ).rejects.toThrow('Failed to search classifieds: Search failed');
      });
    });

    describe('getMatchSuggestions', () => {
      it('should get match suggestions successfully', async () => {
        const mockResponse = createMockMatches(3);
        mockFetchResponse(mockResponse);

        const result = await playerClassifiedService.getMatches(accountId, '1', 'players-wanted');

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/accounts/${accountId}/player-classifieds/players-wanted/1/matches`,
          ),
          expect.any(Object),
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
        mockFetchResponse(mockResponse);

        const verificationData = {
          classifiedId: '1',
          email: 'test@example.com',
          accessCode: 'valid-access-code',
        };

        const result = await playerClassifiedService.verifyEmail(verificationData);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/verify-email`),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData),
          }),
        );
      });

      it('should handle verification errors gracefully', async () => {
        mockFetchError('Invalid access code', 400);

        const verificationData = {
          classifiedId: '1',
          email: 'test@example.com',
          accessCode: 'invalid-access-code',
        };

        await expect(playerClassifiedService.verifyEmail(verificationData)).rejects.toThrow(
          'Failed to verify email: Invalid access code',
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
        mockFetchResponse(mockResponse);

        const result = await playerClassifiedService.getAdminClassifieds(accountId);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/admin/accounts/${accountId}/player-classifieds`),
          expect.any(Object),
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
        mockFetchResponse(mockResponse);

        const result = await playerClassifiedService.getAnalytics(accountId);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/analytics`),
          expect.any(Object),
        );
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors consistently', async () => {
      mockFetchError('Network error');

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle HTTP error responses', async () => {
      mockFetchError('Not Found', 404);

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not Found');
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

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
      mockFetchResponse(mockResponse.data!);

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });
  });

  // ============================================================================
  // URL CONSTRUCTION TESTS
  // ============================================================================

  describe('URL Construction', () => {
    it('should construct correct API URLs', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockFetchResponse(mockResponse.data!);

      await playerClassifiedService.getPlayersWanted(accountId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
        expect.any(Object),
      );
    });

    it('should handle URL encoding correctly', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockFetchResponse(mockResponse.data!);

      const searchParams = {
        searchQuery: 'pitcher & catcher',
        positions: ['first-base', 'outfield (left)'],
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'searchQuery=pitcher+%26+catcher&positions=first-base&positions=outfield+%28left%29',
        ),
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Considerations', () => {
    it('should handle large data sets efficiently', async () => {
      const largeResponse = createMockPlayersWantedServiceResponse(1000);
      mockFetchResponse(largeResponse.data!);

      const startTime = performance.now();

      const result = await playerClassifiedService.getPlayersWanted(accountId);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toEqual(largeResponse);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockFetchResponse(mockResponse.data!);

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
      mockFetchResponse(mockResponse.data!);

      const result = await playerClassifiedService.getPlayersWanted(longAccountId);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${longAccountId}/player-classifieds/players-wanted`),
        expect.any(Object),
      );
    });

    it('should handle special characters in search parameters', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockFetchResponse(mockResponse.data!);

      const searchParams = {
        searchQuery: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        positions: ['position-with-dash', 'position_with_underscore'],
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'searchQuery=%21%40%23%24%25%5E%26*%28%29_%2B-%3D%5B%5D%7B%7D%7C%3B%3A%2C.%3C%3E%3F&positions=position-with-dash&positions=position_with_underscore',
        ),
        expect.any(Object),
      );
    });

    it('should handle empty and null values in search parameters', async () => {
      const mockResponse = createMockPlayersWantedServiceResponse(1);
      mockFetchResponse(mockResponse.data!);

      const searchParams = {
        searchQuery: '',
        positions: [],
        experience: [],
        sortBy: undefined,
      };

      await playerClassifiedService.getPlayersWanted(accountId, searchParams);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/accounts/${accountId}/player-classifieds/players-wanted`),
        expect.any(Object),
      );
    });
  });
});
