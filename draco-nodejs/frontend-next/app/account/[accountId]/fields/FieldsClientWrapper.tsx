'use client';

import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';
import FieldsViewPage from './FieldsViewPage';

export default function FieldsClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <FieldsViewPage />
    </AccountTypeGuard>
  );
}
