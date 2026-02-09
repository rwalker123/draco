'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { listLeagueFaqs } from '@draco/shared-api-client';
import type { LeagueFaqListType, LeagueFaqType } from '@draco/shared-schemas';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { LeagueFaqList } from './LeagueFaqList';

interface LeagueFaqPublicProps {
  accountId: string;
}

const sortFaqs = (items: LeagueFaqType[]): LeagueFaqType[] =>
  [...items].sort((a, b) =>
    a.question.localeCompare(b.question, undefined, { sensitivity: 'base' }),
  );

export const LeagueFaqPublic: React.FC<LeagueFaqPublicProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const [faqs, setFaqs] = useState<LeagueFaqType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listLeagueFaqs({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load FAQs') as LeagueFaqListType;
        const items = Array.isArray(data) ? data : [];
        setFaqs(sortFaqs(items as LeagueFaqType[]));
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load FAQs');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchFaqs();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  let content: React.ReactNode;
  if (loading) {
    content = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    content = <Alert severity="error">{error}</Alert>;
  } else if (faqs.length === 0) {
    content = <Alert severity="info">No FAQs have been published yet.</Alert>;
  } else {
    content = <LeagueFaqList faqs={faqs} />;
  }

  return <Box sx={{ px: { xs: 2, md: 4 }, pb: 6 }}>{content}</Box>;
};

export default LeagueFaqPublic;
