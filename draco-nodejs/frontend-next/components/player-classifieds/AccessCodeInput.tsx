'use client';

// AccessCodeInput Component
// Reusable access code input with validation and security features

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { IAccessCodeInputProps, IAccessCodeInputState } from '../../types/accessCode';
import { validateAccessCode } from '../../utils/accessCodeValidation';

const AccessCodeInput: React.FC<IAccessCodeInputProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  error: externalError,
  disabled = false,
  placeholder = 'Enter your access code',
  submitButtonText = 'Verify Access',
  cancelButtonText = 'Cancel',
}) => {
  // Local state management
  const [state, setState] = useState<IAccessCodeInputState>({
    value: '',
    isValid: false,
    isSubmitting: false,
    error: null,
    lastAttempt: null,
  });

  // UI state
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Update local state when external props change
  useEffect(() => {
    if (externalError) {
      setState((prev) => ({ ...prev, error: externalError }));
    }
  }, [externalError]);

  // Update loading state
  useEffect(() => {
    setState((prev) => ({ ...prev, isSubmitting: loading }));
  }, [loading]);

  // Handle input changes with real-time validation
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const validation = validateAccessCode(value);

    setState((prev) => ({
      ...prev,
      value,
      isValid: validation.isValid,
      error: validation.error || null,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!state.isValid || state.isSubmitting) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await onSubmit(state.value);
      setState((prev) => ({ ...prev, lastAttempt: new Date() }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setState((prev) => ({
        ...prev,
        value: '',
        isValid: false,
        error: null,
      }));
    }
  };

  // Toggle access code visibility
  const toggleAccessCodeVisibility = () => {
    setShowAccessCode(!showAccessCode);
  };

  // Get input helper text
  const getHelperText = () => {
    if (state.error) {
      return state.error;
    }
    if (state.isValid) {
      return 'Access code format is valid';
    }
    return 'Enter your 36-character access code (UUID format)';
  };

  // Get input color
  const getInputColor = () => {
    if (state.error) return 'error';
    if (state.isValid) return 'success';
    return 'primary';
  };

  // Get submit button state
  const isSubmitDisabled = !state.isValid || state.isSubmitting || disabled;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <LockIcon color="primary" />
        <Typography variant="h6" component="h3">
          Access Code Verification
        </Typography>
      </Stack>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" mb={3}>
        Enter your access code to view and manage your Teams Wanted ad.
      </Typography>

      {/* Access Code Input */}
      <Box mb={2}>
        <TextField
          fullWidth
          label="Access Code"
          placeholder={placeholder}
          value={state.value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          type={showAccessCode ? 'text' : 'password'}
          variant="outlined"
          size="medium"
          color={getInputColor()}
          helperText={getHelperText()}
          error={!!state.error}
          disabled={disabled || state.isSubmitting}
          InputProps={{
            endAdornment: (
              <Box display="flex" alignItems="center">
                <Tooltip title={showAccessCode ? 'Hide access code' : 'Show access code'}>
                  <IconButton
                    onClick={toggleAccessCodeVisibility}
                    edge="end"
                    size="small"
                    disabled={disabled || state.isSubmitting}
                  >
                    {showAccessCode ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused': {
                borderColor: isFocused && state.isValid ? 'success.main' : 'primary.main',
              },
            },
          }}
        />
      </Box>

      {/* Validation Status */}
      {state.value && (
        <Box mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={state.isValid ? 'Valid Format' : 'Invalid Format'}
              color={state.isValid ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />
            {state.isValid && (
              <Chip label="Ready to Submit" color="success" size="small" variant="filled" />
            )}
          </Stack>
        </Box>
      )}

      {/* Error Display */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      {/* Last Attempt Info */}
      {state.lastAttempt && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Last verification attempt: {state.lastAttempt.toLocaleString()}
        </Alert>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {onCancel && (
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={disabled || state.isSubmitting}
          >
            {cancelButtonText}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitDisabled}
          startIcon={
            state.isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {state.isSubmitting ? 'Verifying...' : submitButtonText}
        </Button>
      </Stack>

      {/* Security Notice */}
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary" display="block">
          <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          Your access code is encrypted and never stored or logged. Multiple failed attempts may
          result in temporary blocking.
        </Typography>
      </Box>
    </Box>
  );
};

export default AccessCodeInput;
