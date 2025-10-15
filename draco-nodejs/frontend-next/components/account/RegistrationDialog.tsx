'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Box,
} from '@mui/material';
import {
  AccountRegistrationService,
  CombinedRegistrationPayload,
  SelfRegisterInput,
} from '../../services/accountRegistrationService';
import { useAuth } from '../../context/AuthContext';
import TurnstileChallenge from '../security/TurnstileChallenge';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

type ValidationType = 'streetAddress' | 'dateOfBirth';

/**
 * Unified registration dialog that handles all registration scenarios:
 * - Authenticated users: Link-by-name with validation
 * - Unauthenticated users: Combined registration (new user or existing user) with validation
 */
const RegistrationDialog: React.FC<Props> = ({ open, onClose, accountId }) => {
  const { user, token, fetchUser, setAuthToken } = useAuth();

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

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requireCaptcha = !user && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setUsernameOrEmail('');
    setPassword('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setStreetAddress('');
    setDateOfBirth('');
    setError(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
    setCaptchaError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (requireCaptcha) {
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      setCaptchaError(null);
    }
  }, [requireCaptcha, mode, open]);

  useEffect(() => {
    if (user?.userName) {
      setEmail(user.userName);
    } else {
      setEmail('');
    }
  }, [user?.userName, user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!user && requireCaptcha && mode === 'newUser' && !captchaToken) {
      setCaptchaError('Please verify that you are human before continuing.');
      setCaptchaResetKey((key) => key + 1);
      return;
    }

    setLoading(true);
    setError(null);
    const usedCaptcha = !user && requireCaptcha && mode === 'newUser';

    try {
      if (user && token) {
        // Authenticated user: Use self-registration (link-by-name with validation)
        const input: SelfRegisterInput = {
          firstName,
          middleName: middleName || undefined,
          lastName,
          validationType,
          streetAddress: validationType === 'streetAddress' ? streetAddress : undefined,
          dateOfBirth: validationType === 'dateOfBirth' ? dateOfBirth : undefined,
        };

        await AccountRegistrationService.selfRegister(accountId, input, token);
        await fetchUser();
        handleClose();
      } else {
        // Unauthenticated user: Use combined registration
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

        const { token: newToken } = await AccountRegistrationService.combinedRegister(
          accountId,
          payload,
          usedCaptcha ? (captchaToken ?? undefined) : undefined,
          user ? (token ?? undefined) : undefined,
        );
        if (newToken) {
          setAuthToken(newToken);
          await fetchUser(newToken);
        }
        handleClose();
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      // Extract specific error message from backend if available
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check your information and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (usedCaptcha) {
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{user ? 'Join Organization' : 'Register to this organization'}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Show tabs only for unauthenticated users */}
        {!user && (
          <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mb: 2 }}>
            <Tab value="newUser" label="Create login + register" />
            <Tab value="existingUser" label="I'm already a user" />
          </Tabs>
        )}

        <form id="registration-form" onSubmit={handleSubmit}>
          {/* Login credentials section (only for unauthenticated users) */}
          {!user && (
            <>
              {mode === 'newUser' ? (
                <>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {requireCaptcha && (
                    <Box sx={{ mt: 2 }}>
                      <TurnstileChallenge
                        onTokenChange={(token) => {
                          setCaptchaToken(token);
                          setCaptchaError(null);
                        }}
                        resetSignal={captchaResetKey}
                      />
                    </Box>
                  )}
                  {requireCaptcha && captchaError && (
                    <Alert severity="error" onClose={() => setCaptchaError(null)} sx={{ mt: 2 }}>
                      {captchaError}
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Username or Email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </>
              )}
            </>
          )}

          {/* Name fields (for all users) */}
          <TextField
            fullWidth
            margin="dense"
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
          <TextField
            fullWidth
            margin="dense"
            label="Middle name (optional)"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            autoComplete="additional-name"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required={!user || mode === 'newUser'}
          />

          {/* Validation section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Additional Verification Required</FormLabel>
              <RadioGroup
                row
                value={validationType}
                onChange={(e) => setValidationType(e.target.value as ValidationType)}
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
          </Box>

          {validationType === 'streetAddress' ? (
            <TextField
              fullWidth
              margin="dense"
              label="Street Address"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              autoComplete="street-address"
              required
              helperText="Enter your street address as it appears in our records"
            />
          ) : (
            <TextField
              fullWidth
              margin="dense"
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              autoComplete="bday"
              required
              InputLabelProps={{ shrink: true }}
              helperText="Enter your date of birth as it appears in our records"
            />
          )}
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="registration-form" variant="contained" disabled={loading}>
          {loading ? 'Submitting...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationDialog;
