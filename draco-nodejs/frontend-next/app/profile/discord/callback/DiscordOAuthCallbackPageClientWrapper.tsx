'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DiscordOAuthCallbackPageClient from './DiscordOAuthCallbackPageClient';

export default function DiscordOAuthCallbackPageClientWrapper() {
  return (
    <ProtectedRoute checkAccountBoundary={false}>
      <DiscordOAuthCallbackPageClient />
    </ProtectedRoute>
  );
}
