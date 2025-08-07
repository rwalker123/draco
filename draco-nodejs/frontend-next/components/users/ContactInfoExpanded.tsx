'use client';

import React, { useState } from 'react';
import { Stack, Typography, IconButton, Collapse, Box, Chip } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { ContactDetails } from '../../types/users';
import { hasContactDetails, getFormattedName } from '../../utils/contactUtils';
import ContactInfoDisplay from './ContactInfoDisplay';

interface ContactInfoExpandedProps {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string | null;
  contactDetails?: ContactDetails;
  initiallyExpanded?: boolean;
}

/**
 * ContactInfoExpanded Component
 * Expandable contact information display with toggle functionality
 */
const ContactInfoExpanded: React.FC<ContactInfoExpandedProps> = ({
  firstName,
  lastName,
  middleName,
  email,
  contactDetails,
  initiallyExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const hasDetails = hasContactDetails(contactDetails);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // If no contact details, just show basic info
  if (!hasDetails) {
    return (
      <Typography variant="body2" color="text.secondary">
        {getFormattedName(firstName, lastName, middleName)}
      </Typography>
    );
  }

  return (
    <Box>
      {/* Header with toggle */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" fontWeight="bold">
          {getFormattedName(firstName, lastName, middleName)}
        </Typography>

        <IconButton size="small" onClick={handleToggle} sx={{ p: 0.5 }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        {/* Quick summary chips */}
        <Stack direction="row" spacing={0.5}>
          {(contactDetails?.phone1 || contactDetails?.phone2 || contactDetails?.phone3) && (
            <Chip label="📞" size="small" variant="outlined" sx={{ minWidth: 'auto', px: 0.5 }} />
          )}
          {contactDetails?.streetaddress && (
            <Chip label="📍" size="small" variant="outlined" sx={{ minWidth: 'auto', px: 0.5 }} />
          )}
          {contactDetails?.dateofbirth && (
            <Chip label="🎂" size="small" variant="outlined" sx={{ minWidth: 'auto', px: 0.5 }} />
          )}
        </Stack>
      </Stack>

      {/* Expandable content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1, pl: 2 }}>
          <ContactInfoDisplay
            firstName={firstName}
            lastName={lastName}
            middleName={middleName}
            email={email}
            contactDetails={contactDetails}
            showHeader={false}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default ContactInfoExpanded;
