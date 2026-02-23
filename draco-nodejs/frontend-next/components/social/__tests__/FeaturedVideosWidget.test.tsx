import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import FeaturedVideosWidget from '../FeaturedVideosWidget';
import { dracoTheme } from '../../../theme';
import type { SocialVideoType } from '@draco/shared-schemas';

const mockFetchVideos = vi.fn();

vi.mock('@/hooks/useSocialHubService', () => ({
  useSocialHubService: () => ({
    fetchVideos: mockFetchVideos,
    fetchFeed: vi.fn(),
    fetchCommunityMessages: vi.fn(),
    fetchCommunityChannels: vi.fn(),
    deleteFeedItem: vi.fn(),
    restoreFeedItem: vi.fn(),
  }),
}));

vi.mock('@/utils/emailUtils', () => ({
  truncateText: (text: string) => text,
}));

vi.mock('../SocialVideoCard', () => ({
  default: ({ video }: { video: SocialVideoType }) => (
    <div data-testid="social-video-card">{video.title}</div>
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const createMockVideo = (id: string): SocialVideoType => ({
  id,
  accountId: '1',
  source: 'youtube',
  title: `Video ${id}`,
  description: `Description for video ${id}`,
  thumbnailUrl: `https://example.com/thumb/${id}.jpg`,
  videoUrl: `https://youtube.com/watch?v=${id}`,
  isLive: false,
  publishedAt: new Date().toISOString(),
});

const renderWidget = (props: React.ComponentProps<typeof FeaturedVideosWidget> = {}) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <FeaturedVideosWidget {...props} />
    </ThemeProvider>,
  );

describe('FeaturedVideosWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('missing context', () => {
    it('shows info alert when accountId and seasonId are not provided', () => {
      renderWidget();

      expect(
        screen.getByText('Select an account and season to load social videos.'),
      ).toBeInTheDocument();
    });

    it('does not call fetchVideos when accountId is missing', () => {
      renderWidget({ seasonId: 'sea-1' });

      expect(mockFetchVideos).not.toHaveBeenCalled();
    });

    it('does not call fetchVideos when seasonId is missing', () => {
      renderWidget({ accountId: 'acc-1' });

      expect(mockFetchVideos).not.toHaveBeenCalled();
    });
  });

  describe('loaded state with videos', () => {
    it('renders video cards when videos are returned', async () => {
      const videos = [createMockVideo('v1'), createMockVideo('v2')];
      mockFetchVideos.mockResolvedValue(videos);

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1' });

      await waitFor(() => {
        expect(screen.getAllByTestId('social-video-card')).toHaveLength(2);
      });

      expect(screen.getByText('Video v1')).toBeInTheDocument();
      expect(screen.getByText('Video v2')).toBeInTheDocument();
    });

    it('renders view all link when viewAllHref is provided and videos exist', async () => {
      mockFetchVideos.mockResolvedValue([createMockVideo('v1')]);

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1', viewAllHref: '/videos' });

      await waitFor(() => {
        expect(screen.getByText('View all videos')).toBeInTheDocument();
      });
    });

    it('does not render view all link when no videos are returned', async () => {
      mockFetchVideos.mockResolvedValue([]);

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1', viewAllHref: '/videos' });

      await waitFor(() => {
        expect(screen.getByText('No connected video streams yet.')).toBeInTheDocument();
      });

      expect(screen.queryByText('View all videos')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows info alert when no videos exist', async () => {
      mockFetchVideos.mockResolvedValue([]);

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1' });

      await waitFor(() => {
        expect(screen.getByText('No connected video streams yet.')).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('shows error alert when fetch fails', async () => {
      mockFetchVideos.mockRejectedValue(new Error('Network failure'));

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1' });

      await waitFor(() => {
        expect(screen.getByText('Network failure')).toBeInTheDocument();
      });
    });

    it('shows fallback error message when error has no message', async () => {
      mockFetchVideos.mockRejectedValue('unknown error');

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1' });

      await waitFor(() => {
        expect(screen.getByText('Unable to load social videos.')).toBeInTheDocument();
      });
    });
  });

  describe('video limit', () => {
    it('renders at most 6 videos', async () => {
      const videos = Array.from({ length: 8 }, (_, i) => createMockVideo(`v${i}`));
      mockFetchVideos.mockResolvedValue(videos);

      renderWidget({ accountId: 'acc-1', seasonId: 'sea-1' });

      await waitFor(() => {
        expect(screen.getAllByTestId('social-video-card')).toHaveLength(6);
      });
    });
  });
});
