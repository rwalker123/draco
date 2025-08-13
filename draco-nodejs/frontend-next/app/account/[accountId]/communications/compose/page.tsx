'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

import { EmailComposePage } from '../../../../../components/emails/compose';
import { useAuth } from '../../../../../context/AuthContext';
import { RecipientContact, TeamGroup, RoleGroup } from '../../../../../types/emails/recipients';
import { EmailComposeRequest } from '../../../../../types/emails/email';

export default function ComposePage() {
  const { accountId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<RecipientContact[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [initialData, setInitialData] = useState<Partial<EmailComposeRequest> | undefined>();

  const loadComposeData = useCallback(async () => {
    if (!token || !accountId) return;

    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data. In a real implementation, you would:
      // 1. Load contacts from the contacts API
      // 2. Load team groups from the teams API
      // 3. Load role groups from the roles API
      // 4. Handle any initial data from URL params (reply, forward, template, etc.)

      // Mock contacts data - replace with actual API calls
      const mockContacts: RecipientContact[] = [
        {
          id: '1',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-0123',
          displayName: 'John Doe',
          hasValidEmail: true,
          roles: [{ id: '1', roleId: '1', roleName: 'Manager', roleData: 'manager' }],
        },
        {
          id: '2',
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane.smith@example.com',
          phone: '555-0124',
          displayName: 'Jane Smith',
          hasValidEmail: true,
          roles: [{ id: '2', roleId: '2', roleName: 'Player', roleData: 'player' }],
        },
        // Add more mock contacts as needed
      ];

      // Mock team groups
      const mockTeamGroups: TeamGroup[] = [
        {
          id: 'team-1',
          name: 'Baseball Team A',
          type: 'all' as const,
          description: 'Full team roster',
          members: mockContacts.slice(0, 2),
        },
      ];

      // Mock role groups
      const mockRoleGroups: RoleGroup[] = [
        {
          id: 'role-1',
          name: 'Managers',
          roleId: 'role-1',
          roleType: 'CONTACT_ADMIN',
          permissions: ['VIEW', 'EDIT'],
          members: [mockContacts[0]],
        },
        {
          id: 'role-2',
          name: 'Players',
          roleId: 'role-2',
          roleType: 'CONTACT',
          permissions: ['VIEW'],
          members: [mockContacts[1]],
        },
      ];

      // Check for initial data from URL params
      const templateId = searchParams.get('template');
      const subject = searchParams.get('subject');
      const body = searchParams.get('body');

      let composeInitialData: Partial<EmailComposeRequest> | undefined;
      if (subject || body || templateId) {
        composeInitialData = {
          subject: subject || '',
          body: body || '',
          templateId: templateId || undefined,
        };
      }

      setContacts(mockContacts);
      setTeamGroups(mockTeamGroups);
      setRoleGroups(mockRoleGroups);
      setInitialData(composeInitialData);
    } catch (err) {
      console.error('Failed to load compose data:', err);
      setError('Failed to load email composition data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, accountId, searchParams]);

  // Load data on mount
  useEffect(() => {
    if (token && accountId) {
      loadComposeData();
    }
  }, [token, accountId, loadComposeData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push(`/account/${accountId}/communications`);
  }, [router, accountId]);

  // Handle send completion
  const handleSendComplete = useCallback(
    (emailId: string) => {
      // Navigate back to communications page or show success message
      router.push(`/account/${accountId}/communications?sent=${emailId}`);
    },
    [router, accountId],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/account/${accountId}/communications`);
  }, [router, accountId]);

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Loading email composer...
          </Typography>
        </Box>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <Box sx={{ p: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Communications
          </Button>

          <Alert
            severity="error"
            action={
              <Button size="small" onClick={loadComposeData}>
                Retry
              </Button>
            }
          >
            <Typography variant="h6">Failed to Load</Typography>
            {error}
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  // Render the complete email compose interface
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small" color="inherit">
            Back to Communications
          </Button>
        </Box>

        {/* Main Compose Interface */}
        <Box sx={{ flex: 1 }}>
          <EmailComposePage
            accountId={accountId as string}
            initialData={initialData}
            contacts={contacts}
            teamGroups={teamGroups}
            roleGroups={roleGroups}
            onSendComplete={handleSendComplete}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
