'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Link,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, Close as CloseIcon } from '@mui/icons-material';
import { TeamsWantedContactInfoType } from '@draco/shared-schemas';

interface ContactInfoDialogProps {
  open: boolean;
  onClose: () => void;
  contactInfo: TeamsWantedContactInfoType | null;
  loading: boolean;
  error: string | null;
  playerName: string;
}

const ContactInfoDialog: React.FC<ContactInfoDialogProps> = ({
  open,
  onClose,
  contactInfo,
  loading,
  error,
  playerName,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="contact-info-dialog-title"
    >
      <DialogTitle id="contact-info-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Contact Information for {playerName}</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'grey.500' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={3}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading contact information...
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {contactInfo && !loading && !error && (
          <Box sx={{ py: 1 }}>
            {/* Email */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <EmailIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Link
                  href={`mailto:${contactInfo.email}`}
                  underline="hover"
                  color="primary"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {contactInfo.email}
                </Link>
              </Box>
            </Box>

            {/* Phone */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <PhoneIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Phone
                </Typography>
                <Link
                  href={`tel:${contactInfo.phone}`}
                  underline="hover"
                  color="primary"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {contactInfo.phone}
                </Link>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactInfoDialog;
