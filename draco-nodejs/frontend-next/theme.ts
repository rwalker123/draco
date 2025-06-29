import { createTheme } from '@mui/material/styles';

export const dracoTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue for sports
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e', // Red for competition
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1976d2',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#1976d2',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#1976d2',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1976d2',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#1976d2',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1976d2',
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
}); 