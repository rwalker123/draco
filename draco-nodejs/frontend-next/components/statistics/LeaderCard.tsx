'use client';

import React, { useState } from 'react';
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
}

export default function LeaderCard({
  leader,
  statLabel,
  formatter,
  hideTeamInfo = false,
}: LeaderCardProps) {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

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
        width: { xs: '100%', sm: 'fit-content' },
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
          gridTemplateColumns={{ xs: 'minmax(0, 1fr)', sm: 'auto auto' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          columnGap={{ xs: 1.5, sm: 1.5 }}
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

            <Box sx={{ flex: { xs: 1, sm: '0 1 auto' } }}>
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

              <Typography
                fontWeight="bold"
                sx={{
                  color: theme.palette.text.primary,
                  mb: { xs: 0.5, sm: 1 },
                  lineHeight: 1.2,
                  fontSize: { xs: '.90rem', sm: '1.0rem' },
                }}
              >
                {leader.playerName}
              </Typography>

              {!hideTeamInfo && !isTie && (
                <TeamBadges teams={leader.teams} teamName={leader.teamName} maxVisible={3} />
              )}
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: { xs: 'auto', sm: 96 },
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
