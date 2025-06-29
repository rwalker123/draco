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
  Link as MuiLink,
} from "@mui/material";
import {
  SportsSoccer,
  Menu as MenuIcon,
  Home,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import BaseballMenu from "./BaseballMenu";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, clearAllContexts } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
      const accountId = getAccountIdFromPath(pathname);
      if (accountId && pathname.includes(`/account/${accountId}`)) {
        try {
          const response = await fetch(`/api/accounts/${accountId}/public`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAccountType(data.data.account.accountType);
              // console.log("Account type detected:", data.data.account.accountType);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch account type:", err);
        }
      } else {
        setAccountType(null);
      }
    };

    checkAccountType();
  }, [pathname]);

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

  const accountId = getAccountIdFromPath(pathname);

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
              <Home />
            </IconButton>
            <SportsSoccer sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              <MuiLink
                onClick={handleHomeClick}
                sx={{
                  color: "inherit",
                  textDecoration: "none",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
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
                  {user.email}
                </Typography>
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
      {/* Hamburger menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleNavigation("/dashboard")}>Dashboard</MenuItem>
        <MenuItem onClick={() => handleNavigation("/accounts")}>Accounts</MenuItem>
        <MenuItem onClick={() => handleNavigation("/admin")}>Admin</MenuItem>
        {/* Add more menu items as needed */}
      </Menu>
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};
