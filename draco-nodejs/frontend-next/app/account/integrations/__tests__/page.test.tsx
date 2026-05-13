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
  usePathname: () => '/account/integrations',
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

      expect(screen.queryByText('One-click setup')).not.toBeInTheDocument();
      expect(screen.queryByText('Other AI clients')).not.toBeInTheDocument();
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

    it('renders the One-click setup section heading', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('One-click setup')).toBeInTheDocument();
    });

    it('renders Claude.ai, Claude Desktop, and ChatGPT cards', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Claude.ai')).toBeInTheDocument();
      expect(screen.getByText('Claude Desktop')).toBeInTheDocument();
      expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    });

    it('renders the Developer tools section heading', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Developer tools')).toBeInTheDocument();
    });

    it('renders Cursor and VS Code as one-click cards in the Developer tools section', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Cursor')).toBeInTheDocument();
      expect(screen.getByText('VS Code')).toBeInTheDocument();
    });

    it('renders Install in Cursor and Install in VS Code buttons', () => {
      renderClient(mcpUrl);

      expect(screen.getByRole('button', { name: /Install in Cursor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Install in VS Code/i })).toBeInTheDocument();
    });

    it('renders the Other AI clients section heading', () => {
      renderClient(mcpUrl);

      expect(screen.getByText('Other AI clients')).toBeInTheDocument();
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
      expect(screen.getByText(/What if the one-click button doesn/i)).toBeInTheDocument();
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

    it('expands ChatGPT setup steps when Setup steps button is clicked', async () => {
      renderClient(mcpUrl);

      const setupStepsButton = screen.getByRole('button', { name: /Setup steps/i });
      await userEvent.click(setupStepsButton);

      await waitFor(() => {
        expect(screen.getByText(/Sign in to ChatGPT/i)).toBeInTheDocument();
      });
    });

    it('copies MCP URL to clipboard when Claude.ai button is clicked', async () => {
      renderClient(mcpUrl);

      const connectButton = screen.getByRole('button', { name: /Open Claude Connectors/i });
      await userEvent.click(connectButton);

      expect(mockWriteText).toHaveBeenCalledWith(mcpUrl);
    });

    it('expands the Cursor manual setup snippet when Show manual setup is clicked', async () => {
      renderClient(mcpUrl);

      const showManualButtons = screen.getAllByRole('button', { name: /Show manual setup/i });
      await userEvent.click(showManualButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy snippet/i })).toBeInTheDocument();
      });
    });

    it('copies the Cursor snippet to clipboard when its copy button is clicked', async () => {
      renderClient(mcpUrl);

      const showManualButtons = screen.getAllByRole('button', { name: /Show manual setup/i });
      await userEvent.click(showManualButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy snippet/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy snippet/i });
      await userEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining(mcpUrl));
    });
  });

  describe('deep-link URL generation', () => {
    const fixtureMcpUrl = 'http://localhost:3010/mcp';

    it('generates the correct Cursor deep-link href', () => {
      renderClient(fixtureMcpUrl);

      const installButton = screen.getByRole('button', { name: /Install in Cursor/i });
      const expectedBase64 = btoa(JSON.stringify({ url: fixtureMcpUrl }));
      const expectedParams = new URLSearchParams({ name: 'Draco', config: expectedBase64 });
      const expectedHref = `cursor://anysphere.cursor-deeplink/mcp/install?${expectedParams.toString()}`;

      installButton.click();

      expect(installButton).toBeInTheDocument();
      expect(expectedHref).toBe(
        'cursor://anysphere.cursor-deeplink/mcp/install?name=Draco&config=eyJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjMwMTAvbWNwIn0%3D',
      );
    });

    it('generates the correct VS Code deep-link href', () => {
      renderClient(fixtureMcpUrl);

      const installButton = screen.getByRole('button', { name: /Install in VS Code/i });
      const expectedConfig = JSON.stringify({ name: 'draco', url: fixtureMcpUrl });
      const expectedHref = `vscode:mcp/install?${encodeURIComponent(expectedConfig)}`;

      installButton.click();

      expect(installButton).toBeInTheDocument();
      expect(expectedHref).toBe(
        'vscode:mcp/install?%7B%22name%22%3A%22draco%22%2C%22url%22%3A%22http%3A%2F%2Flocalhost%3A3010%2Fmcp%22%7D',
      );
    });

    it('Cursor base64 encodes only the url field (not name)', () => {
      renderClient(fixtureMcpUrl);

      const base64 = btoa(JSON.stringify({ url: fixtureMcpUrl }));
      const decoded = JSON.parse(atob(base64)) as { url: string };

      expect(decoded).toEqual({ url: fixtureMcpUrl });
      expect(decoded).not.toHaveProperty('name');
    });

    it('VS Code config includes both name and url fields', () => {
      renderClient(fixtureMcpUrl);

      const encoded = encodeURIComponent(JSON.stringify({ name: 'draco', url: fixtureMcpUrl }));
      const decoded = JSON.parse(decodeURIComponent(encoded)) as { name: string; url: string };

      expect(decoded).toEqual({ name: 'draco', url: fixtureMcpUrl });
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
