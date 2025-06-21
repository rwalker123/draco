import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dracoTheme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Routes, Route } from 'react-router-dom';
import PasswordReset from './components/PasswordReset';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import AccountManagement from './components/AccountManagement';
import ProtectedAccountManagement from './components/ProtectedAccountManagement';
import ProtectedSeasonManagement from './components/ProtectedSeasonManagement';
import ProtectedLeagueSeasonManagement from './components/ProtectedLeagueSeasonManagement';
import PermissionTest from './components/PermissionTest';
import RoleDebug from './components/RoleDebug';
import { RequireAuth } from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={dracoTheme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/account/:accountId/management" element={<AccountManagement />} />
          <Route path="/account-management" element={
            <RequireAuth>
              <ProtectedAccountManagement />
            </RequireAuth>
          } />
          <Route path="/account/:accountId/seasons" element={<ProtectedSeasonManagement />} />
          <Route path="/account/:accountId/seasons/:seasonId/league-seasons" element={<ProtectedLeagueSeasonManagement />} />
          <Route path="/permission-test" element={<PermissionTest />} />
          <Route path="/role-debug" element={<RoleDebug />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
