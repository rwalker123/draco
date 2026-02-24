'use client';

import React from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  type ButtonProps,
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import Avatar from '@mui/material/Avatar';
import { getPlayerSurveySpotlight, getPlayerSurveyTeamSpotlight } from '@draco/shared-api-client';
import { PlayerSurveySpotlightSchema, type PlayerSurveySpotlightType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { ApiClientError, unwrapApiResult } from '@/utils/apiResult';
import WidgetShell from '../ui/WidgetShell';

type SpotlightStatus = 'loading' | 'success' | 'empty' | 'error';

export interface SurveySpotlightWidgetProps {
  accountId: string;
  teamSeasonId?: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: 'paper' | 'card';
  surveysHref?: string;
  className?: string;
  ctaButtonProps?: Omit<ButtonProps, 'href'>;
  canAnswerSurvey?: boolean;
  viewSurveysLabel?: string;
}

const formatPlayerName = (spotlight: PlayerSurveySpotlightType): string => {
  const raw = `${spotlight.player.firstName ?? ''} ${spotlight.player.lastName ?? ''}`.trim();
  if (raw.length > 0) {
    return raw;
  }
  return `Player #${spotlight.player.id}`;
};

const getDefaultTitle = (teamSeasonId?: string) =>
  teamSeasonId ? 'Team Survey Spotlight' : 'Player Survey Spotlight';

const getFallbackError = (teamSeasonId?: string) =>
  teamSeasonId
    ? 'Unable to load team survey spotlight.'
    : 'Unable to load player survey spotlight.';

const normalizeSpotlight = (value: unknown): PlayerSurveySpotlightType | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const rawPlayer = raw.player as Record<string, unknown> | undefined;

  const normalizeId = (input: unknown) => {
    if (typeof input === 'bigint') {
      return input.toString();
    }
    if (typeof input === 'number' && Number.isFinite(input)) {
      return String(input);
    }
    if (typeof input === 'string' && /^\d+$/.test(input.trim())) {
      try {
        return BigInt(input.trim()).toString();
      } catch {
        return input.trim();
      }
    }
    return input;
  };

  const normalized = {
    ...raw,
    player: rawPlayer
      ? {
          ...rawPlayer,
          id: normalizeId(rawPlayer.id),
        }
      : rawPlayer,
  };

  try {
    return PlayerSurveySpotlightSchema.parse(normalized);
  } catch (err) {
    console.error('Failed to parse survey spotlight payload', err);
    return null;
  }
};

const SurveySpotlightWidget: React.FC<SurveySpotlightWidgetProps> = ({
  accountId,
  teamSeasonId,
  title = getDefaultTitle(teamSeasonId),
  icon,
  variant = 'paper',
  surveysHref,
  className,
  ctaButtonProps,
  canAnswerSurvey = false,
  viewSurveysLabel = 'View Surveys',
}) => {
  const apiClient = useApiClient();
  const [status, setStatus] = React.useState<SpotlightStatus>('loading');
  const [spotlight, setSpotlight] = React.useState<PlayerSurveySpotlightType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fallbackMessage = getFallbackError(teamSeasonId);
  const accountSurveyHref = surveysHref
    ? surveysHref
    : accountId
      ? `/account/${encodeURIComponent(accountId)}/surveys`
      : '#';

  React.useEffect(() => {
    if (!accountId) {
      setStatus('empty');
      setSpotlight(null);
      return;
    }

    const controller = new AbortController();

    const loadSpotlight = async () => {
      setStatus('loading');
      setError(null);

      try {
        const response = teamSeasonId
          ? await getPlayerSurveyTeamSpotlight({
              client: apiClient,
              path: { accountId, teamSeasonId },
              throwOnError: false,
              signal: controller.signal,
            })
          : await getPlayerSurveySpotlight({
              client: apiClient,
              path: { accountId },
              throwOnError: false,
              signal: controller.signal,
            });

        if (controller.signal.aborted) return;

        const rawSpotlight = unwrapApiResult(response, fallbackMessage);
        const parsed = normalizeSpotlight(rawSpotlight);

        if (controller.signal.aborted) return;

        if (!parsed) {
          setError('Unable to load player survey spotlight.');
          setSpotlight(null);
          setStatus('error');
          return;
        }

        setSpotlight(parsed);
        setStatus('success');
      } catch (err) {
        if (controller.signal.aborted) return;

        if (err instanceof ApiClientError && err.status === 404) {
          setStatus('empty');
          setSpotlight(null);
          return;
        }

        const message = err instanceof ApiClientError ? err.message : fallbackMessage;
        setError(message);
        setSpotlight(null);
        setStatus('error');
      }
    };

    void loadSpotlight();

    return () => {
      controller.abort();
    };
  }, [accountId, teamSeasonId, apiClient, fallbackMessage]);

  const renderSpotlightContent = () => {
    const isLoading = status === 'loading';

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (status === 'error') {
      return (
        <Stack spacing={2}>
          <Alert severity="error">{error ?? fallbackMessage}</Alert>
          {canAnswerSurvey ? (
            <Button
              component={Link}
              href={accountSurveyHref}
              variant="outlined"
              size="small"
              {...ctaButtonProps}
            >
              Answer a Survey
            </Button>
          ) : null}
          <Button component={Link} href={accountSurveyHref} variant="text" size="small">
            {viewSurveysLabel}
          </Button>
        </Stack>
      );
    }

    if (status === 'empty' || !spotlight) {
      return (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            No survey responses are ready to highlight yet. Encourage your players to add their
            answers.
          </Typography>
          {canAnswerSurvey ? (
            <Button
              component={Link}
              href={accountSurveyHref}
              variant="contained"
              size="small"
              {...ctaButtonProps}
            >
              Answer a Survey
            </Button>
          ) : (
            <Typography variant="body2" color="primary">
              <Link href={accountSurveyHref}>Sign in to share your answers.</Link>
            </Typography>
          )}
          <Button component={Link} href={accountSurveyHref} variant="text" size="small">
            {viewSurveysLabel}
          </Button>
        </Stack>
      );
    }

    const playerName = formatPlayerName(spotlight);
    const teamSuffix = spotlight.teamName ? ` • ${spotlight.teamName}` : '';

    return (
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Q: {spotlight.question}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {spotlight.answer}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={spotlight.player.photoUrl} alt={playerName} sx={{ width: 40, height: 40 }}>
              {playerName.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              — {playerName}
              {teamSuffix}
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canAnswerSurvey ? (
            <Button
              component={Link}
              href={accountSurveyHref}
              variant="outlined"
              size="small"
              {...ctaButtonProps}
            >
              Answer a Survey
            </Button>
          ) : null}
          <Button component={Link} href={accountSurveyHref} variant="text" size="small">
            {viewSurveysLabel}
          </Button>
        </Box>
      </Stack>
    );
  };

  const headerIcon =
    icon ??
    (variant === 'card' ? (
      <QuestionAnswerIcon fontSize="small" />
    ) : (
      <QuestionAnswerIcon fontSize="small" color="primary" />
    ));

  return (
    <WidgetShell
      className={className}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {headerIcon}
          <Typography variant="h6" fontWeight={600} color="text.primary">
            {title}
          </Typography>
        </Box>
      }
      accent="primary"
      disablePadding={false}
      sx={{ width: '100%', maxWidth: '100%' }}
    >
      {renderSpotlightContent()}
    </WidgetShell>
  );
};

export default SurveySpotlightWidget;
