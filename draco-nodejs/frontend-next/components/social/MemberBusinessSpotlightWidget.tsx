'use client';

import React from 'react';
import { Alert, Box, Button, Divider, Skeleton, Stack, Typography } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import NextLink from 'next/link';
import { listMemberBusinesses } from '@draco/shared-api-client';
import type { MemberBusinessType } from '@draco/shared-schemas';
import WidgetShell from '@/components/ui/WidgetShell';
import MemberBusinessSummary from '@/components/profile/MemberBusinessSummary';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';

interface MemberBusinessSpotlightWidgetProps {
  accountId?: string;
  seasonId?: string | null;
  viewAllHref?: string;
}

const BUSINESSES_TO_DISPLAY = 3;

const MemberBusinessSpotlightWidget: React.FC<MemberBusinessSpotlightWidgetProps> = ({
  accountId,
  seasonId,
  viewAllHref,
}) => {
  const apiClient = useApiClient();
  const [businesses, setBusinesses] = React.useState<MemberBusinessType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId || !seasonId) {
      setBusinesses([]);
      return;
    }

    const controller = new AbortController();

    const loadBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listMemberBusinesses({
          client: apiClient,
          path: { accountId },
          query: { seasonId, limit: BUSINESSES_TO_DISPLAY, randomize: true },
          signal: controller.signal,
          throwOnError: false,
        });
        if (controller.signal.aborted) return;
        setBusinesses(
          unwrapApiResult(result, 'Unable to load member businesses.')?.memberBusinesses ?? [],
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiClientError ? err.message : 'Unable to load member businesses.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadBusinesses();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, seasonId]);

  const actions = viewAllHref ? (
    <Button component={NextLink} href={viewAllHref} size="small" variant="text">
      View all
    </Button>
  ) : undefined;

  const renderContent = () => {
    if (!accountId || !seasonId) {
      return <Alert severity="info">Select a season to feature member businesses.</Alert>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (loading) {
      return (
        <Stack spacing={2}>
          {Array.from({ length: BUSINESSES_TO_DISPLAY }).map((_, index) => (
            <Skeleton key={`business-skeleton-${index}`} variant="rectangular" height={72} />
          ))}
        </Stack>
      );
    }

    if (businesses.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No member businesses have been shared for this season yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {businesses.map((business, index) => (
          <React.Fragment key={business.id}>
            <MemberBusinessSummary business={business} compact />
            {index < businesses.length - 1 ? (
              <Divider sx={{ borderColor: 'widget.border' }} />
            ) : null}
          </React.Fragment>
        ))}
      </Stack>
    );
  };

  return (
    <WidgetShell
      accent="info"
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessCenterIcon fontSize="small" />
          Member Businesses
        </Box>
      }
      actions={actions}
    >
      {renderContent()}
    </WidgetShell>
  );
};

export default MemberBusinessSpotlightWidget;
