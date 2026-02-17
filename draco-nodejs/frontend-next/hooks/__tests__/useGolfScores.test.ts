import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGolfPlayerLeagueScoresMock } = vi.hoisted(() => {
  const getGolfPlayerLeagueScoresMock = vi.fn();
  return { getGolfPlayerLeagueScoresMock };
});

vi.mock('@draco/shared-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@draco/shared-api-client')>();
  return {
    ...actual,
    getGolfPlayerLeagueScores: getGolfPlayerLeagueScoresMock,
  };
});

vi.mock('../useApiClient', () => ({
  useApiClient: vi.fn(() => ({ key: 'test-client' })),
}));

describe('useGolfScores', () => {
  beforeEach(() => {
    getGolfPlayerLeagueScoresMock.mockReset();
  });

  describe('getPlayerLeagueScores', () => {
    it('calls getGolfPlayerLeagueScores without seasonId in path', async () => {
      getGolfPlayerLeagueScoresMock.mockResolvedValue({
        data: {
          scores: [],
          initialDifferential: null,
          handicapIndex: null,
          isInitialIndex: false,
        },
      });

      const { useGolfScores } = await import('../useGolfScores');
      const { result } = renderHook(() => useGolfScores('25'));

      let response: Awaited<ReturnType<typeof result.current.getPlayerLeagueScores>>;
      await act(async () => {
        response = await result.current.getPlayerLeagueScores('5566');
      });

      expect(getGolfPlayerLeagueScoresMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: '25', contactId: '5566' },
        }),
      );
      expect(response!.success).toBe(true);
    });
  });
});
