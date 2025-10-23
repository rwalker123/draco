'use client';
import React, { useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarMonthIcon,
  Home as HomeIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  FitnessCenter as FitnessCenterIcon,
  Handshake as HandshakeIcon,
  HowToVote as HowToVoteIcon,
  Description as DescriptionIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useAccount } from '../context/AccountContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLogout } from '../hooks/useLogout';
import BaseballMenu from './BaseballMenu';
import { useAccountMembership } from '../hooks/useAccountMembership';
import RegistrationDialog from './account/RegistrationDialog';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import type { AccountType } from '@draco/shared-schemas';

interface LayoutProps {
  children: React.ReactNode;
  accountId?: string | null;
}

const getAccountIdFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/account\/([^/]+)/);
  return match ? match[1] : null;
};

const Layout: React.FC<LayoutProps> = ({ children, accountId: propAccountId }) => {
  const { user, clearAllContexts } = useAuth();
  const { hasRole, hasManageableAccount } = useRole();
  const { currentAccount: contextAccount, setCurrentAccount: setAccountContext } = useAccount();
  const lastSyncedAccountIdRef = React.useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logout = useLogout();
  const apiClient = useApiClient();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [accountType, setAccountType] = React.useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = React.useState<AccountType | null>(null);
  const [registrationOpen, setRegistrationOpen] = React.useState(false);

  // Check if user can access account management features
  const hasAccountManagementPrivileges = Boolean(user && hasManageableAccount);
  const currentAccountId = currentAccount?.id ? String(currentAccount.id) : null;
  const shouldShowAdminMenuIcon =
    hasAccountManagementPrivileges ||
    Boolean(user && currentAccountId && hasRole('AccountAdmin', { accountId: currentAccountId }));

  // Custom admin menu icon component
  const AdminMenuIcon = () => (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <MenuIcon />
      <KeyIcon
        sx={{
          position: 'absolute',
          top: -2,
          right: -2,
          fontSize: '0.7rem',
          color: 'primary.main',
          backgroundColor: 'background.paper',
          borderRadius: '50%',
          padding: '1px',
        }}
      />
    </Box>
  );

  // Extract accountId from prop, URL path, query string, or context (in that order of preference)
  const accountIdFromQuery = searchParams.get('accountId');
  const accountIdFromPath = getAccountIdFromPath(pathname);
  const accountIdFromContext = contextAccount?.id ? String(contextAccount.id) : null;
  const accountId =
    propAccountId ?? accountIdFromPath ?? accountIdFromQuery ?? accountIdFromContext;
  const { isMember } = useAccountMembership(accountId);

  // Fetch account type and current account info
  React.useEffect(() => {
    let isMounted = true;

    const fetchAccount = async () => {
      if (!accountId) {
        setAccountType(null);
        setCurrentAccount(null);
        return;
      }

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (!isMounted) {
          return;
        }

        const data = unwrapApiResult(result, 'Failed to fetch account');
        const account = data.account;
        setAccountType(account.configuration?.accountType?.name ?? null);
        setCurrentAccount(account as AccountType);
        if (lastSyncedAccountIdRef.current !== String(account.id)) {
          setAccountContext({
            id: String(account.id),
            name: account.name ?? '',
            accountType: account.configuration?.accountType?.name ?? undefined,
            timeZone: account.configuration?.timeZone ?? undefined,
            timeZoneSource: account.configuration?.timeZone ? 'account' : undefined,
          });
          lastSyncedAccountIdRef.current = String(account.id);
        }
      } catch {
        if (!isMounted) {
          return;
        }
        setAccountType(null);
        setCurrentAccount(null);
      }
    };

    fetchAccount();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient, setAccountContext]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAllContexts();
    logout(); // Will automatically handle redirect if on protected page
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  const handleLogin = () => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    params.set('next', pathname);
    router.push(`/login?${params.toString()}`);
  };

  const handleSignup = () => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    params.set('next', pathname);
    router.push(`/signup?${params.toString()}`);
  };

  const greetingName = React.useMemo(() => {
    if (!user) {
      return '';
    }

    const firstName = (user.contact?.firstName ?? '').trim();
    if (firstName) {
      return firstName;
    }

    const lastName = (user.contact?.lastName ?? '').trim();
    if (lastName) {
      return lastName;
    }

    const fallbackSource = user.userName ?? '';
    if (!fallbackSource) {
      return '';
    }

    const [usernameWithoutDomain] = fallbackSource.split('@');
    return usernameWithoutDomain || fallbackSource;
  }, [user]);

  const handleHomeClick = () => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    } else {
      router.push('/');
    }
  };

  const handleProfileClick = useCallback(() => {
    if (!user) {
      return;
    }

    router.push('/profile');
  }, [router, user]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar
          sx={{
            minHeight: '64px !important',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side - Main navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={handleMenuOpen}
            >
              {shouldShowAdminMenuIcon ? <AdminMenuIcon /> : <MenuIcon />}
            </IconButton>
            <Box
              onClick={handleHomeClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'inherit',
                textDecoration: 'none',
                mr: 2,
                '&:hover .account-name': { textDecoration: 'underline' },
              }}
            >
              <HomeIcon sx={{ mr: 1 }} />
              {currentAccount && typeof currentAccount.name === 'string' && (
                <Typography
                  variant="h6"
                  component="span"
                  className="account-name"
                  sx={{ fontWeight: 700, color: 'inherit' }}
                >
                  {currentAccount.name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Center - Baseball menu (only for baseball accounts) */}
          {accountType?.toLowerCase() === 'baseball' && accountId && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BaseballMenu accountId={accountId} />
            </Box>
          )}

          {/* Right side - User info and actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
                {greetingName && (
                  <Typography
                    variant="body1"
                    onClick={user ? handleProfileClick : undefined}
                    sx={{
                      mr: 2,
                      cursor: user ? 'pointer' : 'default',
                      '&:hover': user
                        ? {
                            textDecoration: 'underline',
                          }
                        : undefined,
                    }}
                  >
                    Hi, {greetingName}
                  </Typography>
                )}
                {accountId && isMember === false && (
                  <Button color="inherit" onClick={() => setRegistrationOpen(true)} sx={{ mr: 1 }}>
                    Register
                  </Button>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={handleLogin} sx={{ mr: 1 }}>
                  Sign In
                </Button>
                {accountId ? (
                  <Button color="inherit" onClick={() => setRegistrationOpen(true)}>
                    Register
                  </Button>
                ) : (
                  <Button color="inherit" onClick={handleSignup}>
                    Sign Up
                  </Button>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hamburger Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => handleNavigation('/accounts')}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Organizations</ListItemText>
        </MenuItem>
        {user && hasRole('Administrator') && (
          <MenuItem onClick={() => handleNavigation('/admin')}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Admin Dashboard</ListItemText>
          </MenuItem>
        )}
        {hasAccountManagementPrivileges && (
          <MenuItem onClick={() => handleNavigation('/account-management')}>
            <ListItemIcon>
              <BusinessIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Account Management</ListItemText>
          </MenuItem>
        )}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            (hasRole('Administrator') ||
              hasRole('AccountAdmin', { accountId: String(currentAccount.id) }))
          ) {
            return (
              <MenuItem
                onClick={() => handleNavigation(`/account/${String(currentAccount.id)}/seasons`)}
              >
                <ListItemIcon>
                  <CalendarMonthIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Season Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* Account Admin Only */}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() => handleNavigation(`/account/${String(currentAccount.id)}/settings`)}
                key="account-settings"
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Account Settings</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() =>
                  handleNavigation(`/account/${String(currentAccount.id)}/sponsors/manage`)
                }
                key="account-sponsors"
              >
                <ListItemIcon>
                  <HandshakeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Account Sponsors</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() =>
                  handleNavigation(`/account/${String(currentAccount.id)}/polls/manage`)
                }
                key="poll-management"
              >
                <ListItemIcon>
                  <HowToVoteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Poll Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() =>
                  handleNavigation(`/account/${String(currentAccount.id)}/handouts/manage`)
                }
                key="account-handouts"
              >
                <ListItemIcon>
                  <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Handout Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* User Management - Account Admin Only */}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            (hasRole('Administrator') ||
              hasRole('AccountAdmin', { accountId: String(currentAccount.id) }))
          ) {
            return (
              <MenuItem
                onClick={() => handleNavigation(`/account/${String(currentAccount.id)}/users`)}
                key="user-management"
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>User Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* Communications - AccountAdmin Role and above */}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() =>
                  handleNavigation(`/account/${String(currentAccount.id)}/communications`)
                }
                key="communications"
              >
                <ListItemIcon>
                  <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Communications</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* Workout Management - AccountAdmin Role and above */}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            hasRole('AccountAdmin', { accountId: String(currentAccount.id) })
          ) {
            return (
              <MenuItem
                onClick={() => handleNavigation(`/account/${String(currentAccount.id)}/workouts`)}
                key="workout-management"
              >
                <ListItemIcon>
                  <FitnessCenterIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Workout Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* Photo Gallery Management - AccountAdmin Role and above */}
        {(() => {
          if (
            user &&
            currentAccount?.id &&
            (hasRole('AccountAdmin', { accountId: String(currentAccount.id) }) ||
              hasRole('AccountPhotoAdmin', { accountId: String(currentAccount.id) }))
          ) {
            return (
              <MenuItem
                onClick={() =>
                  handleNavigation(`/account/${String(currentAccount.id)}/photo-gallery/admin`)
                }
                key="photo-gallery-management"
              >
                <ListItemIcon>
                  <PhotoLibraryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Photo Gallery Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
        {/* League Admin Only */}
        {/* Team Admin Only */}
      </Menu>

      <Container maxWidth={false} sx={{ flex: 1, py: 3, px: 4 }}>
        {children}
      </Container>

      {/* Dialogs */}
      {accountId && (
        <RegistrationDialog
          open={registrationOpen}
          onClose={() => setRegistrationOpen(false)}
          accountId={accountId}
        />
      )}
    </Box>
  );
};

export default Layout;
