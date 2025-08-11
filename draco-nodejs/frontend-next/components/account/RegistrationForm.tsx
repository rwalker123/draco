'use client';
import React, { useState } from 'react';
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
    <form onSubmit={handleSubmit}>
      {/* Tabs for unauthenticated users */}
      {!isAuthenticated && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" disabled={mode === 'newUser'} onClick={() => setMode('newUser')}>
            Create login + register
          </button>
          <button
            type="button"
            disabled={mode === 'existingUser'}
            onClick={() => setMode('existingUser')}
          >
            I&apos;m already a user
          </button>
        </div>
      )}

      {/* Login credentials for unauthenticated users */}
      {!isAuthenticated && (
        <>
          {mode === 'newUser' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                placeholder="Username or Email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
        </>
      )}

      {/* Name fields */}
      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: isAuthenticated ? 0 : 8 }}
      >
        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          placeholder="Middle name (optional)"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />
        <input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required={isAuthenticated || mode === 'newUser'}
        />
      </div>

      {/* Validation section */}
      <div style={{ marginTop: 16 }}>
        <h4>Additional Verification Required</h4>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <label>
            <input
              type="radio"
              value="streetAddress"
              checked={validationType === 'streetAddress'}
              onChange={(e) => setValidationType(e.target.value as ValidationType)}
            />
            Verify with Street Address
          </label>
          <label>
            <input
              type="radio"
              value="dateOfBirth"
              checked={validationType === 'dateOfBirth'}
              onChange={(e) => setValidationType(e.target.value as ValidationType)}
            />
            Verify with Date of Birth
          </label>
        </div>

        {validationType === 'streetAddress' ? (
          <input
            placeholder="Street Address"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        ) : (
          <input
            type="date"
            placeholder="Date of Birth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        )}
      </div>

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};
