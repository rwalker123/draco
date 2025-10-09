import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../auth/ProtectedRoute';

const replaceMock = vi.fn();
const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();
const mockUseAccount = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => '/account-management',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

vi.mock('../../context/AccountContext', () => ({
  useAccount: () => mockUseAccount(),
}));

describe('ProtectedRoute with aggregated contact roles', () => {
  beforeEach(() => {
    replaceMock.mockReset();

    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', userName: 'User One' },
      token: 'token-123',
      loading: false,
      initialized: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
      setAuthToken: vi.fn(),
      clearAllContexts: vi.fn(),
      accountIdFromPath: null,
    });

    mockUseAccount.mockReturnValue({
      currentAccount: null,
      loading: false,
      initialized: true,
      error: null,
      refetchAccount: vi.fn(),
      updateAccount: vi.fn(),
    });

    const aggregatedContactRoles = [
      {
        id: 'role-1',
        roleId: 'AccountAdmin',
        roleName: 'AccountAdmin',
        roleData: '0',
        accountId: '100',
        contact: { id: 'contact-1' },
      },
    ];

    const hasRoleSpy = vi.fn((role: string) =>
      aggregatedContactRoles.some((contactRole) => contactRole.roleId === role),
    );

    mockUseRole.mockReturnValue({
      userRoles: {
        accountId: '',
        globalRoles: [],
        contactRoles: aggregatedContactRoles,
      },
      loading: false,
      initialized: true,
      error: null,
      hasRole: hasRoleSpy,
      hasPermission: vi.fn(),
      hasRoleInAccount: vi.fn(),
      hasRoleInTeam: vi.fn(),
      hasRoleInLeague: vi.fn(),
      fetchUserRoles: vi.fn(),
      clearRoles: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('grants access when aggregated AccountAdmin roles are available without account context', async () => {
    render(
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={false}>
        <div>Authorized content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('Authorized content')).toBeInTheDocument();
    });

    expect(replaceMock).not.toHaveBeenCalled();
    const roleContext = mockUseRole.mock.results[0]?.value;
    expect(roleContext?.hasRole).toHaveBeenCalledWith('AccountAdmin');
  });
});
