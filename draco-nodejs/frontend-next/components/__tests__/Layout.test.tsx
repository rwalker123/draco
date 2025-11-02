import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Layout from '../Layout';

const pushMock = vi.fn();
const logoutMock = vi.fn();
const getAccountByIdMock = vi.fn();
const getCurrentSeasonMock = vi.fn();
const hasRoleMock = vi.fn();
let hasManageableAccount = false;
const setAccountContextMock = vi.fn();
const useAccountMembershipMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/account/123/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../hooks/useLogout', () => ({
  useLogout: () => logoutMock,
}));

vi.mock('../../hooks/useAccountMembership', () => ({
  useAccountMembership: (accountId: string | null) => useAccountMembershipMock(accountId),
}));

vi.mock('../../hooks/useApiClient', () => ({
  useApiClient: () => ({}),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    clearAllContexts: vi.fn(),
  }),
}));

vi.mock('../../context/RoleContext', () => ({
  useRole: () => ({
    hasRole: (...args: unknown[]) => hasRoleMock(...args),
    hasManageableAccount,
  }),
}));

let contextAccount: { id: string; name: string } | null = null;

vi.mock('../../context/AccountContext', () => ({
  useAccount: () => ({
    currentAccount: contextAccount,
    setCurrentAccount: setAccountContextMock,
  }),
}));

vi.mock('@draco/shared-api-client', async () => {
  const actual = await vi.importActual<typeof import('@draco/shared-api-client')>(
    '@draco/shared-api-client',
  );

  return {
    ...actual,
    getAccountById: (...args: unknown[]) => getAccountByIdMock(...args),
    getCurrentSeason: (...args: unknown[]) => getCurrentSeasonMock(...args),
  };
});

describe('Layout hamburger menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextAccount = { id: '123', name: 'Account Name' };
    hasManageableAccount = false;
    hasRoleMock.mockImplementation((role: string, options?: { accountId?: string }) => {
      if (role === 'AccountAdmin' && options?.accountId === '123') {
        return true;
      }
      return false;
    });
    getAccountByIdMock.mockResolvedValue({
      data: {
        account: {
          id: '123',
          name: 'Account Name',
          configuration: {
            accountType: { name: 'Baseball' },
            timeZone: 'America/New_York',
          },
        },
      },
    });
    getCurrentSeasonMock.mockResolvedValue({
      data: {
        id: 'season-1',
      },
    });
    useAccountMembershipMock.mockReturnValue({ isMember: true });
  });

  it('shows survey management link for account admins', async () => {
    render(<Layout accountId="123">Test</Layout>);

    await waitFor(() => expect(getAccountByIdMock).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText(/menu/i));

    expect(await screen.findByText('Survey Management')).toBeInTheDocument();
  });

  it('hides survey management link for non account admins', async () => {
    hasRoleMock.mockImplementation(() => false);

    render(<Layout accountId="123">Test</Layout>);

    await waitFor(() => expect(getAccountByIdMock).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText(/menu/i));

    await waitFor(() => {
      expect(screen.queryByText('Survey Management')).not.toBeInTheDocument();
    });
  });
});
