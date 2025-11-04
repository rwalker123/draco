import React from 'react';
import { Box, CircularProgress, Typography, type SxProps, type Theme } from '@mui/material';
import PhotoSubmissionForm, { type PhotoAlbumOption } from './PhotoSubmissionForm';
import WidgetShell from '../ui/WidgetShell';

type Variant = 'account' | 'team';

export interface PhotoSubmissionPanelProps {
  variant: Variant;
  enabled: boolean;
  isLoading: boolean;
  error: string | null;
  canSubmit: boolean;
  accountId: string;
  contextName: string;
  onSubmitted?: () => void;
  teamId?: string;
  albumOptions?: PhotoAlbumOption[];
  containerSx?: SxProps<Theme>;
}

const PhotoSubmissionPanel: React.FC<PhotoSubmissionPanelProps> = ({
  variant,
  enabled,
  isLoading,
  error,
  canSubmit,
  accountId,
  contextName,
  onSubmitted,
  teamId,
  albumOptions,
  containerSx,
}) => {
  const widgetSx = React.useMemo(() => {
    const extras = Array.isArray(containerSx) ? containerSx : containerSx ? [containerSx] : [];
    return [{ height: '100%' }, ...extras] as SxProps<Theme>;
  }, [containerSx]);

  const shouldHide = React.useMemo(() => {
    if (!enabled) {
      return true;
    }

    if (isLoading) {
      return false;
    }

    if (error) {
      return true;
    }

    return !canSubmit;
  }, [enabled, error, isLoading, canSubmit]);

  if (shouldHide) {
    return null;
  }

  const loadingMessage =
    variant === 'team' ? 'Checking your team access…' : 'Checking your access…';

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={24} />
        <Typography variant="body2">{loadingMessage}</Typography>
      </Box>
    );
  } else if (variant === 'team') {
    const ensuredTeamId = teamId;
    if (!ensuredTeamId) {
      return null;
    }
    content = (
      <PhotoSubmissionForm
        variant="team"
        accountId={accountId}
        contextName={contextName}
        teamId={ensuredTeamId}
        onSubmitted={onSubmitted}
      />
    );
  } else {
    content = (
      <PhotoSubmissionForm
        variant="account"
        accountId={accountId}
        contextName={contextName}
        albumOptions={albumOptions}
        onSubmitted={onSubmitted}
      />
    );
  }

  return (
    <WidgetShell accent={variant === 'team' ? 'secondary' : 'primary'} sx={widgetSx}>
      {content}
    </WidgetShell>
  );
};

export default PhotoSubmissionPanel;
