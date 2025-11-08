import React from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Divider,
  Skeleton,
  Stack,
  Typography,
  Alert,
  Button,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import type { BaseContactType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import AccountOptional from '../account/AccountOptional';

interface ContactInfoCardProps {
  contact: BaseContactType | null;
  loading: boolean;
  error?: string | null;
  accountName?: string;
  onEdit?: () => void;
  surveyHref?: string;
  surveyAccountId?: string | null;
  infoMessage?: string | null;
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
  surveyHref,
  surveyAccountId,
  infoMessage,
}) => {
  const widgetShellSx = { p: 4 };

  if (loading) {
    return (
      <WidgetShell accent="primary" sx={widgetShellSx} data-testid="profile-contact-loading">
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
      </WidgetShell>
    );
  }

  if (error) {
    return (
      <WidgetShell accent="primary" sx={widgetShellSx}>
        <Alert severity="error" data-testid="profile-contact-error">
          {error}
        </Alert>
      </WidgetShell>
    );
  }

  if (!contact) {
    return (
      <WidgetShell title="Contact Information" accent="primary" sx={widgetShellSx}>
        <Alert severity="info" data-testid="profile-contact-info">
          {infoMessage ?? <>Not a member of this organization.</>}
        </Alert>
      </WidgetShell>
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
  const surveyButton =
    surveyHref && surveyAccountId ? (
      <AccountOptional accountId={surveyAccountId} componentId="profile.contactSurvey.link">
        <Tooltip title="Open player survey">
          <Button
            component={NextLink}
            href={surveyHref}
            variant="contained"
            size="small"
            color="primary"
            data-testid="profile-contact-survey-link"
            sx={{ minWidth: 36, px: 1 }}
          >
            <DescriptionIcon fontSize="small" />
          </Button>
        </Tooltip>
      </AccountOptional>
    ) : null;

  const actionButtons =
    surveyButton || onEdit ? (
      <Stack direction="row" spacing={1}>
        {surveyButton}
        {onEdit && (
          <Tooltip title="Edit contact information">
            <Button
              variant="outlined"
              size="small"
              onClick={onEdit}
              data-testid="profile-contact-edit-button"
              sx={{ minWidth: 36, px: 1 }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
        )}
      </Stack>
    ) : null;

  const addressLine = [streetAddress, [city, state].filter(Boolean).join(', '), zip]
    .filter((line) => line && line.trim().length > 0)
    .join('\n');

  const headerContent = (
    <Stack spacing={2.5}>
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
            <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.primary">
              {contact.firstName} {contact.lastName}
            </Typography>
            {accountName && (
              <Typography variant="body2" color="text.secondary">
                {accountName}
              </Typography>
            )}
          </Box>
        </Box>
        {actionButtons}
      </Box>
      <Divider sx={{ borderColor: 'widget.border' }} />
    </Stack>
  );

  return (
    <WidgetShell
      accent="primary"
      sx={widgetShellSx}
      data-testid="profile-contact-card"
      headerContent={headerContent}
    >
      <Stack spacing={2.5}>
        <Stack spacing={1.5}>
          {renderContactField('Email', contact.email ?? '')}
          {renderContactField('Primary Phone', primaryPhone)}
          {renderContactField('Secondary Phone', secondaryPhone)}
          {renderContactField('Additional Phone', tertiaryPhone)}
          {renderContactField('Date of Birth', formattedDateOfBirth)}
        </Stack>

        {addressLine && (
          <Box sx={{ pt: 0.5 }}>
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
    </WidgetShell>
  );
};

export default ContactInfoCard;
