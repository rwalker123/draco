'use client';

import React from 'react';
import { Stack, Typography, Card, CardContent, Divider, Chip, Box } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, Cake as CakeIcon } from '@mui/icons-material';
import { ContactDetails } from '../../types/users';
import { formatDateOfBirth, getFullName, hasContactDetails } from '../../utils/contactUtils';
import PhoneDisplay from './PhoneDisplay';
import AddressDisplay from './AddressDisplay';

interface ContactInfoDisplayProps {
  firstName: string;
  lastName: string;
  email: string | null;
  contactDetails?: ContactDetails;
  compact?: boolean;
  showHeader?: boolean;
}

/**
 * ContactInfoDisplay Component
 * Displays comprehensive contact information in a structured format
 */
const ContactInfoDisplay: React.FC<ContactInfoDisplayProps> = ({
  firstName,
  lastName,
  email,
  contactDetails,
  compact = false,
  showHeader = true,
}) => {
  const hasDetails = hasContactDetails(contactDetails);

  if (compact) {
    return (
      <Stack spacing={1}>
        {/* Basic Info */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonIcon color="action" fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            {getFullName(firstName, lastName, contactDetails?.middlename)}
          </Typography>
        </Stack>

        {email && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmailIcon color="action" fontSize="small" />
            <Typography variant="body2" noWrap>
              {email}
            </Typography>
          </Stack>
        )}

        {/* Contact Details Summary */}
        {hasDetails && (
          <Box>
            {contactDetails?.phone1 && (
              <Chip
                label={`📞 ${contactDetails.phone1}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
            {contactDetails?.streetaddress && (
              <Chip
                label={`📍 ${contactDetails.city || 'Address'}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
            {contactDetails?.dateofbirth && (
              <Chip
                label={`🎂 ${formatDateOfBirth(contactDetails.dateofbirth)}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
          </Box>
        )}
      </Stack>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      {showHeader && (
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
        </CardContent>
      )}

      <CardContent sx={{ pt: showHeader ? 0 : 2 }}>
        <Stack spacing={2}>
          {/* Basic Information */}
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon color="action" />
              <Typography variant="subtitle1" fontWeight="bold">
                {getFullName(firstName, lastName, contactDetails?.middlename)}
              </Typography>
            </Stack>

            {email && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2">{email}</Typography>
              </Stack>
            )}
          </Stack>

          {/* Contact Details */}
          {hasDetails && (
            <>
              <Divider />

              <Stack spacing={2}>
                {/* Phone Numbers */}
                <PhoneDisplay contactDetails={contactDetails!} />

                {/* Address */}
                <AddressDisplay contactDetails={contactDetails!} />

                {/* Date of Birth */}
                {contactDetails?.dateofbirth && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CakeIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Date of Birth:</strong>{' '}
                      {formatDateOfBirth(contactDetails.dateofbirth)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </>
          )}

          {/* No Details Message */}
          {!hasDetails && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No additional contact details available
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ContactInfoDisplay;
