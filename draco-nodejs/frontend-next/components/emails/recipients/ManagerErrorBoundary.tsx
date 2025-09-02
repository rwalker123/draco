import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Alert, AlertTitle, Typography, Button, Stack } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';

/**
 * Error boundary interface
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error boundary state
 */
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Manager Error Boundary Component
 * Catches and handles errors in manager selection components
 *
 * Responsibilities:
 * - Catch JavaScript errors in child components
 * - Display user-friendly error messages
 * - Provide recovery options
 * - Log errors for debugging
 */
class ManagerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Manager Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportBug = () => {
    // In a real application, this would open a bug report form
    // or send error details to a monitoring service
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    console.log('Bug report details:', errorDetails);

    // For now, just show an alert
    alert('Error details have been logged. Please contact support if this issue persists.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box p={3} textAlign="center">
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Manager Selection Error</AlertTitle>
            <Typography variant="body2" gutterBottom>
              Something went wrong while loading the manager selection interface.
            </Typography>
            {this.state.error && (
              <Typography variant="caption" color="text.secondary" display="block">
                Error: {this.state.error.message}
              </Typography>
            )}
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleRetry}>
              Try Again
            </Button>

            <Button variant="outlined" startIcon={<BugReportIcon />} onClick={this.handleReportBug}>
              Report Issue
            </Button>
          </Stack>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ManagerErrorBoundary;
