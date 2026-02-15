import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import type { BaseContact } from '@draco/shared-api-client';
import { BaseContactType } from '@draco/shared-schemas';
import { getAccountTodaysBirthdays } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import WidgetShell from '../ui/WidgetShell';

type TodaysBirthdaysCardProps = {
  accountId: string;
  hasActiveSeason: boolean;
};

const normalizeBirthdayContact = (contact: BaseContact): BaseContactType => {
  const details = contact.contactDetails;

  return {
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    middleName: contact.middleName?.trim() ? contact.middleName : undefined,
    email: contact.email?.trim() ? contact.email : undefined,
    userId: contact.userId?.trim() ? contact.userId : undefined,
    photoUrl: contact.photoUrl?.trim() ? contact.photoUrl : undefined,
    contactDetails: details
      ? {
          phone1: details.phone1 ?? null,
          phone2: details.phone2 ?? null,
          phone3: details.phone3 ?? null,
          streetAddress: details.streetAddress ?? null,
          city: details.city ?? null,
          state: details.state ?? null,
          zip: details.zip ?? null,
          dateOfBirth: details.dateOfBirth ?? null,
        }
      : undefined,
  };
};

const TodaysBirthdaysCard: React.FC<TodaysBirthdaysCardProps> = ({
  accountId,
  hasActiveSeason,
}) => {
  const apiClient = useApiClient();
  const theme = useTheme();
  const [birthdays, setBirthdays] = useState<BaseContactType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setBirthdays([]);
      return;
    }

    const controller = new AbortController();

    const fetchBirthdays = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountTodaysBirthdays({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const birthdaysResponse = unwrapApiResult<BaseContact[]>(
          result,
          'Birthdays are currently unavailable.',
        );
        const normalizedBirthdays = birthdaysResponse.map(normalizeBirthdayContact);
        setBirthdays(normalizedBirthdays);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch today's birthdays:", err);
        setError('Birthdays are currently unavailable.');
        setBirthdays([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBirthdays();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  const shouldHideCard = hasActiveSeason && !loading && !error && birthdays.length === 0;
  const shouldSkipInitialRender = hasActiveSeason && loading && !error && birthdays.length === 0;

  if (shouldSkipInitialRender) {
    return null;
  }

  if (shouldHideCard) {
    return null;
  }

  return (
    <WidgetShell
      title={
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Today&apos;s Birthdays
        </Typography>
      }
      accent="secondary"
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {!hasActiveSeason && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Birthdays will appear once an active season is selected.
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : birthdays.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            width: '100%',
          }}
        >
          {birthdays.map((contact) => (
            <Box
              key={contact.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1.25,
                borderRadius: 1.5,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.35)
                    : alpha(theme.palette.background.default, 0.4),
                border: `1px solid ${theme.palette.widget.border}`,
                boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 6 : 1],
                width: '100%',
              }}
            >
              <Box
                component="img"
                src={contact.photoUrl ?? ''}
                alt={`${contact.firstName} ${contact.lastName}`}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid',
                  borderColor: 'primary.light',
                  bgcolor: 'grey.100',
                }}
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {contact.firstName} {contact.lastName}
                </Typography>
                {contact.contactDetails?.dateOfBirth && (
                  <Typography variant="body2" color="text.secondary">
                    Born {contact.contactDetails.dateOfBirth}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No players are celebrating a birthday today.
        </Typography>
      )}
    </WidgetShell>
  );
};

export default TodaysBirthdaysCard;
