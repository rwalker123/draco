'use client';

import React from 'react';
import { Alert, Box, CircularProgress, Link as MuiLink, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import type { TeamManagerType } from '@draco/shared-schemas';
import { listTeamManagers } from '@draco/shared-api-client';
import { unwrapApiResult } from '@/utils/apiResult';
import WidgetShell from '@/components/ui/WidgetShell';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@/context/AuthContext';
import { getContactDisplayName } from '@/utils/contactUtils';
import { formatPhoneNumber } from '@/utils/phoneNumber';
import EditableContactAvatar from '@/components/users/EditableContactAvatar';
import { ContactTransformationService } from '@/services/contactTransformationService';

interface TeamManagersWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  canViewContactInfo: boolean;
  teamName?: string | null;
  canEditPhotos?: boolean;
}

const TeamManagersWidget: React.FC<TeamManagersWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  canViewContactInfo,
  teamName,
  canEditPhotos = false,
}) => {
  const apiClient = useApiClient();
  const { token } = useAuth();

  const [managers, setManagers] = React.useState<TeamManagerType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadManagers = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const result = await listTeamManagers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
          signal,
          ...(token
            ? {
                security: [
                  {
                    type: 'http',
                    scheme: 'bearer',
                  } as const,
                ],
              }
            : {}),
        });
        const data = unwrapApiResult(result, 'Unable to load team managers') ?? [];
        const normalized = Array.isArray(data)
          ? data.map((manager) => {
              if (
                manager &&
                typeof manager === 'object' &&
                'contact' in manager &&
                manager.contact &&
                typeof manager.contact === 'object'
              ) {
                const transformedContact = ContactTransformationService.transformBackendContact(
                  manager.contact as Record<string, unknown>,
                );
                return { ...manager, contact: transformedContact };
              }
              return manager;
            })
          : [];
        setManagers(normalized as TeamManagerType[]);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load team managers.';
        setError(message);
        setManagers([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [accountId, apiClient, seasonId, teamSeasonId, token],
  );

  React.useEffect(() => {
    const controller = new AbortController();

    void loadManagers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadManagers]);

  const buildPhoneEntries = (manager: TeamManagerType) => {
    const contactDetails = manager.contact.contactDetails;
    const phoneFields: Array<{ label: string; value?: string | null }> = [
      { label: 'Home', value: contactDetails?.phone1 },
      { label: 'Cell', value: contactDetails?.phone2 },
      { label: 'Work', value: contactDetails?.phone3 },
    ];

    return phoneFields
      .map(({ label, value }) => {
        const formatted = formatPhoneNumber(value);
        if (!formatted) {
          return null;
        }
        const digits = formatted.replace(/\D/g, '');
        if (!digits) {
          return null;
        }
        return { label, display: formatted, href: `tel:${digits}` };
      })
      .filter((entry): entry is { label: string; display: string; href: string } => Boolean(entry));
  };

  const renderManager = (manager: TeamManagerType) => {
    const contact = manager.contact;
    const email = contact.email?.trim() ?? '';
    const showContactInfo = canViewContactInfo;
    const phoneEntries = showContactInfo ? buildPhoneEntries(manager) : [];
    const canEditManagerPhoto = Boolean(canEditPhotos && token);
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EditableContactAvatar
            accountId={accountId}
            contact={contact}
            size={40}
            canEdit={canEditManagerPhoto}
            onPhotoUpdated={() => loadManagers()}
            onError={setError}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {getContactDisplayName(contact)}
            </Typography>
            {manager.team?.name ? (
              <Typography variant="body2" color="text.secondary">
                {manager.team.name}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {showContactInfo && email ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <EmailIcon fontSize="small" color="action" />
            <MuiLink href={`mailto:${email}`} underline="hover" variant="body2">
              {email}
            </MuiLink>
          </Box>
        ) : null}
        {showContactInfo && phoneEntries.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.5 }}>
            {phoneEntries.map((entry) => (
              <Box key={`${manager.id}-${entry.label}`} sx={{ display: 'flex', gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                <MuiLink href={entry.href} underline="hover" variant="body2">
                  {entry.label}: {entry.display}
                </MuiLink>
              </Box>
            ))}
          </Box>
        ) : null}
        {showContactInfo && !email && phoneEntries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Contact details unavailable.
          </Typography>
        ) : null}
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 0 }}>
          {error}
        </Alert>
      );
    }

    if (managers.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No managers are assigned to this team yet.
        </Typography>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
        }}
      >
        {managers.map((manager) => (
          <Box
            key={manager.id}
            sx={{
              flex: '1 1 280px',
              minWidth: { xs: '100%', sm: 260 },
              maxWidth: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            {renderManager(manager)}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <WidgetShell
      title="Team Managers"
      subtitle={
        teamName
          ? `Direct contact details for the ${teamName} staff`
          : 'Direct contact details for this staff'
      }
      accent="info"
    >
      {renderContent()}
    </WidgetShell>
  );
};

export default TeamManagersWidget;
