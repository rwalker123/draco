import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, Button, Box, Stack, Typography, Chip } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugIcon } from '@mui/icons-material';
import {
  logError,
  getRecoveryActions,
  getErrorSeverity,
  createEmailRecipientError,
} from '../../utils/errorHandling';
import { EmailRecipientError, EmailRecipientErrorCode, ErrorSeverity } from '../../types/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: EmailRecipientError, errorInfo: ErrorInfo) => void;
  componentName?: string;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  showRecoveryActions?: boolean;
}

interface State {
  hasError: boolean;
  error?: EmailRecipientError;
  retryCount: number;
  errorId: string;
}

/**
 * Enhanced ErrorBoundary - Catches JavaScript errors in component tree
 * Provides comprehensive error handling with user-friendly messaging and recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert to standardized error format
    const normalizedError = createEmailRecipientError(
      EmailRecipientErrorCode.COMPONENT_CRASHED,
      error.message,
      {
        details: {
          originalError: error.name,
          stack: error.stack,
        },
        recoverable: true,
        retryable: false,
      },
    );

    return {
      hasError: true,
      error: normalizedError,
      retryCount: 0,
      errorId,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create enhanced error with component context
    const componentError = createEmailRecipientError(
      EmailRecipientErrorCode.COMPONENT_CRASHED,
      error.message,
      {
        details: {
          originalError: error.name,
          stack: error.stack,
          errorInfo,
          componentStack: errorInfo.componentStack,
        },
        context: {
          operation: 'component_render',
          additionalData: {
            componentName: this.props.componentName || 'Unknown',
            retryCount: this.state.retryCount,
          },
        },
        recoverable: true,
        retryable: false,
      },
    );

    // Log the error with full context
    logError(componentError, `ErrorBoundary in ${this.props.componentName || 'unknown component'}`);

    // Call optional error handler with normalized error
    if (this.props.onError) {
      this.props.onError(componentError, errorInfo);
    }

    // Update state with enhanced error
    this.setState({ error: componentError });
  }

  private handleRetry = () => {
    const { enableRetry = true, maxRetries = 3 } = this.props;

    if (!enableRetry || this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
      errorId: '',
    }));
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private getSeverityColor(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      const {
        fallback,
        showErrorDetails = false,
        enableRetry = true,
        maxRetries = 3,
        showRecoveryActions = true,
        componentName = 'Unknown Component',
      } = this.props;

      const { error, retryCount, errorId } = this.state;

      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      const severity = getErrorSeverity(error);
      const recoveryActions = showRecoveryActions ? getRecoveryActions(error) : [];
      const canRetry = enableRetry && retryCount < maxRetries && error.recoverable;

      // Default enhanced fallback UI
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity={this.getSeverityColor(severity)}>
            <AlertTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <BugIcon fontSize="small" />
                <span>Component Error</span>
                <Chip
                  label={severity.toUpperCase()}
                  size="small"
                  color={this.getSeverityColor(severity)}
                  variant="outlined"
                />
              </Stack>
            </AlertTitle>

            <Stack spacing={2}>
              <Typography variant="body2">{error.userMessage}</Typography>

              {showErrorDetails && (
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    <strong>Component:</strong> {componentName}
                    <br />
                    <strong>Error Code:</strong> {error.code}
                    <br />
                    <strong>Error ID:</strong> {errorId}
                    <br />
                    <strong>Technical Message:</strong> {error.message}
                  </Typography>
                </Box>
              )}

              {showRecoveryActions && recoveryActions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    What you can do:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {recoveryActions.map((action, index) => (
                      <li key={index}>
                        <Typography variant="body2">{action}</Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {canRetry && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={this.handleRetry}
                    startIcon={<RefreshIcon />}
                  >
                    Try Again ({retryCount}/{maxRetries})
                  </Button>
                )}

                <Button
                  variant="contained"
                  size="small"
                  onClick={this.handleRefresh}
                  startIcon={<RefreshIcon />}
                >
                  Refresh Page
                </Button>
              </Stack>

              {retryCount >= maxRetries && (
                <Typography variant="caption" color="error">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </Typography>
              )}
            </Stack>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
