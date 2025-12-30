'use client';

import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';
import FieldsManagementPage from './manage/FieldsManagementPage';

export default function FieldsClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <FieldsManagementPage />
    </AccountTypeGuard>
  );
}
