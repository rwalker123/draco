import React from 'react';
import {
  Avatar,
  Box,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import type { BaseContactType } from '@draco/shared-schemas';

interface ContactInfoCardProps {
  contact: BaseContactType | null;
  loading: boolean;
  error?: string | null;
  accountName?: string;
  onEdit?: () => void;
}

const renderContactField = (label: string, value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
};

const formatDateOfBirth = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return '';
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    const [year, month, day] = trimmedValue.split('-');
    return `${month}-${day}-${year}`;
  }

  const parsedDate = new Date(trimmedValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${month}-${day}-${year}`;
  }

  return trimmedValue;
};

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
  contact,
  loading,
  error,
  accountName,
  onEdit,
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }} data-testid="profile-contact-loading">
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={64} height={64} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="rectangular" height={80} />
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="error" data-testid="profile-contact-error">
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!contact) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Contact Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We could not find your contact details for this account yet. If you recently joined,
          please allow a moment for synchronization or contact your organization administrator.
        </Typography>
      </Paper>
    );
  }

  const primaryPhone = contact.contactDetails?.phone1 || '';
  const secondaryPhone = contact.contactDetails?.phone2 || '';
  const tertiaryPhone = contact.contactDetails?.phone3 || '';
  const streetAddress = contact.contactDetails?.streetAddress || '';
  const city = contact.contactDetails?.city || '';
  const state = contact.contactDetails?.state || '';
  const zip = contact.contactDetails?.zip || '';
  const dateOfBirth = contact.contactDetails?.dateOfBirth || '';
  const formattedDateOfBirth = formatDateOfBirth(dateOfBirth);

  const addressLine = [streetAddress, [city, state].filter(Boolean).join(', '), zip]
    .filter((line) => line && line.trim().length > 0)
    .join('\n');

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }} data-testid="profile-contact-card">
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={contact.photoUrl}
              alt={`${contact.firstName} ${contact.lastName}`}
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 28, fontWeight: 600 }}
            >
              {!contact.photoUrl ? contact.firstName?.[0] : undefined}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {contact.firstName} {contact.lastName}
              </Typography>
              {accountName && (
                <Typography variant="body2" color="text.secondary">
                  {accountName}
                </Typography>
              )}
            </Box>
          </Box>
          {onEdit && (
            <Button
              variant="outlined"
              size="small"
              onClick={onEdit}
              data-testid="profile-contact-edit-button"
            >
              Edit
            </Button>
          )}
        </Box>

        <Divider />

        <Stack spacing={2}>
          {renderContactField('Email', contact.email ?? '')}
          {renderContactField('Primary Phone', primaryPhone)}
          {renderContactField('Secondary Phone', secondaryPhone)}
          {renderContactField('Additional Phone', tertiaryPhone)}
          {renderContactField('Date of Birth', formattedDateOfBirth)}
        </Stack>

        {addressLine && (
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase' }}
            >
              Mailing Address
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontWeight: 600 }}>
              {addressLine}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default ContactInfoCard;
