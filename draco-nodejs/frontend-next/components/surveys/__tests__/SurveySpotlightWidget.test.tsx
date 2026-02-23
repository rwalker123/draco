import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import SurveySpotlightWidget from '../SurveySpotlightWidget';
import { dracoTheme } from '../../../theme';
import { ApiClientError } from '../../../utils/apiResult';

const mockApiClient = {};

vi.mock('@draco/shared-api-client', () => ({
  getPlayerSurveySpotlight: vi.fn(),
  getPlayerSurveyTeamSpotlight: vi.fn(),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApiClient,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const buildSpotlightResponse = (overrides = {}) =>
  ({
    data: {
      question: 'What motivates you?',
      answer: 'Winning together.',
      player: {
        id: '42',
        firstName: 'Alice',
        lastName: 'Smith',
      },
      teamName: 'Tigers',
      ...overrides,
    },
    error: undefined,
    request: new Request('https://example.com'),
    response: new Response(),
  }) as never;

const renderWidget = (props: Partial<React.ComponentProps<typeof SurveySpotlightWidget>> = {}) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <SurveySpotlightWidget accountId="acc-1" {...props} />
    </ThemeProvider>,
  );

describe('SurveySpotlightWidget', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getPlayerSurveySpotlight, getPlayerSurveyTeamSpotlight } =
      await import('@draco/shared-api-client');
    vi.mocked(getPlayerSurveySpotlight).mockReset();
    vi.mocked(getPlayerSurveyTeamSpotlight).mockReset();
  });

  describe('loading state', () => {
    it('shows a loading spinner while the spotlight is being fetched', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockReturnValue(new Promise(() => {}) as never);

      renderWidget();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('renders the question and answer when spotlight data is returned', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockResolvedValue(buildSpotlightResponse());

      renderWidget();

      await waitFor(() => {
        expect(screen.getByText(/What motivates you\?/)).toBeInTheDocument();
      });

      expect(screen.getByText('Winning together.')).toBeInTheDocument();
    });

    it('renders player name from first and last name', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockResolvedValue(buildSpotlightResponse());

      renderWidget();

      await waitFor(() => {
        expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
      });
    });

    it('renders team name suffix when teamName is present', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockResolvedValue(buildSpotlightResponse());

      renderWidget();

      await waitFor(() => {
        expect(screen.getByText(/Tigers/)).toBeInTheDocument();
      });
    });

    it('uses team spotlight endpoint when teamSeasonId is provided', async () => {
      const { getPlayerSurveySpotlight, getPlayerSurveyTeamSpotlight } =
        await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveyTeamSpotlight).mockResolvedValue(
        buildSpotlightResponse({ teamName: 'Bears' }),
      );

      renderWidget({ teamSeasonId: 'ts-99' });

      await waitFor(() => {
        expect(vi.mocked(getPlayerSurveyTeamSpotlight)).toHaveBeenCalled();
      });

      expect(vi.mocked(getPlayerSurveySpotlight)).not.toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows empty message when API returns 404', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockRejectedValue(
        new ApiClientError('Not Found', { status: 404 }),
      );

      renderWidget();

      await waitFor(() => {
        expect(
          screen.getByText(/No survey responses are ready to highlight yet/),
        ).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('shows error alert when fetch fails with a non-404 error', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockRejectedValue(
        new ApiClientError('Service unavailable', { status: 503 }),
      );

      renderWidget();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable');
      });
    });

    it('renders view surveys link in the error state', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockRejectedValue(
        new ApiClientError('Failure', { status: 500 }),
      );

      renderWidget({ surveysHref: '/surveys' });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('View Surveys')).toBeInTheDocument();
    });
  });

  describe('custom title', () => {
    it('uses the default title when no teamSeasonId is provided', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockReturnValue(new Promise(() => {}) as never);

      renderWidget();

      expect(screen.getByText('Player Survey Spotlight')).toBeInTheDocument();
    });

    it('uses a custom title when title prop is provided', async () => {
      const { getPlayerSurveySpotlight } = await import('@draco/shared-api-client');
      vi.mocked(getPlayerSurveySpotlight).mockReturnValue(new Promise(() => {}) as never);

      renderWidget({ title: 'My Custom Spotlight' });

      expect(screen.getByText('My Custom Spotlight')).toBeInTheDocument();
    });
  });
});
