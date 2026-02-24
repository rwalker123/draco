import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AccountMembershipGate from '../AccountMembershipGate';

const mockFetchMyContact = vi.fn();
const mockHasRole = vi.fn();
const mockFetchUser = vi.fn();
const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();

vi.mock('@/config/routePermissions', () => ({
  isPublicRoute: vi.fn().mockReturnValue(false),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/context/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

vi.mock('@/services/accountRegistrationService', () => ({
  AccountRegistrationService: {
    fetchMyContact: vi.fn(),
    selfRegister: vi.fn(),
    combinedRegister: vi.fn(),
  },
}));

vi.mock('@/components/account/RegistrationForm', () => ({
  RegistrationForm: ({ isAuthenticated }: { isAuthenticated: boolean }) => (
    <div data-testid="registration-form" data-authenticated={String(isAuthenticated)} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/account/123/home',
  useSearchParams: () => new URLSearchParams(),
}));

const ACCOUNT_ID = '123';
const CHILD_TEXT = 'Protected Content';

const renderGate = () =>
  render(
    <AccountMembershipGate accountId={ACCOUNT_ID}>
      <div>{CHILD_TEXT}</div>
    </AccountMembershipGate>,
  );

const makeAuthValue = (overrides = {}) => ({
  user: null as unknown,
  token: null as string | null,
  fetchUser: mockFetchUser,
  loading: false,
  initialized: true,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  setAuthToken: vi.fn(),
  clearAllContexts: vi.fn(),
  accountIdFromPath: null,
  ...overrides,
});

const makeRoleValue = (overrides = {}) => ({
  hasRole: mockHasRole,
  hasPermission: vi.fn(),
  hasRoleInAccount: vi.fn(),
  hasRoleInTeam: vi.fn(),
  hasRoleInLeague: vi.fn(),
  userRoles: null,
  roleMetadata: null,
  loading: false,
  initialized: true,
  error: null,
  isAdministrator: false,
  manageableAccountIds: [],
  hasManageableAccount: false,
  clearRoles: vi.fn(),
  ...overrides,
});

describe('AccountMembershipGate', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockHasRole.mockReturnValue(false);
    mockUseAuth.mockReturnValue(makeAuthValue());
    mockUseRole.mockReturnValue(makeRoleValue());

    const { isPublicRoute } = await import('@/config/routePermissions');
    vi.mocked(isPublicRoute).mockReturnValue(false);

    const { AccountRegistrationService } = await import('@/services/accountRegistrationService');
    vi.mocked(AccountRegistrationService.fetchMyContact).mockImplementation(mockFetchMyContact);
  });

  describe('public route bypass', () => {
    it('renders children immediately on a public route without checking membership', async () => {
      const { isPublicRoute } = await import('@/config/routePermissions');
      vi.mocked(isPublicRoute).mockReturnValue(true);

      renderGate();

      expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
    });
  });

  describe('global administrator bypass', () => {
    it('renders children immediately when user has the Administrator role', () => {
      mockUseRole.mockReturnValue(makeRoleValue({ hasRole: () => true }));

      renderGate();

      expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('renders children when no user is logged in and register param is absent', async () => {
      renderGate();

      await waitFor(() => {
        expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
      });
    });
  });

  describe('authenticated member', () => {
    it('renders children when the authenticated user has a contact record in the account', async () => {
      mockUseAuth.mockReturnValue(
        makeAuthValue({ user: { userId: 'u1', userName: 'jane' }, token: 'tok' }),
      );
      mockFetchMyContact.mockResolvedValue({ id: 'c1', firstName: 'Jane' });

      renderGate();

      await waitFor(() => {
        expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
      });

      expect(mockFetchMyContact).toHaveBeenCalledWith(ACCOUNT_ID, 'tok', expect.any(AbortSignal));
    });
  });

  describe('non-member authenticated user', () => {
    it('shows registration form when authenticated user has no contact in the account', async () => {
      mockUseAuth.mockReturnValue(
        makeAuthValue({ user: { userId: 'u2', userName: 'bob' }, token: 'tok2' }),
      );
      mockFetchMyContact.mockResolvedValue(null);

      renderGate();

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });

      expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    });

    it('shows authenticated registration form variant when user is logged in', async () => {
      mockUseAuth.mockReturnValue(
        makeAuthValue({ user: { userId: 'u2', userName: 'bob' }, token: 'tok2' }),
      );
      mockFetchMyContact.mockResolvedValue(null);

      renderGate();

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toHaveAttribute(
          'data-authenticated',
          'true',
        );
      });
    });
  });

  describe('error handling', () => {
    it('shows registration form when contact fetch throws an error', async () => {
      mockUseAuth.mockReturnValue(
        makeAuthValue({ user: { userId: 'u3', userName: 'err' }, token: 'tok3' }),
      );
      mockFetchMyContact.mockRejectedValue(new Error('Network error'));

      renderGate();

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('renders nothing while membership check is pending for an authenticated user', () => {
      mockUseAuth.mockReturnValue(
        makeAuthValue({ user: { userId: 'u4', userName: 'pending' }, token: 'tok4' }),
      );

      let resolve: (value: null) => void;
      mockFetchMyContact.mockReturnValue(new Promise<null>((r) => (resolve = r)));

      const { container } = renderGate();

      expect(container).toBeEmptyDOMElement();

      resolve!(null);
    });
  });
});
