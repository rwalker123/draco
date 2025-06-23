import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Article as NewsIcon,
  Score as ScoresIcon,
  Schedule as ScheduleIcon,
  TrendingUp as StatsIcon,
  EmojiEvents as StandingsIcon,
  Group as TeamsIcon,
  Menu as HamburgerIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BaseballMenuProps {
  accountId: string;
}

const BaseballMenu: React.FC<BaseballMenuProps> = ({ accountId }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuItems = [
    {
      label: 'News',
      icon: <NewsIcon />,
      path: `/account/${accountId}/news`,
    },
    {
      label: 'Scores',
      icon: <ScoresIcon />,
      path: `/account/${accountId}/scores`,
    },
    {
      label: 'Schedule',
      icon: <ScheduleIcon />,
      path: `/account/${accountId}/schedule`,
    },
    {
      label: 'Stats',
      icon: <StatsIcon />,
      path: `/account/${accountId}/statistics`,
    },
    {
      label: 'Standings',
      icon: <StandingsIcon />,
      path: `/account/${accountId}/standings`,
    },
    {
      label: 'Teams',
      icon: <TeamsIcon />,
      path: `/account/${accountId}/teams`,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Show full menu on large screens, hamburger on smaller screens
  if (isLargeScreen) {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        alignItems: 'center'
      }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <Button
              variant="text"
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
              sx={{
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem',
                px: 1,
                py: 0.5,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                },
                '&:active': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500
                }}
              >
                {item.label}
              </Typography>
            </Button>
            {index < menuItems.length - 1 && (
              <Divider 
                orientation="vertical" 
                flexItem 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  height: 20
                }} 
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  }

  // Show partial menu on medium screens, hamburger on small screens
  if (isMediumScreen) {
    const visibleItems = menuItems.slice(0, 3); // Show first 3 items
    const hiddenItems = menuItems.slice(3); // Hide last 3 items

    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        alignItems: 'center'
      }}>
        {visibleItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <Button
              variant="text"
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
              sx={{
                color: 'white',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem',
                px: 1,
                py: 0.5,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                },
                '&:active': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500
                }}
              >
                {item.label}
              </Typography>
            </Button>
            {index < visibleItems.length - 1 && (
              <Divider 
                orientation="vertical" 
                flexItem 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  height: 20
                }} 
              />
            )}
          </React.Fragment>
        ))}
        
        {/* Hamburger menu for remaining items */}
        <Divider 
          orientation="vertical" 
          flexItem 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            height: 20
          }} 
        />
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <HamburgerIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          {hiddenItems.map((item) => (
            <MenuItem key={item.label} onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Show only hamburger menu on small screens
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center'
    }}>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <HamburgerIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItems.map((item) => (
          <MenuItem key={item.label} onClick={() => handleNavigation(item.path)}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default BaseballMenu; 