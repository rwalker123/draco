'use client';
import React from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useAccount } from '../context/AccountContext';
import { useRouter, usePathname } from 'next/navigation';
import BaseballMenu from './BaseballMenu';

interface LayoutProps {
  children: React.ReactNode;
  accountId?: string | null;
}

const getAccountIdFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/account\/(\d+)/);
  return match ? match[1] : null;
};

const Layout: React.FC<LayoutProps> = ({ children, accountId: propAccountId }) => {
  const { user, logout, clearAllContexts } = useAuth();
  const { hasRole } = useRole();
  const { currentAccount: contextAccount } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [accountType, setAccountType] = React.useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = React.useState<Record<string, unknown> | null>(null);

  // Check if user has admin role
  const isAdmin =
    user &&
    (hasRole('Administrator') ||
      (currentAccount?.id && hasRole('AccountAdmin', { accountId: String(currentAccount.id) })));

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

  // Extract accountId from prop, context, or URL (in that order of preference)
  const accountId = propAccountId ?? contextAccount?.id ?? getAccountIdFromPath(pathname);

  // Fetch account type and current account info
  React.useEffect(() => {
    const fetchAccount = async () => {
      if (accountId) {
        try {
          const response = await fetch(`/api/accounts/${accountId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAccountType(data.data.account.accountType);
              setCurrentAccount(data.data.account);
            }
          }
        } catch {
          setAccountType(null);
          setCurrentAccount(null);
        }
      } else {
        setAccountType(null);
        setCurrentAccount(null);
      }
    };
    fetchAccount();
  }, [accountId]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAllContexts();
    logout(true);
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

  const handleHomeClick = () => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    } else {
      router.push('/');
    }
  };

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
              {isAdmin ? <AdminMenuIcon /> : <MenuIcon />}
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
          {accountType === 'Baseball' && accountId && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BaseballMenu accountId={accountId} />
            </Box>
          )}

          {/* Right side - User info and actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
                {user.firstname && (
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Hello, {user.firstname}
                  </Typography>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={handleLogin} sx={{ mr: 1 }}>
                  Sign In
                </Button>
                <Button color="inherit" onClick={handleSignup}>
                  Sign Up
                </Button>
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
        {(() => {
          if (
            user &&
            (hasRole('Administrator') ||
              (currentAccount?.id &&
                hasRole('AccountAdmin', { accountId: String(currentAccount.id) })))
          ) {
            return (
              <MenuItem onClick={() => handleNavigation('/account-management')}>
                <ListItemIcon>
                  <BusinessIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Account Management</ListItemText>
              </MenuItem>
            );
          }
          return null;
        })()}
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
        {/* League Admin Only */}
        {/* Team Admin Only */}
      </Menu>

      <Container maxWidth={false} sx={{ flex: 1, py: 3, px: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
