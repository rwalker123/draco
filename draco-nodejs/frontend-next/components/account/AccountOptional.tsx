'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import { useAccountSettings } from '../../hooks/useAccountSettings';
import { getComponentGate } from '../../lib/accountSettings/componentGates';

interface AccountOptionalProps {
  accountId?: string | null;
  componentId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const AccountOptional: React.FC<AccountOptionalProps> = ({
  accountId,
  componentId,
  fallback = null,
  children,
}) => {
  const gate = getComponentGate(componentId);
  const effectiveAccountId = gate ? accountId : null;
  const { settings, loading } = useAccountSettings(effectiveAccountId);

  const allowed = (() => {
    if (!gate) {
      return true;
    }

    if (!settings) {
      return false;
    }

    const state = settings.find((item) => item.definition.key === gate.settingKey);
    const value = state?.effectiveValue ?? state?.value;
    return value === gate.expectedValue;
  })();

  if (!gate) {
    return <>{children}</>;
  }

  if (loading && !settings) {
    return null;
  }

  if (!allowed) {
    if (gate.hiddenBehavior === 'notFound') {
      notFound();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AccountOptional;
