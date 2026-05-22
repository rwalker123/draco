'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import IntegrationsClient from './IntegrationsClient';

const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL;

export default function IntegrationsClientWrapper() {
  return (
    <ProtectedRoute checkAccountBoundary={false}>
      <IntegrationsClient mcpUrl={mcpUrl} />
    </ProtectedRoute>
  );
}
