'use client';

import React, { useMemo, useState } from 'react';
import NextLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Box, Typography, Card, CardContent, Avatar, Chip, useTheme, alpha } from '@mui/material';
import { Star as StarIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import TeamBadges from './TeamBadges';

interface LeaderRow {
  playerId: string;
  playerName: string;
  teams?: string[];
  teamName: string;
  statValue: number | string;
  category: string;
  rank: number;
  isTie?: boolean;
  tieCount?: number;
  photoUrl?: string;
}

interface LeaderCardProps {
  leader: LeaderRow;
  statLabel: string;
  formatter: (value: unknown) => string;
  hideTeamInfo?: boolean;
  accountId?: string;
  playerLinkLabel?: string;
}

export default function LeaderCard({
  leader,
  statLabel,
  formatter,
  hideTeamInfo = false,
  accountId,
  playerLinkLabel,
}: LeaderCardProps) {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLocation = useMemo(() => {
    if (!pathname) {
      return null;
    }
    if (!searchParams) {
      return pathname;
    }
    const query = searchParams.toString();
    return query.length > 0 ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const playerHref = useMemo(() => {
    if (!accountId) {
      return null;
    }
    if (leader.isTie) {
      return null;
    }
    const rawId = leader.playerId;
    if (!rawId) {
      return null;
    }
    const playerId = rawId.trim();
    if (playerId.length === 0) {
      return null;
    }
    const basePath = `/account/${accountId}/players/${playerId}/statistics`;
    const query = new URLSearchParams();
    if (currentLocation) {
      query.set('returnTo', currentLocation);
      const label = (playerLinkLabel ?? '').trim();
      if (label.length > 0) {
        query.set('returnLabel', label);
      }
    }
    const queryString = query.toString();
    return queryString.length > 0 ? `${basePath}?${queryString}` : basePath;
  }, [accountId, leader.isTie, leader.playerId, currentLocation, playerLinkLabel]);

  const getPlayerInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  const primaryColor = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light;
  const secondaryColor = theme.palette.secondary.main;
  const isTie = leader.isTie;
  const showPhoto = !isTie && Boolean(leader.photoUrl) && !imageError;

  return (
    <Card
      elevation={3}
      sx={{
        mb: 2,
        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryLight, 0.12)} 100%)`,
        border: `2px solid ${alpha(primaryColor, 0.25)}`,
        position: 'relative',
        overflow: 'visible',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        width: { xs: '100%', sm: 'auto' },
        minWidth: { sm: 380 },
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          backgroundColor: secondaryColor,
          borderRadius: '50%',
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 2,
        }}
      >
        <TrophyIcon
          sx={{
            color: theme.palette.secondary.contrastText,
            fontSize: { xs: 16, sm: 20 },
          }}
        />
      </Box>

      <CardContent
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.5 },
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{ xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          columnGap={{ xs: 1.5, sm: 2 }}
          rowGap={{ xs: 1.75, sm: 0 }}
          justifyContent={{ sm: 'flex-start' }}
        >
          <Box display="flex" alignItems="flex-start" gap={{ xs: 1.5, sm: 1.5 }} flexShrink={0}>
            <Avatar
              sx={{
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 'bold',
                bgcolor: isTie ? secondaryColor : 'primary.main',
                color: isTie ? theme.palette.secondary.contrastText : 'primary.contrastText',
                border: '2px solid white',
                boxShadow: 2,
              }}
              src={showPhoto ? leader.photoUrl : undefined}
              alt={leader.playerName}
              imgProps={{
                onError: () => {
                  setImageError(true);
                },
                loading: 'lazy',
              }}
            >
              {(!showPhoto || isTie) && (isTie ? '#' : getPlayerInitials(leader.playerName))}
            </Avatar>

            <Box
              sx={{
                flex: { xs: 1, sm: '0 1 auto' },
                minWidth: 0,
                maxWidth: { xs: '100%', sm: 260 },
              }}
            >
              <Box display="flex" alignItems="center" gap={0.75} mb={{ xs: 0.5, sm: 1 }}>
                <StarIcon
                  sx={{
                    color: secondaryColor,
                    fontSize: { xs: 16, sm: 20 },
                  }}
                />
                <Chip
                  label={isTie ? 'TIE FOR LEAD' : 'LEADER'}
                  size="small"
                  sx={{
                    backgroundColor: secondaryColor,
                    color: theme.palette.secondary.contrastText,
                    fontWeight: 600,
                    fontSize: { xs: '0.5rem', sm: '0.65rem' },
                    px: { xs: 0.75, sm: 1 },
                    py: { xs: 0.1, sm: 0.2 },
                  }}
                />
              </Box>

              {playerHref ? (
                <Typography
                  component={NextLink}
                  href={playerHref}
                  prefetch={false}
                  fontWeight="bold"
                  sx={{
                    color: 'primary.main',
                    mb: { xs: 0.5, sm: 1 },
                    lineHeight: 1.2,
                    fontSize: { xs: '.90rem', sm: '1.0rem' },
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {leader.playerName}
                </Typography>
              ) : (
                <Typography
                  fontWeight="bold"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: { xs: 0.5, sm: 1 },
                    lineHeight: 1.2,
                    fontSize: { xs: '.90rem', sm: '1.0rem' },
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {leader.playerName}
                </Typography>
              )}

              {!hideTeamInfo && !isTie && (
                <Box sx={{ maxWidth: { xs: '100%', sm: 260 }, mt: 0.25 }}>
                  <TeamBadges teams={leader.teams} teamName={leader.teamName} maxVisible={3} />
                </Box>
              )}
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: { xs: 'auto', sm: 128 },
              px: { sm: 1 },
              textAlign: 'center',
              justifySelf: { xs: 'stretch', sm: 'end' },
            }}
          >
            <Typography
              fontWeight="bold"
              sx={{
                color: theme.palette.text.primary,
                lineHeight: 1,
                mb: { xs: 0.25, sm: 0.5 },
                fontSize: { xs: '1.15', sm: '1.5rem' },
              }}
            >
              {formatter(leader.statValue)}
            </Typography>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.68rem', sm: '0.82rem' },
              }}
            >
              {statLabel}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
