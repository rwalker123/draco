'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  Tooltip,
  Alert,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export interface StorageQuotaData {
  used: number;
  total: number;
  available: number;
  percentUsed: number;
}

export interface StorageQuotaIndicatorProps {
  accountId: string;
  compact?: boolean;
  showDetails?: boolean;
  warningThreshold?: number; // Percentage at which to show warning
  criticalThreshold?: number; // Percentage at which to show error
  onQuotaExceeded?: () => void;
  onQuotaWarning?: (data: StorageQuotaData) => void;
}

/**
 * StorageQuotaIndicator - Shows storage usage and quota information
 * Provides visual feedback for storage limits and warnings
 */
export const StorageQuotaIndicator: React.FC<StorageQuotaIndicatorProps> = ({
  accountId,
  compact = false,
  showDetails = true,
  warningThreshold = 80,
  criticalThreshold = 95,
  onQuotaExceeded,
  onQuotaWarning,
}) => {
  const theme = useTheme();
  const [quotaData, setQuotaData] = useState<StorageQuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  // Use refs to store the latest callback functions to avoid dependency issues
  const onQuotaExceededRef = useRef(onQuotaExceeded);
  const onQuotaWarningRef = useRef(onQuotaWarning);

  // Update refs when callbacks change
  useEffect(() => {
    onQuotaExceededRef.current = onQuotaExceeded;
  }, [onQuotaExceeded]);

  useEffect(() => {
    onQuotaWarningRef.current = onQuotaWarning;
  }, [onQuotaWarning]);

  // Simulate storage quota data fetch - only depends on stable values
  useEffect(() => {
    const fetchQuotaData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data - replace with actual API response
        const mockData: StorageQuotaData = {
          used: 2.3 * 1024 * 1024 * 1024, // 2.3 GB in bytes
          total: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
          available: 2.7 * 1024 * 1024 * 1024, // 2.7 GB in bytes
          percentUsed: 46,
        };

        setQuotaData(mockData);

        // Check for warnings/errors using refs to avoid stale closures
        if (mockData.percentUsed >= criticalThreshold) {
          setShowAlert(true);
          onQuotaExceededRef.current?.();
        } else if (mockData.percentUsed >= warningThreshold) {
          setShowAlert(true);
          onQuotaWarningRef.current?.(mockData);
        }
      } catch {
        setError('Failed to load storage quota information');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotaData();
  }, [accountId, warningThreshold, criticalThreshold]); // Removed callback dependencies

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get progress bar color based on usage
  const getProgressColor = (percent: number) => {
    if (percent >= criticalThreshold) return 'error';
    if (percent >= warningThreshold) return 'warning';
    return 'primary';
  };

  // Get alert severity
  const getAlertSeverity = (percent: number) => {
    if (percent >= criticalThreshold) return 'error';
    if (percent >= warningThreshold) return 'warning';
    return 'info';
  };

  // Get status icon
  const getStatusIcon = (percent: number) => {
    if (percent >= criticalThreshold) return <ErrorIcon color="error" />;
    if (percent >= warningThreshold) return <WarningIcon color="warning" />;
    return <StorageIcon color="primary" />;
  };

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <StorageIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Loading storage info...
          </Typography>
        </Stack>
        <LinearProgress sx={{ mt: 1, height: 4 }} />
      </Box>
    );
  }

  if (error || !quotaData) {
    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ErrorIcon fontSize="small" color="error" />
          <Typography variant="caption" color="error">
            {error || 'Storage information unavailable'}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Main storage indicator */}
      <Box
        sx={{
          p: compact ? 1.5 : 2,
          border: 1,
          borderColor:
            quotaData.percentUsed >= criticalThreshold
              ? 'error.main'
              : quotaData.percentUsed >= warningThreshold
                ? 'warning.main'
                : 'divider',
          borderRadius: 1,
          bgcolor:
            quotaData.percentUsed >= criticalThreshold
              ? alpha(theme.palette.error.main, 0.05)
              : quotaData.percentUsed >= warningThreshold
                ? alpha(theme.palette.warning.main, 0.05)
                : 'background.paper',
        }}
      >
        <Stack spacing={compact ? 1 : 1.5}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {getStatusIcon(quotaData.percentUsed)}
            <Typography variant={compact ? 'caption' : 'body2'} fontWeight="medium">
              Storage Usage
            </Typography>
            {showDetails && (
              <Tooltip title="Account storage quota and usage information">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Stack>

          {/* Progress bar */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={quotaData.percentUsed}
              color={getProgressColor(quotaData.percentUsed)}
              sx={{
                height: compact ? 6 : 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.grey[300], 0.3),
              }}
            />

            {/* Usage text */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatBytes(quotaData.used)} of {formatBytes(quotaData.total)} used
              </Typography>
              <Typography
                variant="caption"
                color={
                  quotaData.percentUsed >= warningThreshold ? 'warning.main' : 'text.secondary'
                }
                fontWeight="medium"
              >
                {quotaData.percentUsed}%
              </Typography>
            </Stack>
          </Box>

          {/* Detailed information */}
          {showDetails && !compact && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Available: {formatBytes(quotaData.available)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Account: {accountId.slice(-8)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Warning/Error Alert */}
      <Collapse in={showAlert && quotaData.percentUsed >= warningThreshold}>
        <Alert
          severity={getAlertSeverity(quotaData.percentUsed)}
          variant="outlined"
          sx={{ mt: 1 }}
          onClose={() => setShowAlert(false)}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {quotaData.percentUsed >= criticalThreshold
              ? 'Storage quota nearly full!'
              : 'Storage quota warning'}
          </Typography>
          <Typography variant="caption">
            {quotaData.percentUsed >= criticalThreshold
              ? `Only ${formatBytes(quotaData.available)} remaining. New uploads may fail.`
              : `${quotaData.percentUsed}% of storage quota used. Consider freeing up space.`}
          </Typography>
        </Alert>
      </Collapse>
    </Box>
  );
};
