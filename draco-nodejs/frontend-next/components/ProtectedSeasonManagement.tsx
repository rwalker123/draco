import React from 'react';
import { RequireAuth, RequireAccountAdmin } from './ProtectedRoute';
import SeasonManagement from './SeasonManagement';

const ProtectedSeasonManagement: React.FC = () => {
  return (
    <RequireAuth>
      <RequireAccountAdmin>
        <SeasonManagement />
      </RequireAccountAdmin>
    </RequireAuth>
  );
};

export default ProtectedSeasonManagement; 