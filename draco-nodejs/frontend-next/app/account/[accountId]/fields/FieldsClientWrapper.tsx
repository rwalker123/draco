'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Box, Button, Container } from '@mui/material';
import FieldsManagement from '../../../../components/fields/FieldsManagement';

export default function FieldsClientWrapper() {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  if (!accountId) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Account information could not be determined.
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => router.push('/accounts')}>
            Browse Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  return <FieldsManagement accountId={accountId} />;
}
