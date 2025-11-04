'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { useThemeContext } from './ThemeClientProvider';

const ThemeSwitcher: React.FC = () => {
  const { currentThemeName, setCurrentThemeName } = useThemeContext();
  const isDark = currentThemeName === 'dark';

  const handleToggle = () => {
    setCurrentThemeName(isDark ? 'light' : 'dark');
  };

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        color="inherit"
        onClick={handleToggle}
        aria-label={isDark ? 'Activate light mode' : 'Activate dark mode'}
        size="small"
      >
        {isDark ? <LightModeIcon fontSize="inherit" /> : <DarkModeIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeSwitcher;
