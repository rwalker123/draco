import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

interface WidgetPalette {
  surface: string;
  border: string;
  headerText: string;
  supportingText: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    widget: WidgetPalette;
  }

  interface PaletteOptions {
    widget?: Partial<WidgetPalette>;
  }
}

export const dracoThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#1d4ed8', // Vibrant team blue
      light: '#60a5fa',
      dark: '#1e3a8a',
    },
    secondary: {
      main: '#e11d48', // Energetic accent
      light: '#f472b6',
      dark: '#be123c',
    },
    background: {
      default: '#f4f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    widget: {
      surface: '#ffffff',
      border: '#e2e8f0',
      headerText: '#0f172a',
      supportingText: '#475569',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1d4ed8',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#1d4ed8',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#1d4ed8',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1d4ed8',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#1d4ed8',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1d4ed8',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
};

const darkThemeOverrides: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#f472b6',
      light: '#f9a8d4',
      dark: '#be185d',
    },
    background: {
      default: '#1e1e1e',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0bec5',
    },
    widget: {
      surface: '#0f172a',
      border: '#1f2937',
      headerText: '#f8fafc',
      supportingText: '#94a3b8',
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
};

const addCssBaselineOverrides = (options: ThemeOptions) => {
  const baseTheme = createTheme(options);
  const components = baseTheme.components ?? {};
  const existingStyleOverrides = (components.MuiCssBaseline?.styleOverrides ?? {}) as Record<
    string,
    unknown
  >;

  const mergedOverrides = deepmerge(existingStyleOverrides, {
    html: {
      backgroundColor: baseTheme.palette.background.default,
    },
    body: {
      backgroundColor: baseTheme.palette.background.default,
      color: baseTheme.palette.text.primary,
      margin: 0,
    },
    '#__next': {
      minHeight: '100%',
      backgroundColor: baseTheme.palette.background.default,
    },
  });

  return createTheme(baseTheme, {
    components: {
      MuiCssBaseline: {
        ...(components.MuiCssBaseline ?? {}),
        styleOverrides: mergedOverrides,
      },
    },
  });
};

export const dracoTheme = addCssBaselineOverrides(dracoThemeOptions);
export const darkTheme = addCssBaselineOverrides(
  deepmerge(dracoThemeOptions, darkThemeOverrides, { clone: true }),
);
