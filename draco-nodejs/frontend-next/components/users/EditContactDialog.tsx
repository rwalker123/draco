'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { formatPhoneInput } from '../../utils/phoneNumber';
import { US_STATES } from '../../constants/usStates';
import ContactPhotoUpload from '../ContactPhotoUpload';
import { validateContactPhotoFile } from '../../config/contacts';
import { buildInitialContactValues, createEmptyContactValues } from '../../utils/contactFormUtils';

import {
  BaseContactType,
  CreateContactType,
  CreateContactSchema,
  ContactType,
} from '@draco/shared-schemas';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContactOperations } from '../../hooks/useContactOperations';
import { useContactPhotoUpload } from '@/hooks/useContactPhotoUpload';
import { useRegistrationOperations } from '@/hooks/useRegistrationOperations';

const parseDateOnly = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [datePart] = value.split('T');
  const segments = datePart.split('-');
  if (segments.length !== 3) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = segments;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
};

interface EditContactDialogProps {
  open: boolean;
  contact: BaseContactType | null;
  onClose: () => void;
  onSuccess?: (result: {
    message: string;
    contact: ContactType;
    isCreate: boolean;
    status?: 'success' | 'warning';
  }) => void;
  accountId: string;
  mode?: 'create' | 'edit';
  // Optional roster signup functionality
  showRosterSignup?: boolean;
  onRosterSignup?: (shouldSignup: boolean) => void;
  initialRosterSignup?: boolean;
}

/**
 * EditContactDialog Component
 * Self-contained dialog for editing contact information with internal API calls and error handling
 */
const EditContactDialog: React.FC<EditContactDialogProps> = ({ open, ...rest }) => {
  if (!open) {
    return null;
  }

  if (rest.mode === 'edit' && !rest.contact) {
    return null;
  }

  const key = `${rest.mode}-${rest.contact?.id ?? 'new'}-${rest.initialRosterSignup ? '1' : '0'}`;

  return <EditContactDialogInner key={key} open={open} {...rest} />;
};

type EditContactDialogInnerProps = EditContactDialogProps;

