import type { ReactNode } from 'react';
import { Box, Typography, Card, CardContent, Fab, Tooltip } from '@mui/material';
import { Add as AddIcon, Description as TemplateIcon } from '@mui/icons-material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRole } from '../../../../context/RoleContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import EmailHistoryPanel from '../../../../components/emails/history/EmailHistoryPanel';

interface QuickAction {
  title: string;
  description: string;
  icon: ReactNode;
  action: () => void;
  color: 'primary' | 'secondary' | 'success' | 'info';
  disabled?: boolean;
}

export default function Communications() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId || '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useRole();

  const isTemplateEnabled = searchParams.get('enableTemplate') === 'true';

  const canManage =
    hasRole('ContactAdmin', { accountId: accountIdStr }) ||
    hasRole('AccountAdmin', { accountId: accountIdStr });

  const quickActions: QuickAction[] = [];

  if (isTemplateEnabled) {
    quickActions.push({
      title: 'Email Templates',
      description: 'Manage reusable email templates',
      icon: <TemplateIcon sx={{ fontSize: 40 }} />,
      action: () => router.push(`/account/${accountIdStr}/communications/templates`),
      color: 'info',
      disabled: !canManage, // Only ContactAdmin+ can manage templates
    });
  }

  const visibleQuickActions = canManage ? quickActions : [];

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountIdStr}>
          <Box textAlign="center">
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}
            >
              Communications
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', opacity: 0.85 }}>
              Send messages, manage templates, and review delivery history for your organization.
            </Typography>
          </Box>
        </AccountPageHeader>

        <Box sx={{ p: 3 }}>
          {visibleQuickActions.length > 0 && (
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
                mb: 4,
              }}
            >
              {visibleQuickActions.map((action, index) => (
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
          )}

          <EmailHistoryPanel accountId={accountIdStr} />
        </Box>

        {accountIdStr && (
          <Tooltip title="Compose email">
            <span>
              <Fab
                color="primary"
                onClick={() => router.push(`/account/${accountIdStr}/communications/compose`)}
                sx={{
                  position: 'fixed',
                  bottom: (theme) => theme.spacing(4),
                  right: (theme) => theme.spacing(4),
                }}
              >
                <AddIcon />
              </Fab>
            </span>
          </Tooltip>
        )}
      </main>
    </ProtectedRoute>
  );
}
