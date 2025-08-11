'use client';

import { ThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme } from '../theme';
import Layout from './Layout';
import React, { useState, createContext, useContext, Suspense } from 'react';

// Create context for theme management
interface ThemeContextType {
  currentTheme: Theme;
  setCurrentTheme: (theme: Theme) => void;
  currentThemeName: string;
  setCurrentThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeClientProvider');
  }
  return context;
};

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(dracoTheme);
  const [currentThemeName, setCurrentThemeName] = useState('baseball');

  const value = {
    currentTheme,
    setCurrentTheme,
    currentThemeName,
    setCurrentThemeName,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <Suspense fallback={null}>
          <Layout>{children}</Layout>
        </Suspense>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
