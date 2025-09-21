'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CombinedRegistrationPayload,
  SelfRegisterInput,
} from '../../services/accountRegistrationService';

type ValidationType = 'streetAddress' | 'dateOfBirth';

interface BaseProps {
  loading: boolean;
  error: string | null;
}

interface AuthenticatedProps extends BaseProps {
  isAuthenticated: true;
  onSubmit: (input: SelfRegisterInput) => Promise<void>;
}

interface UnauthenticatedProps extends BaseProps {
  isAuthenticated: false;
  onSubmit: (payload: CombinedRegistrationPayload) => Promise<void>;
}

type Props = AuthenticatedProps | UnauthenticatedProps;

/**
 * Reusable registration form component that can be used inline (without dialog).
 * Adapts based on authentication state.
 */
export const RegistrationForm: React.FC<Props> = (props) => {
  const { isAuthenticated, onSubmit, loading, error } = props;

  // Form state
  const [mode, setMode] = useState<'newUser' | 'existingUser'>('newUser');
  const [email, setEmail] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [validationType, setValidationType] = useState<ValidationType>('streetAddress');
  const [streetAddress, setStreetAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAuthenticated) {
      const input: SelfRegisterInput = {
        firstName,
        middleName: middleName || undefined,
        lastName,
        validationType,
        streetAddress: validationType === 'streetAddress' ? streetAddress : undefined,
        dateOfBirth: validationType === 'dateOfBirth' ? dateOfBirth : undefined,
      };
      await onSubmit(input);
    } else {
      const payload: CombinedRegistrationPayload =
        mode === 'newUser'
          ? {
              mode,
              email,
              password,
              firstName,
              middleName: middleName || undefined,
              lastName,
              validationType,
              streetAddress: validationType === 'streetAddress' ? streetAddress : undefined,
              dateOfBirth: validationType === 'dateOfBirth' ? dateOfBirth : undefined,
            }
          : {
              mode,
              usernameOrEmail,
              password,
              firstName,
              middleName: middleName || undefined,
              lastName: lastName || undefined,
              validationType,
              streetAddress: validationType === 'streetAddress' ? streetAddress : undefined,
              dateOfBirth: validationType === 'dateOfBirth' ? dateOfBirth : undefined,
            };
      await (onSubmit as (payload: CombinedRegistrationPayload) => Promise<void>)(payload);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {/* Tabs for unauthenticated users */}
        {!isAuthenticated && (
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => newMode && setMode(newMode)}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="newUser">Create login + register</ToggleButton>
            <ToggleButton value="existingUser">I&apos;m already a user</ToggleButton>
          </ToggleButtonGroup>
        )}

        {/* Login credentials for unauthenticated users */}
        {!isAuthenticated && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {mode === 'newUser' ? (
              <>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Username or Email"
                  name="usernameOrEmail"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </>
            )}
          </Stack>
        )}

        {/* Name fields */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="First name"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
          <TextField
            fullWidth
            label="Middle name (optional)"
            name="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            autoComplete="additional-name"
          />
          <TextField
            fullWidth
            label="Last name"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required={isAuthenticated || mode === 'newUser'}
          />
        </Stack>

        {/* Validation section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Additional Verification Required
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              value={validationType}
              onChange={(e) => setValidationType(e.target.value as ValidationType)}
              row
            >
              <FormControlLabel
                value="streetAddress"
                control={<Radio />}
                label="Verify with Street Address"
              />
              <FormControlLabel
                value="dateOfBirth"
                control={<Radio />}
                label="Verify with Date of Birth"
              />
            </RadioGroup>
          </FormControl>

          {validationType === 'streetAddress' ? (
            <TextField
              fullWidth
              label="Street Address"
              name="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              autoComplete="street-address"
              required
            />
          ) : (
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              autoComplete="bday"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ mt: 2, alignSelf: 'flex-start' }}
        >
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </Box>
    </Paper>
  );
};
