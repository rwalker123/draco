'use client';

import { ThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme, darkTheme } from '../theme';
import Layout from './Layout';
import React, {
  createContext,
  useContext,
  Suspense,
  useMemo,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react';
import EmotionCacheProvider from './EmotionCacheProvider';

const THEME_STORAGE_KEY = 'draco-theme';

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

type ThemeListener = () => void;

const listeners = new Set<ThemeListener>();
let unsubscribeExternal: (() => void) | null = null;
let clientThemeSnapshot: ThemeName = 'light';

const logThemeEvent = (...params: unknown[]) => {
  if (typeof console !== 'undefined') {
    console.info('[ThemeClientProvider]', ...params);
  }
};

const readStoredTheme = (): ThemeName | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
};

const readSystemTheme = (): ThemeName => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDocument = (name: ThemeName) => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle('dark', name === 'dark');
  root.setAttribute('data-theme', name);
  const body = document.body;
  body.style.backgroundColor = name === 'dark' ? '#1e1e1e' : '#f4f6fb';
  body.style.color = name === 'dark' ? '#e0e0e0' : '#0f172a';
  logThemeEvent('applied theme', name);
};

const emitThemeChange = () => {
  listeners.forEach((listener) => listener());
};

const ensureExternalListeners = () => {
  if (unsubscribeExternal || typeof window === 'undefined') {
    return;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== THEME_STORAGE_KEY) {
      return;
    }
    const stored = readStoredTheme();
    if (stored && stored !== clientThemeSnapshot) {
      clientThemeSnapshot = stored;
      logThemeEvent('storage preference change', stored);
      emitThemeChange();
      return;
    }
    if (!stored) {
      const systemTheme = readSystemTheme();
      if (systemTheme !== clientThemeSnapshot) {
        clientThemeSnapshot = systemTheme;
        logThemeEvent('system preference change', systemTheme);
        emitThemeChange();
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  let mediaQuery: MediaQueryList | null = null;
  const handleMediaChange = (event: MediaQueryListEvent) => {
    if (readStoredTheme()) {
      return;
    }
    const next = event.matches ? 'dark' : 'light';
    if (next !== clientThemeSnapshot) {
      clientThemeSnapshot = next;
      logThemeEvent('system preference change', next);
      emitThemeChange();
    }
  };

  if (typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMediaChange);
    }
  }

  unsubscribeExternal = () => {
    window.removeEventListener('storage', handleStorage);
    if (mediaQuery) {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleMediaChange);
      }
    }
    unsubscribeExternal = null;
  };
};

const subscribeThemeStore = (listener: ThemeListener) => {
  listeners.add(listener);
  ensureExternalListeners();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && unsubscribeExternal) {
      unsubscribeExternal();
    }
  };
};

const getClientSnapshotFactory = (initialTheme: ThemeName) => () => {
  if (typeof window === 'undefined') {
    return initialTheme;
  }
  const stored = readStoredTheme();
  if (stored) {
    clientThemeSnapshot = stored;
    return stored;
  }
  const systemTheme = readSystemTheme();
  clientThemeSnapshot = systemTheme;
  return systemTheme;
};

const getServerSnapshotFactory = (initialTheme: ThemeName) => () => initialTheme;

const setThemePreference = (nextTheme: ThemeName) => {
  clientThemeSnapshot = nextTheme;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.cookie = `${THEME_STORAGE_KEY}=${nextTheme}; path=/; max-age=31536000`;
  }
  logThemeEvent('set preference', nextTheme);
  emitThemeChange();
};

interface ThemeClientProviderProps {
  children: React.ReactNode;
  initialThemeName?: ThemeName;
}

export default function ThemeClientProvider({
  children,
  initialThemeName = 'light',
}: ThemeClientProviderProps) {
  const clientSnapshot = useMemo(
    () => getClientSnapshotFactory(initialThemeName),
    [initialThemeName],
  );
  const serverSnapshot = useMemo(
    () => getServerSnapshotFactory(initialThemeName),
    [initialThemeName],
  );

  const themeName = useSyncExternalStore(subscribeThemeStore, clientSnapshot, serverSnapshot);

  useEffect(() => {
    applyThemeToDocument(themeName);
  }, [themeName]);

  const setCurrentThemeName = useCallback((name: ThemeName) => {
    setThemePreference(name);
  }, []);

  const currentTheme = useMemo(() => themesByName[themeName], [themeName]);

  const value = useMemo(
    () => ({
      currentTheme,
      currentThemeName: themeName,
      setCurrentThemeName,
    }),
    [currentTheme, setCurrentThemeName, themeName],
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
