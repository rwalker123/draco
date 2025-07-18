'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import {
  Palette as PaletteIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  SportsBasketball as BasketballIcon,
  SportsHockey as HockeyIcon,
} from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';
import { useThemeContext } from './ThemeClientProvider';

// Define different themes for testing
const themes = {
  baseball: createTheme({
    palette: {
      primary: {
        main: '#1976d2', // Blue
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e', // Red
        light: '#ff5983',
        dark: '#9a0036',
      },
      warning: {
        main: '#ed6c02', // Orange
        light: '#ff9800',
        dark: '#e65100',
      },
    },
  }),
  soccer: createTheme({
    palette: {
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
  basketball: createTheme({
    palette: {
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
  hockey: createTheme({
    palette: {
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
};

const themeIcons = {
  baseball: BaseballIcon,
  soccer: SoccerIcon,
  basketball: BasketballIcon,
  hockey: HockeyIcon,
};

const themeNames = {
  baseball: 'Baseball',
  soccer: 'Soccer',
  basketball: 'Basketball',
  hockey: 'Hockey',
};

const ThemeSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentTheme, currentThemeName, setCurrentThemeName } = useThemeContext();

  const handleThemeSelect = (themeKey: string) => {
    setCurrentTheme(themes[themeKey as keyof typeof themes]);
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
            {Object.entries(themes).map(([key, _theme]) => {
              const IconComponent = themeIcons[key as keyof typeof themeIcons];
              const isActive = currentThemeName === key;

              return (
                <Button
                  key={key}
                  variant={isActive ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<IconComponent />}
                  onClick={() => handleThemeSelect(key)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'grey.100',
                    },
                  }}
                >
                  {themeNames[key as keyof typeof themeNames]}
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
