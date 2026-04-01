import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GolfPlayerDetailedStatsType } from '@draco/shared-schemas';

const mockApiGet = vi.fn();

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({
    get: mockApiGet,
  })),
}));

import PlayerStatsDetailPanel from '../PlayerStatsDetailPanel';

const makeStats = (
  overrides: Partial<GolfPlayerDetailedStatsType> = {},
): GolfPlayerDetailedStatsType => ({
  contactId: 'contact-1',
  firstName: 'John',
  lastName: 'Doe',
  roundsPlayed: 10,
  lowActualScore: 78,
  highActualScore: 95,
  averageScore: 84.5,
  scoreTypeCounts: {
    aces: 0,
    eagles: 1,
    birdies: 14,
    pars: 62,
    bogeys: 55,
    doubleBogeys: 18,
    triplesOrWorse: 5,
  },
  maxBirdiesInRound: 4,
  maxParsInRound: 12,
  maxBogeyPlusInRound: 2,
  puttStats: undefined,
  fairwayStats: undefined,
  girStats: undefined,
  holeTypeStats: undefined,
  consistencyStdDev: undefined,
  scramblingPercentage: undefined,
  ...overrides,
});

describe('PlayerStatsDetailPanel', () => {
  const defaultProps = {
    accountId: 'account-1',
    contactId: 'contact-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner initially while the API call is pending', () => {
      mockApiGet.mockReturnValue(new Promise(() => {}));

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });

    it('hides the loading spinner after data loads', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats(), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(document.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
      });
    });
  });

  describe('successful data display', () => {
    it('displays low score stat card', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ lowActualScore: 78 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Low Score')).toBeInTheDocument();
      });
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('displays high score stat card', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ highActualScore: 95 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('High Score')).toBeInTheDocument();
      });
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('displays average score formatted to one decimal', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ averageScore: 84.5 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Avg Score')).toBeInTheDocument();
      });
      expect(screen.getByText('84.5')).toBeInTheDocument();
    });

    it('displays rounds played stat card', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ roundsPlayed: 10 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Rounds Played')).toBeInTheDocument();
      });
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('score type distribution table', () => {
    it('renders Score Type Distribution table heading', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats(), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Score Type Distribution')).toBeInTheDocument();
      });
    });

    it('displays birdie count from score type data', async () => {
      mockApiGet.mockResolvedValue({
        data: makeStats({
          scoreTypeCounts: {
            aces: 0,
            eagles: 0,
            birdies: 7,
            pars: 50,
            bogeys: 60,
            doubleBogeys: 20,
            triplesOrWorse: 3,
          },
        }),
        error: null,
      });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Birdies')).toBeInTheDocument();
      });
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('displays each score type row: Aces, Eagles, Birdies, Pars, Bogeys, Double Bogeys, Triples+', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats(), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Aces')).toBeInTheDocument();
      });

      expect(screen.getByText('Eagles')).toBeInTheDocument();
      expect(screen.getByText('Birdies')).toBeInTheDocument();
      expect(screen.getByText('Pars')).toBeInTheDocument();
      expect(screen.getByText('Bogeys')).toBeInTheDocument();
      expect(screen.getByText('Double Bogeys')).toBeInTheDocument();
      expect(screen.getByText('Triples+')).toBeInTheDocument();
    });
  });

  describe('per-round records', () => {
    it('displays most birdies in a round', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ maxBirdiesInRound: 4 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Most Birdies in a Round')).toBeInTheDocument();
      });
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    });

    it('displays most pars in a round', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ maxParsInRound: 12 }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Most Pars in a Round')).toBeInTheDocument();
      });
      expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    });
  });

  describe('optional stats sections', () => {
    it('shows Putt Stats section when puttStats is present', async () => {
      mockApiGet.mockResolvedValue({
        data: makeStats({
          puttStats: { totalPutts: 312, averagePerRound: 31.2, bestRound: 26, worstRound: 38 },
        }),
        error: null,
      });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Putt Stats')).toBeInTheDocument();
      });
      expect(screen.getByText('Avg Putts/Round')).toBeInTheDocument();
      expect(screen.getByText('31.2')).toBeInTheDocument();
    });

    it('does not show Putt Stats section when puttStats is undefined', async () => {
      mockApiGet.mockResolvedValue({ data: makeStats({ puttStats: undefined }), error: null });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Putt Stats')).not.toBeInTheDocument();
      });
    });

    it('shows Fairway Stats section when fairwayStats is present', async () => {
      mockApiGet.mockResolvedValue({
        data: makeStats({
          fairwayStats: { averagePercentage: 0.62, bestPercentage: 0.85, worstPercentage: 0.3 },
        }),
        error: null,
      });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Fairway Stats')).toBeInTheDocument();
      });
    });

    it('shows GIR Stats section when girStats is present', async () => {
      mockApiGet.mockResolvedValue({
        data: makeStats({
          girStats: { averagePercentage: 0.45, bestPercentage: 0.72, worstPercentage: 0.1 },
        }),
        error: null,
      });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('GIR Stats')).toBeInTheDocument();
      });
    });

    it('shows Consistency section when consistencyStdDev is defined', async () => {
      mockApiGet.mockResolvedValue({
        data: makeStats({ consistencyStdDev: 3.45 }),
        error: null,
      });

      render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Consistency')).toBeInTheDocument();
      });
      expect(screen.getByText('3.45')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders nothing when API returns an error object', async () => {
      mockApiGet.mockResolvedValue({ data: undefined, error: { message: 'Not found' } });

      const { container } = render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when API error has no message', async () => {
      mockApiGet.mockResolvedValue({ data: undefined, error: {} });

      const { container } = render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when the API call throws', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      const { container } = render(<PlayerStatsDetailPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      expect(container.innerHTML).toBe('');
    });
  });

  describe('empty/no data state', () => {
    it('renders nothing when accountId is empty (effect skipped)', () => {
      const { container } = render(<PlayerStatsDetailPanel accountId="" contactId="contact-1" />);

      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when contactId is empty (effect skipped)', () => {
      const { container } = render(<PlayerStatsDetailPanel accountId="account-1" contactId="" />);

      expect(container.innerHTML).toBe('');
    });
  });
});
