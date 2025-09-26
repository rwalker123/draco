'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { PLAYER_CLASSIFIED_VALIDATION } from '../../utils/characterValidation';
import CharacterCounter from '../common/CharacterCounter';
import { ContactPlayersWantedCreatorType } from '@draco/shared-schemas';

// Use shared validation constants
const VALIDATION_CONSTANTS = PLAYER_CLASSIFIED_VALIDATION.CONTACT;

interface ContactCreatorDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactPlayersWantedCreatorType) => Promise<void>;
  loading?: boolean;
  teamEventName: string;
  creatorName: string;
}

const ContactCreatorDialog: React.FC<ContactCreatorDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  teamEventName,
  creatorName,
}) => {
  const [formData, setFormData] = useState<ContactPlayersWantedCreatorType>({
    senderName: '',
    senderEmail: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Helper function to reset form state - eliminates code duplication
  const resetForm = () => {
    setFormData({
      senderName: '',
      senderEmail: '',
      message: '',
    });
    setErrors({});
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate sender name
    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Your name is required';
    } else if (formData.senderName.length < VALIDATION_CONSTANTS.SENDER_NAME.MIN_LENGTH) {
      newErrors.senderName = `Name must be at least ${VALIDATION_CONSTANTS.SENDER_NAME.MIN_LENGTH} characters`;
    } else if (formData.senderName.length > VALIDATION_CONSTANTS.SENDER_NAME.MAX_LENGTH) {
      newErrors.senderName = `Name must not exceed ${VALIDATION_CONSTANTS.SENDER_NAME.MAX_LENGTH} characters`;
    }

    // Validate sender email
    if (!formData.senderEmail.trim()) {
      newErrors.senderEmail = 'Your email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.senderEmail)) {
        newErrors.senderEmail = 'Please enter a valid email address';
      } else if (formData.senderEmail.length > VALIDATION_CONSTANTS.SENDER_EMAIL.MAX_LENGTH) {
        newErrors.senderEmail = `Email must not exceed ${VALIDATION_CONSTANTS.SENDER_EMAIL.MAX_LENGTH} characters`;
      }
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < VALIDATION_CONSTANTS.MESSAGE.MIN_LENGTH) {
      newErrors.message = `Message must be at least ${VALIDATION_CONSTANTS.MESSAGE.MIN_LENGTH} characters`;
    } else if (formData.message.length > VALIDATION_CONSTANTS.MESSAGE.MAX_LENGTH) {
      newErrors.message = `Message must not exceed ${VALIDATION_CONSTANTS.MESSAGE.MAX_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitError('');
      await onSubmit(formData);
      // Reset form after successful submission
      resetForm();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleInputChange = (field: keyof ContactPlayersWantedCreatorType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleClose = () => {
    // Reset form when closing
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { minHeight: '500px' },
        },
      }}
    >
      <DialogTitle>Contact Team</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Sending message about:
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {teamEventName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Team managed by {creatorName}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Your Name"
            value={formData.senderName}
            onChange={(e) => handleInputChange('senderName', e.target.value)}
            error={!!errors.senderName}
            helperText={errors.senderName}
            required
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Your Email"
            type="email"
            value={formData.senderEmail}
            onChange={(e) => handleInputChange('senderEmail', e.target.value)}
            error={!!errors.senderEmail}
            helperText={
              errors.senderEmail || 'The team will be able to reply directly to this email'
            }
            required
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Message"
            multiline
            rows={6}
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            error={!!errors.message}
            helperText={errors.message || 'Tell them about your interest and experience'}
            required
            fullWidth
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: VALIDATION_CONSTANTS.MESSAGE.MAX_LENGTH,
              },
            }}
          />

          {/* Character Counter */}
          <CharacterCounter
            currentLength={formData.message.length}
            maxLength={VALIDATION_CONSTANTS.MESSAGE.MAX_LENGTH}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactCreatorDialog;
