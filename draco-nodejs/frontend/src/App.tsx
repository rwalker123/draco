import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Routes, Route } from 'react-router-dom';
import PasswordReset from './components/PasswordReset';
import Login from './components/Login';

function App() {
  return (
    <ThemeProvider theme={dracoTheme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
