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
  Switch,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Autocomplete } from '@mui/material';
import { formatPhoneNumber } from '../../utils/contactUtils';
import { US_STATES } from '../../constants/usStates';
import ContactPhotoUpload from '../ContactPhotoUpload';
import { validateContactPhotoFile } from '../../config/contacts';

import { BaseContact, CreateContactType, CreateContactSchema } from '@draco/shared-schemas';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface EditContactDialogProps {
  open: boolean;
  contact: BaseContact | null;
  onClose: () => void;
  onSave: (
    contactData: CreateContactType | null,
    photoFile?: File | null,
    autoSignToRoster?: boolean,
  ) => Promise<void>;
  loading?: boolean;
  mode?: 'create' | 'edit';
  // Optional roster signup functionality
  showRosterSignup?: boolean;
  onRosterSignup?: (shouldSignup: boolean) => void;
  initialRosterSignup?: boolean;
}

/**
 * EditContactDialog Component
 * Dialog for editing contact information following existing patterns
 */
const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  contact,
  loading = false,
  mode = 'edit',
  showRosterSignup = false,
  initialRosterSignup = false,
  onClose,
  onSave,
  onRosterSignup,
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(CreateContactSchema),
  });

  const [saveError, setSaveError] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [rosterSignup, setRosterSignup] = useState<boolean>(initialRosterSignup);
  const [createMultiplePlayers, setCreateMultiplePlayers] = useState(false);

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && contact) {
        reset(contact);
      } else {
        // Create mode OR edit mode with no contact: start with empty form
        reset({
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          contactDetails: {
            phone1: '',
            phone2: '',
            phone3: '',
            streetaddress: '',
            city: '',
            state: '',
            zip: '',
            dateofbirth: '',
          },
        });
      }
      setSaveError('');
      setPhotoFile(null);
      setPhotoError('');
      setRosterSignup(initialRosterSignup);
    } else {
      // Also reset when dialog closes to ensure clean state
      reset({});
      setSaveError('');
      setPhotoFile(null);
      setPhotoError('');
      setCreateMultiplePlayers(false);
    }
  }, [open, contact, mode, initialRosterSignup, reset]);

  const handlePhoneChange =
    (field: 'phone1' | 'phone2' | 'phone3') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const formattedPhone = formatPhoneNumber(value);
      setValue(`contactDetails.${field}`, formattedPhone);

      // Clear save error when user makes changes
      if (saveError) {
        setSaveError('');
      }
    };

  const handlePhotoChange = (file: File | null) => {
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
  };

  // Reset form for next player (used in multiple create mode)
  const resetFormForNextPlayer = () => {
    reset({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      contactDetails: {
        phone1: '',
        phone2: '',
        phone3: '',
        streetaddress: '',
        city: '',
        state: '',
        zip: '',
        dateofbirth: '',
      },
    });
    setPhotoFile(null);
    setPhotoError('');
    setSaveError('');
  };

  const handleSave = handleSubmit(async (data) => {
    try {
      let dataToSave: CreateContactType | null = data;

      // For edit mode, check if this is a photo-only update
      if (mode === 'edit' && contact) {
        const hasDataChanges = isDirty;
        // For photo-only updates, send minimal data
        if (!hasDataChanges && !!photoFile) {
          dataToSave = null;
        }
      }

      // Pass the roster signup value directly to onSave to avoid async state issues
      const autoSignToRoster = showRosterSignup ? rosterSignup : undefined;
      await onSave(dataToSave, photoFile, autoSignToRoster);

      // Notify parent about roster signup (for any additional logic)
      if (showRosterSignup && onRosterSignup) {
        onRosterSignup(rosterSignup);
      }

      if (mode === 'create' && createMultiplePlayers) {
        // Keep dialog open and reset form for next player
        resetFormForNextPlayer();
      } else {
        // Close dialog as usual
        onClose();
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : `Failed to ${mode} contact`);
    }
  });

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

            {/* Create mode options */}
            {mode === 'create' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" fontWeight="medium">
                    Creation Options
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createMultiplePlayers}
                        onChange={(e) => setCreateMultiplePlayers(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Create Multiple Players"
                  />
                  {showRosterSignup && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={rosterSignup}
                          onChange={(e) => setRosterSignup(e.target.checked)}
                          disabled={loading}
                        />
                      }
                      label="Automatically add this player to the team roster after creation"
                    />
                  )}
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
                  {...register('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  required
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="Last Name"
                  {...register('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  required
                  fullWidth
                  disabled={loading}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Middle Name"
                  {...register('middleName')}
                  fullWidth
                  disabled={loading}
                />
                <Controller
                  name="contactDetails.dateofbirth"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="Date of Birth"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        field.onChange(date ? date.toISOString().split('T')[0] : '');
                        // Clear save error when user makes changes
                        if (saveError) {
                          setSaveError('');
                        }
                      }}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Stack>

              {/* Contact Information */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                Contact Information
              </Typography>

              <TextField
                label="Email Address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                disabled={loading}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Home Phone"
                  {...register('contactDetails.phone1')}
                  onChange={handlePhoneChange('phone1')}
                  error={!!errors.contactDetails?.phone1}
                  helperText={errors.contactDetails?.phone1?.message}
                  fullWidth
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
                <TextField
                  label="Cell Phone"
                  {...register('contactDetails.phone2')}
                  onChange={handlePhoneChange('phone2')}
                  error={!!errors.contactDetails?.phone2}
                  helperText={errors.contactDetails?.phone2?.message}
                  fullWidth
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
                <TextField
                  label="Work Phone"
                  {...register('contactDetails.phone3')}
                  onChange={handlePhoneChange('phone3')}
                  error={!!errors.contactDetails?.phone3}
                  helperText={errors.contactDetails?.phone3?.message}
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
                {...register('contactDetails.streetaddress')}
                fullWidth
                disabled={loading}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="City"
                  {...register('contactDetails.city')}
                  fullWidth
                  disabled={loading}
                />
                <Controller
                  name="contactDetails.state"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={US_STATES}
                      getOptionLabel={(option) =>
                        typeof option === 'string' ? option : `${option.name} (${option.code})`
                      }
                      value={US_STATES.find((state) => state.code === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue ? newValue.code : '');
                        // Clear save error when user makes changes
                        if (saveError) {
                          setSaveError('');
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="State"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          disabled={loading}
                          placeholder="Select a state"
                        />
                      )}
                      fullWidth
                      clearOnBlur
                      handleHomeEndKeys
                    />
                  )}
                />
                <TextField
                  label="ZIP Code"
                  {...register('contactDetails.zip')}
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
