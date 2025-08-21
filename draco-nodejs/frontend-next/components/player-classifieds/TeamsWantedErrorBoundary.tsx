'use client';

// TeamsWantedErrorBoundary Component
// Graceful error handling for Teams Wanted operations

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Stack, Paper, Divider } from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface IState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR TYPES AND MESSAGES
// ============================================================================

interface IErrorDetails {
  title: string;
  message: string;
  suggestions: string[];
  severity: 'error' | 'warning' | 'info';
  canRetry: boolean;
  canGoHome: boolean;
}

// Map error types to user-friendly messages
const getErrorDetails = (error: Error): IErrorDetails => {
  const errorMessage = error.message.toLowerCase();

  // Access code related errors
  if (errorMessage.includes('access code') || errorMessage.includes('verification')) {
    return {
      title: 'Access Code Error',
      message: 'There was a problem verifying your access code.',
      suggestions: [
        'Double-check that you entered the correct access code',
        "Make sure the access code hasn't expired",
        'Try copying and pasting the access code instead of typing it',
        'Contact support if the problem persists',
      ],
      severity: 'warning',
      canRetry: true,
      canGoHome: true,
    };
  }

  // Network related errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection')
  ) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a few minutes and try again',
        'Contact support if the problem persists',
      ],
      severity: 'error',
      canRetry: true,
      canGoHome: true,
    };
  }

  // Rate limiting errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many attempts')) {
    return {
      title: 'Rate Limited',
      message: 'Too many failed attempts. Please wait before trying again.',
      suggestions: [
        'Wait 15 minutes before trying again',
        'Double-check your access code',
        'Contact support if you need immediate assistance',
      ],
      severity: 'warning',
      canRetry: false,
      canGoHome: true,
    };
  }

  // Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    return {
      title: 'Access Denied',
      message: "You don't have permission to perform this action.",
      suggestions: [
        "Make sure you're signed in to the correct account",
        'Check if your account has the required permissions',
        'Contact your account administrator',
        'Try signing out and signing back in',
      ],
      severity: 'error',
      canRetry: false,
      canGoHome: true,
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred while loading Teams Wanted ads.',
    suggestions: [
      'Try refreshing the page',
      "Check if you're signed in correctly",
      'Clear your browser cache and cookies',
      'Contact support if the problem persists',
    ],
    severity: 'error',
    canRetry: true,
    canGoHome: true,
  };
};

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

class TeamsWantedErrorBoundary extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<IState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('TeamsWanted Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleContactSupport = () => {
    // In a real app, this would open a support ticket or contact form
    window.open('mailto:support@example.com?subject=Teams%20Wanted%20Error', '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const errorDetails = getErrorDetails(this.state.error!);

      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            {/* Error Icon */}
            <Box mb={3}>
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: errorDetails.severity === 'error' ? 'error.main' : 'warning.main',
                }}
              />
            </Box>

            {/* Error Title */}
            <Typography variant="h4" component="h1" gutterBottom color="error">
              {errorDetails.title}
            </Typography>

            {/* Error Message */}
            <Typography variant="body1" color="text.secondary" mb={3}>
              {errorDetails.message}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Suggestions */}
            <Box mb={3} textAlign="left">
              <Typography variant="h6" gutterBottom>
                What you can try:
              </Typography>
              <Stack spacing={1}>
                {errorDetails.suggestions.map((suggestion, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    • {suggestion}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              {errorDetails.canRetry && (
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleRetry}>
                  Try Again
                </Button>
              )}

              {errorDetails.canGoHome && (
                <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
                  Go Home
                </Button>
              )}

              <Button
                variant="text"
                startIcon={<SupportIcon />}
                onClick={this.handleContactSupport}
              >
                Contact Support
              </Button>
            </Stack>

            {/* Technical Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box mt={4} textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  <strong>Technical Details:</strong> {this.state.error.toString()}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default TeamsWantedErrorBoundary;
