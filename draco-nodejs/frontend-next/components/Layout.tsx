'use client';
import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
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
  Divider,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Home as HomeIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useAccount, useIsIndividualGolfAccount } from '../context/AccountContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLogout } from '../hooks/useLogout';
import BaseballMenu from './BaseballMenu';
import { useAccountMembership } from '../hooks/useAccountMembership';
import RegistrationDialog from './account/RegistrationDialog';
const TopBarQuickActions = dynamic(() => import('./TopBarQuickActions'), {
  ssr: false,
});
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import type { AccountType } from '@draco/shared-schemas';
import type { BaseballOverflowItem } from './BaseballMenu';
import AlertsTicker from './alerts/AlertsTicker';

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
  const isIndividualGolfAccount = useIsIndividualGolfAccount();
  const lastSyncedAccountIdRef = React.useRef<string | null>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logout = useLogout();
  const apiClient = useApiClient();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [accountType, setAccountType] = React.useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = React.useState<AccountType | null>(null);
  const [registrationOpen, setRegistrationOpen] = React.useState(false);
  const [sportOverflowItems, setSportOverflowItems] = React.useState<BaseballOverflowItem[]>([]);
  const [quickActionItems, setQuickActionItems] = React.useState<React.ReactNode[]>([]);

  // Check if user can access account management features (not applicable for Individual Golf accounts)
  const hasAccountManagementPrivileges = Boolean(user && hasManageableAccount);
  const currentAccountId = currentAccount?.id ? String(currentAccount.id) : null;
  const shouldShowAdminMenuIcon =
    !isIndividualGolfAccount &&
    (hasAccountManagementPrivileges ||
      (user && currentAccountId && hasRole('AccountAdmin', { accountId: currentAccountId })));

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

  const handleMenuOpen = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = React.useCallback(() => {
    clearAllContexts();
    logout(); // Will automatically handle redirect if on protected page
    handleMenuClose();
  }, [clearAllContexts, handleMenuClose, logout]);

  const handleLogin = React.useCallback(() => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    params.set('next', pathname);
    router.push(`/login?${params.toString()}`);
  }, [accountId, pathname, router]);

  const handleSignup = React.useCallback(() => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    params.set('next', pathname);
    router.push(`/signup?${params.toString()}`);
  }, [accountId, pathname, router]);

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

  const greetingDisplay = React.useMemo(() => {
    if (!greetingName) {
      return '';
    }
    const full = `Hi, ${greetingName}`;
    if (full.length >= 10) {
      return `${full.slice(0, 9)}...`;
    }
    return full;
  }, [greetingName]);

  const handleProfileClick = useCallback(() => {
    if (!user) {
      return;
    }

    router.push('/profile');
  }, [router, user]);

  const authMenuItems = React.useMemo(() => {
    const items: React.ReactNode[] = [];
    if (user) {
      if (greetingDisplay) {
        items.push(
          <MenuItem
            key="profile-link"
            onClick={() => {
              handleMenuClose();
              handleProfileClick();
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{greetingDisplay}</ListItemText>
          </MenuItem>,
        );
      }
      if (accountId && isMember === false && !isIndividualGolfAccount) {
        items.push(
          <MenuItem
            key="register"
            onClick={() => {
              handleMenuClose();
              setRegistrationOpen(true);
            }}
          >
            <ListItemIcon>
              <HandshakeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Register</ListItemText>
          </MenuItem>,
        );
      }
      items.push(
        <MenuItem
          key="sign-out"
          onClick={() => {
            handleMenuClose();
            handleLogout();
          }}
        >
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>,
      );
    } else {
      items.push(
        <MenuItem
          key="sign-in"
          onClick={() => {
            handleMenuClose();
            handleLogin();
          }}
        >
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign In</ListItemText>
        </MenuItem>,
      );
      if (accountId && !isIndividualGolfAccount) {
        items.push(
          <MenuItem
            key="register"
            onClick={() => {
              handleMenuClose();
              setRegistrationOpen(true);
            }}
          >
            <ListItemIcon>
              <HandshakeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Register</ListItemText>
          </MenuItem>,
        );
      } else {
        items.push(
          <MenuItem
            key="sign-up"
            onClick={() => {
              handleMenuClose();
              handleSignup();
            }}
          >
            <ListItemIcon>
              <HandshakeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign Up</ListItemText>
          </MenuItem>,
        );
      }
    }
    return items;
  }, [
    accountId,
    greetingDisplay,
    handleLogin,
    handleLogout,
    handleMenuClose,
    handleProfileClick,
    handleSignup,
    isIndividualGolfAccount,
    isMember,
    user,
  ]);

  const handleHomeClick = useCallback(() => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    } else {
      router.push('/');
    }
  }, [accountId, router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ top: 0 }}>
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

          {/* Center - Sport menu and Admin Hub */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Baseball menu (only for baseball accounts) */}
            {accountType?.toLowerCase() === 'baseball' && accountId && (
              <BaseballMenu
                accountId={accountId}
                useUnifiedMenu
                onOverflowItemsChange={setSportOverflowItems}
              />
            )}

            {/* Admin Hub button - shown on large screens only, collapses to hamburger first */}
            {isLargeScreen && shouldShowAdminMenuIcon && currentAccount?.id && (
              <Button
                color="inherit"
                startIcon={
                  <Badge
                    variant="dot"
                    color="secondary"
                    sx={{
                      '& .MuiBadge-badge': {
                        top: 2,
                        right: 2,
                      },
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </Badge>
                }
                onClick={() => router.push(`/account/${String(currentAccount.id)}/admin`)}
                sx={{ textTransform: 'none', ml: 1 }}
              >
                Admin Hub
              </Button>
            )}
          </Box>

          {/* Right side - User info and actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Hamburger menu for overflow items */}
            {(sportOverflowItems.length > 0 ||
              (isSmallScreen && authMenuItems.length > 0) ||
              quickActionItems.length > 0 ||
              (!isLargeScreen && shouldShowAdminMenuIcon && currentAccount?.id)) && (
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                aria-expanded={Boolean(anchorEl)}
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
            )}
            <TopBarQuickActions
              accountId={accountId}
              canViewHandouts={Boolean(accountId)}
              canViewAnnouncements={Boolean(accountId)}
              useUnifiedMenu
              onCompactMenuItemsChange={setQuickActionItems}
              onUnifiedMenuClose={handleMenuClose}
            />
            {user ? (
              <>
                {!isSmallScreen && greetingDisplay && (
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
                    {greetingDisplay}
                  </Typography>
                )}
                {!isSmallScreen && accountId && isMember === false && !isIndividualGolfAccount && (
                  <Button color="inherit" onClick={() => setRegistrationOpen(true)} sx={{ mr: 1 }}>
                    Register
                  </Button>
                )}
                {!isSmallScreen && (
                  <Button color="inherit" onClick={handleLogout}>
                    Sign Out
                  </Button>
                )}
              </>
            ) : (
              <>
                {!isSmallScreen && (
                  <Button color="inherit" onClick={handleLogin} sx={{ mr: 1 }}>
                    Sign In
                  </Button>
                )}
                {!isSmallScreen &&
                  (accountId && !isIndividualGolfAccount ? (
                    <Button color="inherit" onClick={() => setRegistrationOpen(true)}>
                      Register
                    </Button>
                  ) : (
                    <Button color="inherit" onClick={handleSignup}>
                      Sign Up
                    </Button>
                  ))}
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
        {sportOverflowItems.map((item) => (
          <MenuItem
            key={`baseball-overflow-${item.label}`}
            onClick={() => {
              item.onClick();
              handleMenuClose();
            }}
            disabled={Boolean(item.busy)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>
              {item.busy ? <CircularProgress size={16} color="inherit" /> : item.label}
            </ListItemText>
          </MenuItem>
        ))}
        {/* Admin Hub - shown in hamburger menu when not on large screens (first to collapse) */}
        {!isLargeScreen && shouldShowAdminMenuIcon && currentAccount?.id && (
          <MenuItem
            onClick={() => {
              router.push(`/account/${String(currentAccount.id)}/admin`);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Admin Hub</ListItemText>
          </MenuItem>
        )}
        {(sportOverflowItems.length > 0 ||
          (!isLargeScreen && shouldShowAdminMenuIcon && currentAccount?.id)) && (
          <Divider sx={{ my: 1 }} />
        )}
        {isSmallScreen ? authMenuItems : null}
        {isSmallScreen && authMenuItems.length > 0 ? <Divider sx={{ my: 1 }} /> : null}
        {quickActionItems}
      </Menu>

      <AlertsTicker />

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
