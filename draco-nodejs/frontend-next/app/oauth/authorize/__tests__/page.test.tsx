import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import OAuthAuthorizePage from '../page';

const mockRouterReplace = vi.fn();
const stableRouter = {
  replace: mockRouterReplace,
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const mockSearchParams = new URLSearchParams({
  response_type: 'code',
  client_id: 'test-client',
  redirect_uri: 'https://client.example.com/callback',
  scope: 'mcp:read',
  code_challenge: 'a'.repeat(43),
  code_challenge_method: 'S256',
  state: 'test-state',
});

vi.mock('next/navigation', () => ({
  useRouter: () => stableRouter,
  useSearchParams: () => mockSearchParams,
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockLocationReplace = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/oauth/authorize',
    search: '?response_type=code&client_id=test-client',
    replace: mockLocationReplace,
    href: 'http://localhost/oauth/authorize',
  },
  writable: true,
});

const makeAuthValue = (overrides = {}) => ({
  user: {
    userId: 'user-1',
    userName: 'user@example.com',
    contact: { email: 'user@example.com' },
  },
  token: 'jwt-token',
  loading: false,
  initialized: true,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  fetchUser: vi.fn(),
  setAuthToken: vi.fn(),
  clearAllContexts: vi.fn(),
  accountIdFromPath: null,
  ...overrides,
});

let mockAuthValue = makeAuthValue();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

const theme = createTheme();

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <OAuthAuthorizePage />
    </ThemeProvider>,
  );

const makeValidateSuccessBody = () => ({
  rid: 'request-id-123',
  client_name: 'My MCP Client',
  scopes_human: ['Read your teams', 'Read your schedule'],
});

const makeJsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

describe('OAuthAuthorizePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue = makeAuthValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loading states', () => {
    it('renders loading state while validate request is pending', async () => {
      let resolveValidate!: (value: unknown) => void;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveValidate = resolve;
        }),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Verifying request...')).toBeInTheDocument();
      });

      await act(async () => {
        resolveValidate(makeJsonResponse(makeValidateSuccessBody()));
      });
    });

    it('renders a spinner while auth is initializing', () => {
      mockAuthValue = makeAuthValue({ initialized: false, loading: true });

      renderPage();

      const spinners = screen.getAllByRole('progressbar');
      expect(spinners.length).toBeGreaterThan(0);
      expect(screen.queryByText('Verifying request...')).not.toBeInTheDocument();
    });
  });

  describe('auth redirect', () => {
    it('redirects to /login?next=... when user is not authenticated', async () => {
      mockAuthValue = makeAuthValue({ user: null, token: null });

      renderPage();

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith(expect.stringContaining('/login?next='));
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('validate success — consent screen', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(makeJsonResponse(makeValidateSuccessBody()));
    });

    it('renders consent screen with client_name and scopes_human', async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByText('My MCP Client wants to connect to your Draco account'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Read your teams')).toBeInTheDocument();
      expect(screen.getByText('Read your schedule')).toBeInTheDocument();
      expect(
        screen.getByText('My MCP Client cannot make changes — this access is read-only.'),
      ).toBeInTheDocument();
    });

    it('shows logged-in user email on the consent screen', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/Logged in as/)).toBeInTheDocument();
      });

      expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    });

    it('renders Approve and Deny buttons', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
      });
    });
  });

  describe('validate response with redirect_to', () => {
    it('calls window.location.replace on validate response with redirect_to', async () => {
      mockFetch.mockResolvedValue(
        makeJsonResponse({
          redirect_to: 'https://client.example.com/callback?error=invalid_scope',
        }),
      );

      renderPage();

      await waitFor(() => {
        expect(mockLocationReplace).toHaveBeenCalledWith(
          'https://client.example.com/callback?error=invalid_scope',
        );
      });
    });
  });

  describe('validate error state', () => {
    it('renders error state on validate 400 error', async () => {
      mockFetch.mockResolvedValue(
        makeJsonResponse(
          { error: 'invalid_client', error_description: 'Unknown client identifier' },
          400,
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Authorization request failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Unknown client identifier')).toBeInTheDocument();
      expect(screen.getByText('invalid_client')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Return to Draco' })).toBeInTheDocument();
    });
  });

  describe('decision — Approve', () => {
    it('POSTs decision with approve and redirects on success', async () => {
      mockFetch
        .mockResolvedValueOnce(makeJsonResponse(makeValidateSuccessBody()))
        .mockResolvedValueOnce(
          makeJsonResponse({ redirect_to: 'https://client.example.com/callback?code=abc123' }),
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      const decisionCall = mockFetch.mock.calls[1];
      const decisionBody = JSON.parse(decisionCall[1].body as string) as {
        rid: string;
        decision: string;
      };
      expect(decisionBody).toMatchObject({ rid: 'request-id-123', decision: 'approve' });

      expect(mockLocationReplace).toHaveBeenCalledWith(
        'https://client.example.com/callback?code=abc123',
      );
    });
  });

  describe('decision — Deny', () => {
    it('POSTs decision with deny and redirects on success', async () => {
      mockFetch
        .mockResolvedValueOnce(makeJsonResponse(makeValidateSuccessBody()))
        .mockResolvedValueOnce(
          makeJsonResponse({
            redirect_to: 'https://client.example.com/callback?error=access_denied',
          }),
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Deny' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      const decisionCall = mockFetch.mock.calls[1];
      const decisionBody = JSON.parse(decisionCall[1].body as string) as {
        rid: string;
        decision: string;
      };
      expect(decisionBody).toMatchObject({ rid: 'request-id-123', decision: 'deny' });

      expect(mockLocationReplace).toHaveBeenCalledWith(
        'https://client.example.com/callback?error=access_denied',
      );
    });
  });

  describe('decision — buttons disabled during in-flight request', () => {
    it('disables both buttons while decision request is in flight', async () => {
      let resolveDecision!: (value: unknown) => void;
      mockFetch
        .mockResolvedValueOnce(makeJsonResponse(makeValidateSuccessBody()))
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveDecision = resolve;
          }),
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
      });

      act(() => {
        screen.getByRole('button', { name: 'Approve' }).click();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
      });

      await act(async () => {
        resolveDecision(
          makeJsonResponse({ redirect_to: 'https://client.example.com/callback?code=xyz' }),
        );
      });
    });
  });

  describe('decision — error state', () => {
    it('renders error state on 400 from decision endpoint after Approve', async () => {
      mockFetch
        .mockResolvedValueOnce(makeJsonResponse(makeValidateSuccessBody()))
        .mockResolvedValueOnce(
          makeJsonResponse({ error: 'server_error', error_description: 'Internal failure' }, 400),
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

      await waitFor(() => {
        expect(screen.getByText('Authorization request failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Internal failure')).toBeInTheDocument();
      expect(screen.getByText('server_error')).toBeInTheDocument();
    });

    it('renders error state on 403 from decision endpoint after Deny', async () => {
      mockFetch
        .mockResolvedValueOnce(makeJsonResponse(makeValidateSuccessBody()))
        .mockResolvedValueOnce(
          makeJsonResponse({ error: 'forbidden', error_description: 'Session expired' }, 403),
        );

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Deny' }));

      await waitFor(() => {
        expect(screen.getByText('Authorization request failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Session expired')).toBeInTheDocument();
    });
  });
});
