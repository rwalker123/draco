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

const THEME_STORAGE_KEY = 'draco-theme';

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

const getInitialThemeName = (): ThemeName => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  if (typeof window.matchMedia === 'function') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      return 'dark';
    }
  }

  return 'light';
};

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeName, setCurrentThemeNameState] = useState<ThemeName>(() =>
    getInitialThemeName(),
  );

  const setCurrentThemeName = useCallback((name: ThemeName) => {
    setCurrentThemeNameState(name);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, name);
    }
  }, []);

  const currentTheme = useMemo(() => themesByName[currentThemeName], [currentThemeName]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', currentThemeName === 'dark');
  }, [currentThemeName]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const backgroundColor = currentTheme.palette.background.default;
    document.documentElement.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
    const nextRoot = document.getElementById('__next');
    if (nextRoot) {
      nextRoot.style.backgroundColor = backgroundColor;
    }
  }, [currentTheme]);

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
