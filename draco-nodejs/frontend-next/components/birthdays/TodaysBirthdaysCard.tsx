import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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

    let ignore = false;

    const fetchBirthdays = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountTodaysBirthdays({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const birthdaysResponse = unwrapApiResult<BaseContact[]>(
          result,
          'Birthdays are currently unavailable.',
        );
        const normalizedBirthdays = birthdaysResponse.map(normalizeBirthdayContact);
        setBirthdays(normalizedBirthdays);
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch today's birthdays:", err);
          setError('Birthdays are currently unavailable.');
          setBirthdays([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBirthdays();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient]);

  const shouldHideCard = hasActiveSeason && !loading && !error && birthdays.length === 0;

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
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {birthdays.map((contact) => (
            <Box
              key={contact.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: theme.palette.widget.surface,
                border: `1px solid ${theme.palette.widget.border}`,
                boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 8 : 1],
                minWidth: 220,
                maxWidth: 320,
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: '260px',
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
