"use client";
import React from "react";
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
  Link as MuiLink,
} from "@mui/material";
import {
  SportsSoccer,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarMonthIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import { useRouter, usePathname } from "next/navigation";
import BaseballMenu from "./BaseballMenu";

interface LayoutProps {
  children: React.ReactNode;
}

const getAccountIdFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/account\/(\d+)/);
  return match ? match[1] : null;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, clearAllContexts } = useAuth();
  const { hasRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [accountType, setAccountType] = React.useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = React.useState<Record<string, unknown> | null>(null);

  // Extract accountId from URL
  const accountId = getAccountIdFromPath(pathname);

  // Fetch account type and current account info
  React.useEffect(() => {
    const fetchAccount = async () => {
      if (accountId) {
        try {
          const response = await fetch(`/api/accounts/${accountId}/public`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
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
    router.push("/login");
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar
          sx={{
            minHeight: "64px !important",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left side - Main navigation */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
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
              <HomeIcon />
            </IconButton>
            <SportsSoccer sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              <MuiLink
                onClick={handleHomeClick}
                sx={{
                  color: "inherit",
                  textDecoration: "none",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Draco Sports Manager
              </MuiLink>
            </Typography>
          </Box>

          {/* Center - Baseball menu (only for baseball accounts) */}
          {accountType === "Baseball" && accountId && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <BaseballMenu accountId={accountId} />
            </Box>
          )}

          {/* Right side - User info and actions */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {user ? (
              <>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Hello, {user.username || user.email}
                </Typography>
                {currentAccount && (
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Account: {typeof currentAccount.name === 'string' ? currentAccount.name : ''}
                  </Typography>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button color="inherit" onClick={handleLogin}>
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hamburger Menu */}
      {user && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={() => handleNavigation("/")}> 
            <ListItemIcon><HomeIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Home</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/dashboard")}> 
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/accounts")}> 
            <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Accounts</ListItemText>
          </MenuItem>
          {hasRole("93DAC465-4C64-4422-B444-3CE79C549329") && (
            <MenuItem onClick={() => handleNavigation("/admin")}> 
              <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Admin Dashboard</ListItemText>
            </MenuItem>
          )}
          {hasRole("93DAC465-4C64-4422-B444-3CE79C549329") && (
            <MenuItem onClick={() => handleNavigation("/account-management")}> 
              <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Account Management</ListItemText>
            </MenuItem>
          )}
          {hasRole("93DAC465-4C64-4422-B444-3CE79C549329") && (
            <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/seasons`)}>
              <ListItemIcon><CalendarMonthIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Season Management</ListItemText>
            </MenuItem>
          )}
          {/* Account Admin Only */}
          {hasRole("5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A") && (
            <>
              <MenuItem onClick={() => handleNavigation("/account-management")}> 
                <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Account Management</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/management`)}>
                <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Current Account</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/settings`)}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Account Settings</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/seasons`)}>
                <ListItemIcon><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Season Management</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/schedule`)}>
                <ListItemIcon><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Schedule Management</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleNavigation(`/account/${currentAccount?.id || "1"}/teams`)}>
                <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Teams</ListItemText>
              </MenuItem>
            </>
          )}
          {/* League Admin Only */}
          {hasRole("672DDF06-21AC-4D7C-B025-9319CC69281A") && (
            <MenuItem onClick={() => handleNavigation("/league-management")}> 
              <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
              <ListItemText>League Management</ListItemText>
            </MenuItem>
          )}
          {/* Team Admin Only */}
          {hasRole("777D771B-1CBA-4126-B8F3-DD7F3478D40E") && (
            <MenuItem onClick={() => handleNavigation("/team-management")}> 
              <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Team Management</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => handleNavigation("/settings")}> 
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/permission-test")}> 
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Permission Test</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/role-debug")}> 
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Role Debug</ListItemText>
          </MenuItem>
        </Menu>
      )}

      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
