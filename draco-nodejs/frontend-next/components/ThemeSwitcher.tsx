'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import {
  Palette as PaletteIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  SportsBasketball as BasketballIcon,
  SportsHockey as HockeyIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { useThemeContext } from './ThemeClientProvider';
import { dracoTheme, dracoThemeOptions } from '../theme';

const buildTheme = (overrides: ThemeOptions = {}) =>
  createTheme(deepmerge(deepmerge({}, dracoThemeOptions), overrides));

// Define different themes for testing
const themes = {
  baseball: dracoTheme,
  soccer: buildTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2e7d32', // Green
        light: '#4caf50',
        dark: '#1b5e20',
      },
      secondary: {
        main: '#f57c00', // Orange
        light: '#ff9800',
        dark: '#e65100',
      },
      warning: {
        main: '#ffc107', // Amber
        light: '#ffd54f',
        dark: '#ff8f00',
      },
    },
  }),
  basketball: buildTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#d32f2f', // Red
        light: '#ef5350',
        dark: '#c62828',
      },
      secondary: {
        main: '#1976d2', // Blue
        light: '#42a5f5',
        dark: '#1565c0',
      },
      warning: {
        main: '#ff9800', // Orange
        light: '#ffb74d',
        dark: '#f57c00',
      },
    },
  }),
  hockey: buildTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#424242', // Grey
        light: '#616161',
        dark: '#212121',
      },
      secondary: {
        main: '#1976d2', // Blue
        light: '#42a5f5',
        dark: '#1565c0',
      },
      warning: {
        main: '#ff9800', // Orange
        light: '#ffb74d',
        dark: '#f57c00',
      },
    },
  }),
  dark: buildTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
        light: '#c3fdff',
        dark: '#42a5f5',
      },
      secondary: {
        main: '#f48fb1',
        light: '#f8bbd0',
        dark: '#f06292',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#e0e0e0',
        secondary: '#b0bec5',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  }),
};

const themeIcons = {
  baseball: BaseballIcon,
  soccer: SoccerIcon,
  basketball: BasketballIcon,
  hockey: HockeyIcon,
  dark: DarkModeIcon,
};

const themeNames = {
  baseball: 'Baseball',
  soccer: 'Soccer',
  basketball: 'Basketball',
  hockey: 'Hockey',
  dark: 'Dark Mode',
};

const ThemeSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentTheme, currentThemeName, setCurrentThemeName } = useThemeContext();

  const handleThemeSelect = (themeKey: keyof typeof themes) => {
    setCurrentTheme(themes[themeKey]);
    setCurrentThemeName(themeKey);
    setIsOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 9999 }}>
      <Tooltip title="Switch Theme">
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            bgcolor: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          <PaletteIcon />
        </IconButton>
      </Tooltip>

      {isOpen && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            p: 2,
            minWidth: 200,
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Choose Theme
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.keys(themes).map((key) => {
              const typedKey = key as keyof typeof themes;
              const IconComponent = themeIcons[typedKey] ?? PaletteIcon;
              const isActive = currentThemeName === typedKey;

              return (
                <Button
                  key={typedKey}
                  variant={isActive ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<IconComponent />}
                  onClick={() => handleThemeSelect(typedKey)}
                  sx={(theme) => ({
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    bgcolor: isActive ? theme.palette.primary.main : 'transparent',
                    color: isActive ? theme.palette.common.white : theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: isActive ? theme.palette.primary.dark : theme.palette.action.hover,
                    },
                  })}
                >
                  {themeNames[typedKey as keyof typeof themeNames] ?? key}
                </Button>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ThemeSwitcher;
