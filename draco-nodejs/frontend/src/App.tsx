import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <ThemeProvider theme={dracoTheme}>
      <CssBaseline />
      <Layout>
        <Dashboard />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
