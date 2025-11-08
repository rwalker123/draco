'use client';

import React, { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useAccountSettings } from '../../hooks/useAccountSettings';
import { getComponentGate } from '../../lib/accountSettings/componentGates';

interface AccountOptionalProps {
  accountId?: string | null;
  componentId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireMatch?: boolean;
}

export const AccountOptional: React.FC<AccountOptionalProps> = ({
  accountId,
  componentId,
  fallback = null,
  children,
  requireMatch = false,
}) => {
  const logDebug = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[AccountOptional]', ...args);
    }
  };

  const gate = getComponentGate(componentId);
  const effectiveAccountId = gate ? accountId : null;
  const { settings, loading } = useAccountSettings(effectiveAccountId);

  const allowed = useMemo(() => {
    if (!gate) {
      return true;
    }

    if (!settings) {
      return false;
    }

    const state = settings.find((item) => item.definition.key === gate.settingKey);
    const value = state?.effectiveValue ?? state?.value;
    return value === gate.expectedValue;
  }, [gate, settings]);

  if (!gate) {
    if (requireMatch) {
      logDebug(`Unknown componentId "${componentId}" (allowing render)`);
    }
    return <>{children}</>;
  }

  if (loading && !settings) {
    logDebug(`Waiting for settings for component "${componentId}"`, { accountId });
    return null;
  }

  if (!allowed) {
    logDebug(`Component "${componentId}" hidden by gate`, {
      accountId,
      settingKey: gate.settingKey,
      expectedValue: gate.expectedValue,
    });
    if (gate.hiddenBehavior === 'notFound') {
      logDebug(`Triggering notFound for "${componentId}"`);
      notFound();
    }
    return <>{fallback}</>;
  }

  logDebug(`Component "${componentId}" allowed`, { accountId });
  return <>{children}</>;
};

export default AccountOptional;
