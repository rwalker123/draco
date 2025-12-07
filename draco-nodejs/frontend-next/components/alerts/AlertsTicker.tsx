'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import CampaignIcon from '@mui/icons-material/Campaign';
import type { AlertType } from '@draco/shared-schemas';
import { fetchActiveAlerts } from '../../services/alertService';
import { useApiClient } from '../../hooks/useApiClient';

const scrollAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const AlertsTicker: React.FC = () => {
  const apiClient = useApiClient();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAlerts = async () => {
      try {
        const activeAlerts = await fetchActiveAlerts(apiClient);
        if (!isMounted) {
          return;
        }
        setAlerts(activeAlerts);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load alerts');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadAlerts();

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  const marqueeItems = alerts.length > 1 ? [...alerts, ...alerts] : alerts;
  const animationDurationSeconds = Math.max(18, marqueeItems.length * 6);

  if (loading || error || alerts.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        px: 2,
        py: 0.75,
        borderBottom: (theme) => `1px solid ${theme.palette.warning.dark}`,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CampaignIcon fontSize="small" />
        <Box sx={{ overflow: 'hidden', flex: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              animation:
                alerts.length > 1
                  ? `${scrollAnimation} ${animationDurationSeconds}s linear infinite`
                  : undefined,
            }}
          >
            {marqueeItems.map((alert, index) => (
              <Typography
                key={`${alert.id}-${index}`}
                variant="body2"
                sx={{ fontWeight: 700, letterSpacing: 0.15 }}
              >
                {alert.message}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AlertsTicker;
