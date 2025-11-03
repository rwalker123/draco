'use client';

import { ThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme, darkTheme } from '../theme';
import Layout from './Layout';
import React, {
  useState,
  createContext,
  useContext,
  Suspense,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import EmotionCacheProvider from './EmotionCacheProvider';

// Create context for theme management
type ThemeName = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: Theme;
  currentThemeName: ThemeName;
  setCurrentThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeClientProvider');
  }
  return context;
};

const themesByName: Record<ThemeName, Theme> = {
  light: dracoTheme,
  dark: darkTheme,
};

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeName, setCurrentThemeNameState] = useState<ThemeName>('light');

  const setCurrentThemeName = useCallback((name: ThemeName) => {
    setCurrentThemeNameState(name);
  }, []);

  const currentTheme = useMemo(() => themesByName[currentThemeName], [currentThemeName]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', currentThemeName === 'dark');
  }, [currentThemeName]);

  const value = useMemo(
    () => ({
      currentTheme,
      currentThemeName,
      setCurrentThemeName,
    }),
    [currentTheme, currentThemeName, setCurrentThemeName],
  );

  return (
    <EmotionCacheProvider>
      <ThemeContext.Provider value={value}>
        <ThemeProvider theme={currentTheme}>
          <CssBaseline />
          <Suspense fallback={<div />}>
            <Layout>{children}</Layout>
          </Suspense>
        </ThemeProvider>
      </ThemeContext.Provider>
    </EmotionCacheProvider>
  );
}
