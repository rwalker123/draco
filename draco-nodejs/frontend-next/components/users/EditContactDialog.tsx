'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Contact } from '../../types/users';
import { formatPhoneNumber } from '../../utils/contactUtils';
import {
  validateContactForm,
  hasValidationErrors,
  sanitizeContactFormData,
} from '../../utils/contactValidation';

interface EditContactDialogProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (contactData: ContactUpdateData) => Promise<void>;
  loading?: boolean;
}

export interface ContactUpdateData {
  firstName: string;
  lastName: string;
  middlename?: string;
  email: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  dateofbirth?: string;
}

/**
 * EditContactDialog Component
 * Dialog for editing contact information following existing patterns
 */
const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  contact,
  onClose,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ContactUpdateData>({
    firstName: '',
    lastName: '',
    middlename: '',
    email: '',
    phone1: '',
    phone2: '',
    phone3: '',
    streetaddress: '',
    city: '',
    state: '',
    zip: '',
    dateofbirth: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string>('');

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open && contact) {
      const contactDetails = contact.contactDetails;
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        middlename: contactDetails?.middlename || '',
        email: contact.email || '',
        phone1: contactDetails?.phone1 || '',
        phone2: contactDetails?.phone2 || '',
        phone3: contactDetails?.phone3 || '',
        streetaddress: contactDetails?.streetaddress || '',
        city: contactDetails?.city || '',
        state: contactDetails?.state || '',
        zip: contactDetails?.zip || '',
        dateofbirth: contactDetails?.dateofbirth || '',
      });
      setErrors({});
      setSaveError('');
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        firstName: '',
        lastName: '',
        middlename: '',
        email: '',
        phone1: '',
        phone2: '',
        phone3: '',
        streetaddress: '',
        city: '',
        state: '',
        zip: '',
        dateofbirth: '',
      });
      setErrors({});
      setSaveError('');
    }
  }, [open, contact]);

  const validateForm = (): boolean => {
    console.log('Validating form data:', formData); // Debug logging

    // Sanitize the form data first
    const sanitizedData = sanitizeContactFormData(formData);
    console.log('Sanitized form data:', sanitizedData); // Debug logging

    // Use the utility validation function
    const validationErrors = validateContactForm(sanitizedData);
    console.log('Validation errors:', validationErrors); // Debug logging

    setErrors(validationErrors);
    return !hasValidationErrors(validationErrors);
  };

  const handleInputChange =
    (field: keyof ContactUpdateData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear save error when user makes changes
      if (saveError) {
        setSaveError('');
      }
    };

  const handlePhoneChange =
    (field: 'phone1' | 'phone2' | 'phone3') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formattedPhone }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleDateChange = (date: Date | null) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    setFormData((prev) => ({ ...prev, dateofbirth: dateString }));

    // Clear field error when user selects date
    if (errors.dateofbirth) {
      setErrors((prev) => ({ ...prev, dateofbirth: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update contact');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon color="primary" />
            <Typography variant="h6" component="div">
              Edit Contact
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}

            <Stack spacing={3}>
              {/* Personal Information */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Personal Information
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  required
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  required
                  fullWidth
                  disabled={loading}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Middle Name"
                  value={formData.middlename}
                  onChange={handleInputChange('middlename')}
                  fullWidth
                  disabled={loading}
                />
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateofbirth ? new Date(formData.dateofbirth) : null}
                  onChange={handleDateChange}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateofbirth,
                      helperText: errors.dateofbirth,
                    },
                  }}
                />
              </Stack>

              {/* Contact Information */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                Contact Information
              </Typography>

              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                disabled={loading}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Home Phone"
                  value={formData.phone1}
                  onChange={handlePhoneChange('phone1')}
                  error={!!errors.phone1}
                  helperText={errors.phone1}
                  fullWidth
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
                <TextField
                  label="Cell Phone"
                  value={formData.phone2}
                  onChange={handlePhoneChange('phone2')}
                  error={!!errors.phone2}
                  helperText={errors.phone2}
                  fullWidth
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
                <TextField
                  label="Work Phone"
                  value={formData.phone3}
                  onChange={handlePhoneChange('phone3')}
                  error={!!errors.phone3}
                  helperText={errors.phone3}
                  fullWidth
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </Stack>

              {/* Address Information */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                Address Information
              </Typography>

              <TextField
                label="Street Address"
                value={formData.streetaddress}
                onChange={handleInputChange('streetaddress')}
                fullWidth
                disabled={loading}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="State"
                  value={formData.state}
                  onChange={handleInputChange('state')}
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="ZIP Code"
                  value={formData.zip}
                  onChange={handleInputChange('zip')}
                  fullWidth
                  disabled={loading}
                />
              </Stack>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} disabled={loading} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditContactDialog;
