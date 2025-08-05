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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Autocomplete } from '@mui/material';
import { Contact, ContactUpdateData } from '../../types/users';
import { formatPhoneNumber } from '../../utils/contactUtils';
import { US_STATES } from '../../constants/usStates';
import {
  validateContactForm,
  hasValidationErrors,
  sanitizeContactFormData,
} from '../../utils/contactValidation';
import ContactPhotoUpload from '../ContactPhotoUpload';
import { validateContactPhotoFile } from '../../config/contacts';

interface EditContactDialogProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (contactData: ContactUpdateData, photoFile?: File | null) => Promise<void>;
  loading?: boolean;
  mode?: 'create' | 'edit';
  // Optional roster signup functionality
  showRosterSignup?: boolean;
  onRosterSignup?: (shouldSignup: boolean) => void;
  initialRosterSignup?: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  state?: string;
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
  mode = 'edit',
  showRosterSignup = false,
  onRosterSignup,
  initialRosterSignup = false,
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [rosterSignup, setRosterSignup] = useState<boolean>(initialRosterSignup);

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && contact) {
        // Edit mode: populate with existing contact data
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
      } else {
        // Create mode: start with empty form
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
      }
      setErrors({});
      setSaveError('');
      setPhotoFile(null);
      setPhotoError('');
      setRosterSignup(initialRosterSignup);
    }
  }, [open, contact, mode, initialRosterSignup]);

  const validateForm = (isPhotoOnlyUpdate: boolean = false): boolean => {
    console.log('Validating form data:', { formData, isPhotoOnlyUpdate }); // Debug logging

    // For photo-only updates, skip field validation
    if (isPhotoOnlyUpdate) {
      console.log('Skipping field validation for photo-only update');
      setErrors({});
      return true;
    }

    // Convert to the expected format for validation
    const formDataForValidation = {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      middlename: formData.middlename,
      email: formData.email || '',
      phone1: formData.phone1,
      phone2: formData.phone2,
      phone3: formData.phone3,
      streetaddress: formData.streetaddress,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      dateofbirth: formData.dateofbirth,
    };

    // Sanitize the form data first
    const sanitizedData = sanitizeContactFormData(formDataForValidation);
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

  const handlePhotoChange = (file: File | null) => {
    console.log('EditContactDialog: Photo change', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      mode,
    });

    if (file) {
      const validationError = validateContactPhotoFile(file);
      if (validationError) {
        console.error('EditContactDialog: Photo validation failed', validationError);
        setPhotoError(validationError);
        setPhotoFile(null);
        return;
      }
    }
    setPhotoFile(file);
    setPhotoError('');
    console.log('EditContactDialog: Photo file set successfully', { hasFile: !!file });
  };

  const handleSave = async () => {
    // For create mode, always validate all fields
    if (mode === 'create') {
      if (!validateForm(false)) {
        return;
      }
    } else {
      // For edit mode, check if this is a photo-only update
      const hasDataChanges =
        contact &&
        (formData.firstName !== (contact.firstName || '') ||
          formData.lastName !== (contact.lastName || '') ||
          formData.middlename !== (contact.contactDetails?.middlename || '') ||
          formData.email !== (contact.email || '') ||
          formData.phone1 !== (contact.contactDetails?.phone1 || '') ||
          formData.phone2 !== (contact.contactDetails?.phone2 || '') ||
          formData.phone3 !== (contact.contactDetails?.phone3 || '') ||
          formData.streetaddress !== (contact.contactDetails?.streetaddress || '') ||
          formData.city !== (contact.contactDetails?.city || '') ||
          formData.state !== (contact.contactDetails?.state || '') ||
          formData.zip !== (contact.contactDetails?.zip || '') ||
          formData.dateofbirth !== (contact.contactDetails?.dateofbirth || ''));

      const isPhotoOnlyUpdate = !hasDataChanges && !!photoFile;
      console.log('Save operation:', {
        hasDataChanges,
        hasPhotoFile: !!photoFile,
        isPhotoOnlyUpdate,
      });

      if (!validateForm(isPhotoOnlyUpdate)) {
        return;
      }
    }

    try {
      let dataToSave = formData;

      // For edit mode photo-only updates, send minimal data
      if (mode === 'edit' && !contact) {
        console.log('Photo-only update detected, sending empty contact data');
        dataToSave = {
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
        };
      }

      console.log('EditContactDialog: Calling onSave with:', {
        dataToSave,
        hasPhotoFile: !!photoFile,
        photoFileName: photoFile?.name,
        photoFileSize: photoFile?.size,
        mode,
      });

      await onSave(dataToSave, photoFile);

      // Notify parent about roster signup if applicable
      if (showRosterSignup && onRosterSignup) {
        onRosterSignup(rosterSignup);
      }

      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      setSaveError(error instanceof Error ? error.message : `Failed to ${mode} contact`);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (mode === 'edit' && !contact) {
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
              {mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
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

            {/* Roster signup option for create mode */}
            {showRosterSignup && mode === 'create' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" fontWeight="medium">
                    Team Roster Options
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rosterSignup}
                        onChange={(e) => setRosterSignup(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Automatically add this player to the team roster after creation"
                  />
                </Stack>
              </Alert>
            )}

            <Stack spacing={3}>
              {/* Contact Photo */}
              {mode === 'edit' && contact && (
                <ContactPhotoUpload
                  contactId={contact.id}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  initialPhotoUrl={contact.photoUrl}
                  onPhotoChange={handlePhotoChange}
                  disabled={loading}
                  error={photoError}
                  showDeleteOnHover={false}
                  clickToUpload={true}
                />
              )}

              {/* Photo upload for create mode */}
              {mode === 'create' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Contact Photo (Optional)
                  </Typography>
                  <ContactPhotoUpload
                    contactId="new-contact" // Placeholder ID for create mode
                    contactName="New Contact"
                    initialPhotoUrl={null}
                    onPhotoChange={handlePhotoChange}
                    disabled={loading}
                    error={photoError}
                    showDeleteOnHover={false}
                    clickToUpload={true}
                  />
                </Box>
              )}

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
                <Autocomplete
                  options={US_STATES}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : `${option.name} (${option.code})`
                  }
                  value={US_STATES.find((state) => state.code === formData.state) || null}
                  onChange={(event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      state: newValue ? newValue.code : '',
                    }));
                    // Clear field error when user selects
                    if (errors.state) {
                      setErrors((prev) => ({ ...prev, state: undefined }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State"
                      error={!!errors.state}
                      helperText={errors.state}
                      disabled={loading}
                      placeholder="Select a state"
                    />
                  )}
                  fullWidth
                  clearOnBlur
                  handleHomeEndKeys
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
            {loading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditContactDialog;
