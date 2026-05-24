import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import IntegrationsClient from '../IntegrationsClient';

const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/integrations',
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.mock('@/context/RoleContext', () => ({
  useRole: () => ({
    userRoles: [],
    roleMetadata: {},
    hasRole: () => false,
    hasPermission: () => false,
    loading: false,
    initialized: true,
    error: null,
  }),
}));

vi.mock('@/context/AccountContext', () => ({
  useAccount: () => ({
    currentAccount: null,
    loading: false,
    initialized: true,
  }),
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

const theme = createTheme();

const renderClient = (mcpUrl: string | undefined) =>
  render(
    <ThemeProvider theme={theme}>
      <IntegrationsClient mcpUrl={mcpUrl} />
    </ThemeProvider>,
  );

describe('IntegrationsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue = makeAuthValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('missing env var', () => {
    it('renders graceful warning when MCP URL is undefined', () => {
      renderClient(undefined);

      expect(screen.getByText(/MCP server URL is not configured/i)).toBeInTheDocument();
    });

    it('does not render section headings when URL is missing', () => {
      renderClient(undefined);

      expect(screen.queryByText('Set it up')).not.toBeInTheDocument();
      expect(screen.queryByText('What you can ask')).not.toBeInTheDocument();
    });
  });

  describe('with MCP URL configured', () => {
    const mcpUrl = 'https://mcp.draco.com/mcp';

    it('renders the page title', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('AI Assistant Integrations')).toBeInTheDocument();
    });

    it('renders read-only notice chip', () => {
      renderClient(mcpUrl);

      expect(screen.getByText(/Read-only — these tools cannot make changes/i)).toBeInTheDocument();
    });

    it('renders the Set it up section heading', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Set it up')).toBeInTheDocument();
    });

    it('renders the copyable setup prompt containing the MCP URL', () => {
      renderClient(mcpUrl);

      expect(
        screen.getByDisplayValue(`Add this remote MCP server and help me sign in: ${mcpUrl}`),
      ).toBeInTheDocument();
    });

    it('copies the setup prompt to clipboard when copy prompt button is clicked', async () => {
      renderClient(mcpUrl);

      const copyButton = screen.getByLabelText('copy prompt');
      await userEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(
        `Add this remote MCP server and help me sign in: ${mcpUrl}`,
      );
    });

    it('renders the FAQ section heading', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    });

    it('renders all FAQ questions', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('What is MCP?')).toBeInTheDocument();
      expect(screen.getByText('What can the AI see?')).toBeInTheDocument();
      expect(screen.getByText('What does it cost me?')).toBeInTheDocument();
      expect(screen.getByText('How do I disconnect?')).toBeInTheDocument();
      expect(screen.getByText(/What if it doesn/i)).toBeInTheDocument();
    });

    it('shows the MCP URL in the generic URL field', () => {
      renderClient(mcpUrl);

      expect(screen.getByDisplayValue(mcpUrl)).toBeInTheDocument();
    });

    it('calls clipboard.writeText with the MCP URL when copy URL button is clicked', async () => {
      renderClient(mcpUrl);

      const copyButton = screen.getByLabelText('copy URL');
      await userEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(mcpUrl);
    });

    it('shows success snackbar message after copying URL', async () => {
      renderClient(mcpUrl);

      const copyButton = screen.getByLabelText('copy URL');
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('expands FAQ answer when question is clicked', async () => {
      renderClient(mcpUrl);

      const faqQuestion = screen.getByText('What is MCP?');
      await userEvent.click(faqQuestion);

      await waitFor(() => {
        expect(screen.getByText(/Model Context Protocol/i)).toBeInTheDocument();
      });
    });

    it('collapses FAQ accordion when question is clicked a second time', async () => {
      renderClient(mcpUrl);

      const faqQuestion = screen.getByText('What is MCP?');
      await userEvent.click(faqQuestion);

      await waitFor(() => {
        const accordionSummary = faqQuestion.closest('[aria-expanded]');
        expect(accordionSummary).toHaveAttribute('aria-expanded', 'true');
      });

      await userEvent.click(faqQuestion);

      await waitFor(() => {
        const accordionSummary = faqQuestion.closest('[aria-expanded]');
        expect(accordionSummary).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });
});

describe('IntegrationsClientWrapper auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when user is not authenticated', async () => {
    mockAuthValue = makeAuthValue({ user: null, token: null });

    const { default: IntegrationsClientWrapper } = await import('../IntegrationsClientWrapper');

    render(
      <ThemeProvider theme={theme}>
        <IntegrationsClientWrapper />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(expect.stringContaining('/login?next='));
    });
  });
});
