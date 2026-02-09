'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import type { LeagueFaqType } from '@draco/shared-schemas';
import { useLeagueFaqService } from '../../hooks/useLeagueFaqService';
import { LeagueFaqList } from './LeagueFaqList';

interface LeagueFaqPublicProps {
  accountId: string;
}

const sortFaqs = (items: LeagueFaqType[]): LeagueFaqType[] =>
  [...items].sort((a, b) =>
    a.question.localeCompare(b.question, undefined, { sensitivity: 'base' }),
  );

export const LeagueFaqPublic: React.FC<LeagueFaqPublicProps> = ({ accountId }) => {
  const { listFaqs } = useLeagueFaqService(accountId);
  const [faqs, setFaqs] = useState<LeagueFaqType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);

      const result = await listFaqs();
      if (cancelled) {
        return;
      }

      if (result.success) {
        setFaqs(sortFaqs(result.data));
      } else {
        setError(result.error);
      }

      setLoading(false);
    };

    void fetchFaqs();

    return () => {
      cancelled = true;
    };
  }, [listFaqs]);

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
