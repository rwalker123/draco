import React from 'react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import SocialHubExperience from '../SocialHubExperience';
import { dracoTheme } from '../../../theme';

const fetchFeedMock = vi.fn();
const fetchVideosMock = vi.fn();
const fetchCommunityMessagesMock = vi.fn();
const fetchCommunityChannelsMock = vi.fn();

vi.mock('@/hooks/useSocialHubService', () => ({
  useSocialHubService: () => ({
    fetchFeed: fetchFeedMock,
    fetchVideos: fetchVideosMock,
    fetchCommunityMessages: fetchCommunityMessagesMock,
    fetchCommunityChannels: fetchCommunityChannelsMock,
  }),
}));

vi.mock('@/components/surveys/SurveySpotlightWidget', () => ({
  default: () => <div data-testid="survey-widget" />,
}));

vi.mock('@/components/hall-of-fame/HofSpotlightWidget', () => ({
  default: () => <div data-testid="hof-widget" />,
}));

vi.mock('@/components/join-league/PlayersWantedPreview', () => ({
  default: () => <div data-testid="players-widget" />,
}));

vi.mock('../FeaturedVideosWidget', () => ({
  default: () => <div data-testid="featured-videos" />,
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={dracoTheme}>{component}</ThemeProvider>);
};

describe('SocialHubExperience', () => {
  beforeEach(() => {
    fetchFeedMock.mockReset();
    fetchVideosMock.mockReset();
    fetchCommunityChannelsMock.mockReset();
    fetchCommunityMessagesMock.mockReset();
    fetchFeedMock.mockResolvedValue([]);
    fetchVideosMock.mockResolvedValue([]);
    fetchCommunityChannelsMock.mockResolvedValue([
      {
        id: 'chan-1',
        accountId: '1',
        seasonId: '1',
        discordChannelId: '999',
        name: 'general',
        label: '#general',
        scope: 'account',
        channelType: 'text',
        url: 'https://discord.com/channels/999/chan-1',
      },
    ]);
    fetchCommunityMessagesMock.mockResolvedValue([
      {
        id: 'msg-1',
        accountId: '1',
        seasonId: '1',
        teamId: null,
        teamSeasonId: null,
        channelId: 'chan-1',
        channelName: 'general',
        authorId: 'u-1',
        authorDisplayName: 'Coach Carter',
        avatarUrl: null,
        content: 'Hello there 👋',
        richContent: [
          { type: 'text', text: 'Hello there ' },
          {
            type: 'emoji',
            id: '7890',
            name: 'wave',
            url: 'https://cdn.discordapp.com/emojis/7890.png?size=64&quality=lossless',
          },
        ],
        attachments: [
          {
            type: 'image',
            url: 'https://cdn.discordapp.com/attachments/celebrate.gif',
            thumbnailUrl: 'https://cdn.discordapp.com/attachments/celebrate_thumb.gif',
          },
        ],
        postedAt: new Date().toISOString(),
        permalink: null,
      },
    ]);
  });

  it('renders discord rich content with emoji and gif attachments', async () => {
    renderWithTheme(<SocialHubExperience accountId="1" seasonId="1" isAccountMember />);

    await waitFor(() => {
      expect(fetchCommunityMessagesMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByAltText('emoji: wave')).toBeInTheDocument();
    });

    const attachmentImage = screen.getByAltText('Attachment image 1');
    expect(attachmentImage).toBeInTheDocument();
    expect(attachmentImage).toHaveAttribute(
      'src',
      'https://cdn.discordapp.com/attachments/celebrate_thumb.gif',
    );
  });
});
vi.mock('lottie-react', () => ({
  default: () => null,
}));
