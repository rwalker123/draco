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
  Link,
} from '@mui/material';
import { 
  SportsSoccer, 
  Menu as MenuIcon, 
  Dashboard, 
  AdminPanelSettings, 
  Business,
  Group,
  Settings,
  CalendarMonth,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useAccount } from '../context/AccountContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminOnly, AccountAdminOnly } from './RoleBasedNavigation';
import BaseballMenu from './BaseballMenu';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, clearAllContexts } = useAuth();
  const { hasRole, clearRoles } = useRole();
  const { currentAccount, clearAccounts } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [accountType, setAccountType] = React.useState<string | null>(null);

  // Extract accountId from URL pathname
  const getAccountIdFromPath = (pathname: string): string | null => {
    const match = pathname.match(/\/account\/(\d+)/);
    return match ? match[1] : null;
  };

  // Check if we're on a baseball account page
  React.useEffect(() => {
    const checkAccountType = async () => {
      const accountId = getAccountIdFromPath(location.pathname);
      if (accountId && location.pathname.includes(`/account/${accountId}`)) {
        try {
          const response = await fetch(`/api/accounts/${accountId}/public`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAccountType(data.data.account.accountType);
              console.log('Account type detected:', data.data.account.accountType); // Debug log
            }
          }
        } catch (err) {
          console.warn('Failed to fetch account type:', err);
        }
      } else {
        setAccountType(null);
      }
    };

    checkAccountType();
  }, [location.pathname]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear all contexts first
    clearAllContexts();
    clearRoles();
    clearAccounts();
    
    // Logout with page refresh to update all components and access controls
    logout(true);
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogin = () => {
    // Navigate to sign in while preserving the current location
    navigate('/login', { state: { from: location } });
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const accountId = getAccountIdFromPath(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ 
          minHeight: '64px !important',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left side - Main navigation */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center'
          }}>
            {user && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
            )}
            <IconButton
              size="large"
              color="inherit"
              aria-label="home"
              sx={{ mr: 1 }}
              onClick={handleHomeClick}
            >
              <Home />
            </IconButton>
            <SportsSoccer sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              <Link 
                onClick={handleHomeClick}
                sx={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Draco Sports Manager
              </Link>
            </Typography>
          </Box>

          {/* Center - Baseball menu (only for baseball accounts) */}
          {accountType === 'Baseball' && accountId && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center'
            }}>
              <BaseballMenu accountId={accountId} />
            </Box>
          )}

          {/* Right side - User info and actions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center'
          }}>
            {user ? (
              <>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Hello, {user.username}
                </Typography>
                {currentAccount && (
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Account: {currentAccount.name}
                  </Typography>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button color="inherit" onClick={handleLogin}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Menu */}
      {user && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={() => handleNavigation('/')}>
            <ListItemIcon>
              <Home fontSize="small" />
            </ListItemIcon>
            <ListItemText>Home</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleNavigation('/dashboard')}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>

          <AdminOnly>
            <MenuItem onClick={() => handleNavigation('/admin')}>
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Admin Dashboard</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation('/account-management')}>
              <ListItemIcon>
                <Business fontSize="small" />
              </ListItemIcon>
              <ListItemText>Account Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || '1'}/seasons`)}>
              <ListItemIcon>
                <CalendarMonth fontSize="small" />
              </ListItemIcon>
              <ListItemText>Season Management</ListItemText>
            </MenuItem>
          </AdminOnly>

          <AccountAdminOnly>
            <MenuItem onClick={() => handleNavigation('/account-management')}>
              <ListItemIcon>
                <Business fontSize="small" />
              </ListItemIcon>
              <ListItemText>Account Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || '1'}/management`)}>
              <ListItemIcon>
                <Business fontSize="small" />
              </ListItemIcon>
              <ListItemText>Current Account</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || '1'}/settings`)}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Account Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || '1'}/seasons`)}>
              <ListItemIcon>
                <CalendarMonth fontSize="small" />
              </ListItemIcon>
              <ListItemText>Season Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || '1'}/schedule`)}>
              <ListItemIcon>
                <CalendarMonth fontSize="small" />
              </ListItemIcon>
              <ListItemText>Schedule Management</ListItemText>
            </MenuItem>
          </AccountAdminOnly>

          {hasRole('672DDF06-21AC-4D7C-B025-9319CC69281A') && (
            <MenuItem onClick={() => handleNavigation('/league-management')}>
              <ListItemIcon>
                <Group fontSize="small" />
              </ListItemIcon>
              <ListItemText>League Management</ListItemText>
            </MenuItem>
          )}

          {hasRole('777D771B-1CBA-4126-B8F3-DD7F3478D40E') && (
            <MenuItem onClick={() => handleNavigation('/team-management')}>
              <ListItemIcon>
                <Group fontSize="small" />
              </ListItemIcon>
              <ListItemText>Team Management</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => handleNavigation('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleNavigation('/permission-test')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Permission Test</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleNavigation('/role-debug')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Role Debug</ListItemText>
          </MenuItem>
        </Menu>
      )}
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Draco Sports Manager. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}; 