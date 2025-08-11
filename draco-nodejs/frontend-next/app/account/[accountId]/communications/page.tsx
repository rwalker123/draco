'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useRole } from '../../../../context/RoleContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: 'primary' | 'secondary' | 'success' | 'info';
  disabled?: boolean;
}

export default function CommunicationsPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { hasRole } = useRole();
  const [comingSoonAlert, setComingSoonAlert] = useState(true);

  const canManage =
    hasRole('ContactAdmin', { accountId: accountId as string }) ||
    hasRole('AccountAdmin', { accountId: accountId as string });

  const quickActions: QuickAction[] = [
    {
      title: 'Quick Email',
      description: 'Send a quick email using your default email app',
      icon: <EmailIcon sx={{ fontSize: 40 }} />,
      action: () => router.push(`/account/${accountId}/communications/compose?mode=quick`),
      color: 'primary',
    },
    {
      title: 'Compose Email',
      description: 'Create and send emails with templates and attachments',
      icon: <SendIcon sx={{ fontSize: 40 }} />,
      action: () => router.push(`/account/${accountId}/communications/compose`),
      color: 'secondary',
      disabled: false, // Phase 2 backend is ready!
    },
    {
      title: 'Email Templates',
      description: 'Manage reusable email templates',
      icon: <TemplateIcon sx={{ fontSize: 40 }} />,
      action: () => router.push(`/account/${accountId}/communications/templates`),
      color: 'info',
      disabled: !canManage, // Only ContactAdmin+ can manage templates
    },
    {
      title: 'Email History',
      description: 'View sent emails and delivery status',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      action: () => router.push(`/account/${accountId}/communications/history`),
      color: 'success',
      disabled: false, // Phase 2 backend supports email tracking
    },
  ];

  if (!canManage) {
    // Filter out management-only actions for regular contacts
    quickActions.splice(2, 1); // Remove templates
  }

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Communications
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Send emails to contacts, team members, and manage communications for your organization.
        </Typography>

        {comingSoonAlert && (
          <Alert severity="success" onClose={() => setComingSoonAlert(false)} sx={{ mb: 3 }}>
            <AlertTitle>Phase 2 - Server-Side Email System</AlertTitle>
            Advanced email features are now available! Send bulk emails with templates, attachments,
            and delivery tracking. Basic mailto functionality remains available for quick messages.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mt: 2,
          }}
        >
          {quickActions.map((action, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.6 : 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': action.disabled
                  ? {}
                  : {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
              }}
              onClick={action.disabled ? undefined : action.action}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    color: action.disabled ? 'text.disabled' : `${action.color}.main`,
                    mb: 2,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
                {action.disabled && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Coming Soon
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Getting Started Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Getting Started
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Quick Email
                </Typography>
                <Typography variant="body2" paragraph>
                  The easiest way to send emails. Click any email button throughout the app to open
                  a quick compose dialog that opens your default email application.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/account/${accountId}/users`)}
                  >
                    View Contacts
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  Advanced Features (Now Available!)
                </Typography>
                <Typography variant="body2" paragraph>
                  Server-side email system with rich text composition, templates, file attachments,
                  bulk sending, and delivery tracking is now ready. Frontend interface coming soon.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/account/${accountId}/communications/templates`)}
                  >
                    Templates
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/account/${accountId}/communications/history`)}
                  >
                    Analytics
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