const EditContactDialogInner: React.FC<EditContactDialogInnerProps> = ({
  contact,
  accountId,
  open,
  mode = 'edit',
  showRosterSignup = false,
  initialRosterSignup = false,
  onClose,
  onSuccess,
  onRosterSignup,
}) => {
  const initialValues = useMemo(() => buildInitialContactValues(mode, contact), [mode, contact]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateContactType>({
    resolver: zodResolver(CreateContactSchema) as Resolver<CreateContactType>,
    defaultValues: initialValues,
  });

  // Use the contact operations hook
  const { createContact, updateContact, loading } = useContactOperations(accountId);
  const { uploadContactPhoto } = useContactPhotoUpload(accountId);
  const { autoRegisterContact, loading: autoRegisterLoading } =
    useRegistrationOperations(accountId);

  const [saveError, setSaveError] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [rosterSignup, setRosterSignup] = useState<boolean>(initialRosterSignup);
  const [createMultiplePlayers, setCreateMultiplePlayers] = useState(false);
  const AUTO_REGISTER_PREF_KEY = 'draco:contacts:autoRegister';
  const [autoRegister, setAutoRegister] = useState<boolean>(() => {
    if (typeof window === 'undefined' || mode !== 'create') {
      return false;
    }
    try {
      const stored = window.localStorage.getItem(AUTO_REGISTER_PREF_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (mode !== 'create') return;
    try {
      window.localStorage.setItem(AUTO_REGISTER_PREF_KEY, autoRegister ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  }, [autoRegister, mode]);

  const handlePhoneChange =
    (field: 'phone1' | 'phone2' | 'phone3') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const formattedPhone = formatPhoneInput(value);
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
    reset(createEmptyContactValues());
    setPhotoFile(null);
    setPhotoError('');
    setSaveError('');
  };

  const handleSave = handleSubmit(async (data: CreateContactType) => {
    try {
      setSaveError('');

      const hasDataChanges = isDirty;
      if (mode === 'edit' && contact && photoFile && !hasDataChanges) {
        const photoOnlyResult = await uploadContactPhoto(contact, photoFile);

        if (photoOnlyResult.success && photoOnlyResult.contact) {
          onSuccess?.({
            message: photoOnlyResult.message || 'Contact updated successfully',
            contact: photoOnlyResult.contact,
            isCreate: false,
          });
          onClose();
        } else {
          setSaveError(photoOnlyResult.error || `Failed to ${mode} contact`);
        }
        return;
      }

      const result =
        mode === 'create'
          ? await createContact({
              contactData: data,
              photoFile,
            })
          : await updateContact(contact!.id, {
              contactData: data,
              photoFile,
            });

      if (result.success && result.contact) {
        let finalContact = result.contact;
        let finalMessage =
          result.message || `Contact ${mode === 'create' ? 'created' : 'updated'} successfully`;
        let autoRegisterError: string | null = null;

        if (mode === 'create' && autoRegister) {
          const autoResult = await autoRegisterContact(result.contact.id);
          if (autoResult.success && autoResult.response) {
            const response = autoResult.response;
            if (
              response.userId &&
              (response.status === 'linked-existing-user' || response.status === 'created-new-user')
            ) {
              finalContact = {
                ...finalContact,
                userId: response.userId,
              } as ContactType;
              finalMessage =
                response.message ||
                (response.status === 'created-new-user'
                  ? 'User created and invitation sent.'
                  : 'User linked and invitation sent.');
            } else if (response.status === 'conflict-other-contact') {
              autoRegisterError =
                response.message ||
                'Auto register skipped: this email is already linked to another contact.';
            } else if (response.status === 'missing-email') {
              autoRegisterError = 'Auto register skipped: contact is missing an email.';
            }
          } else if (!autoResult.success) {
            autoRegisterError = autoResult.error || 'Auto registration failed';
          }
        }

        if (showRosterSignup && onRosterSignup) {
          onRosterSignup(rosterSignup);
        }

        if (autoRegisterError) {
          finalMessage = `${finalMessage} (Note: ${autoRegisterError})`;
        }

        onSuccess?.({
          message: finalMessage,
          contact: finalContact,
          isCreate: mode === 'create',
          // Signal to parent to show warning styling when auto-register partially failed
          status: autoRegisterError ? 'warning' : 'success',
        });

        if (mode === 'create' && createMultiplePlayers) {
          resetFormForNextPlayer();
        } else {
          onClose();
        }
      } else {
        setSaveError(result.error || `Failed to ${mode} contact`);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : `Failed to ${mode} contact`);
    }
  });

  const handleClose = () => {
    if (!loading) {
      setSaveError('');
      setPhotoFile(null);
      setPhotoError('');
      setCreateMultiplePlayers(false);
      setRosterSignup(initialRosterSignup);
      setAutoRegister(false);
      reset(initialValues);
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
                        disabled={loading || autoRegisterLoading}
                      />
                    }
                    label="Create Multiple Players"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRegister}
                        onChange={(e) => setAutoRegister(e.target.checked)}
                        disabled={loading || autoRegisterLoading}
                      />
                    }
                    label="Auto register this contact after creation"
                  />
                  {showRosterSignup && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={rosterSignup}
                          onChange={(e) => setRosterSignup(e.target.checked)}
                          disabled={loading || autoRegisterLoading}
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
                  name="contactDetails.dateOfBirth"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="Date of Birth"
                      value={field.value ? parseDateOnly(field.value) : null}
                      onChange={(date) => {
                        field.onChange(
                          date
                            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
                                date.getDate(),
                              ).padStart(2, '0')}`
                            : '',
                        );
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
                {...register('contactDetails.streetAddress')}
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
          <Button
            onClick={handleClose}
            disabled={loading || autoRegisterLoading}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || autoRegisterLoading}
            startIcon={
              loading || autoRegisterLoading ? <CircularProgress size={20} /> : <SaveIcon />
            }
          >
            {loading || autoRegisterLoading
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Contact'
                : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditContactDialog;
