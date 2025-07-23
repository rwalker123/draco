'use client';

import React from 'react';
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
}

interface LeaderCardProps {
  leader: LeaderRow;
  statLabel: string;
  formatter: (value: unknown) => string;
}

export default function LeaderCard({ leader, statLabel, formatter }: LeaderCardProps) {
  const theme = useTheme();

  // Placeholder for future player photo integration
  const getPlayerInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  // Use theme colors for consistency
  const primaryColor = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light;
  const secondaryColor = theme.palette.secondary.main;

  // Check if this is a tie entry
  const isTie = leader.isTie;

  return (
    <Card
      elevation={3}
      sx={{
        mb: 2,
        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.1)} 0%, ${alpha(primaryLight, 0.15)} 100%)`,
        border: `2px solid ${alpha(primaryColor, 0.3)}`,
        position: 'relative',
        overflow: 'visible',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Trophy icon in top right */}
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          backgroundColor: secondaryColor,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 2,
        }}
      >
        <TrophyIcon sx={{ color: theme.palette.secondary.contrastText, fontSize: 20 }} />
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
          {/* Left Column - Player Info */}
          <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
            {/* Player Photo Placeholder or Tie Icon */}
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: '1.25rem',
                fontWeight: 'bold',
                bgcolor: isTie ? secondaryColor : 'primary.main',
                color: isTie ? theme.palette.secondary.contrastText : 'primary.contrastText',
                border: '3px solid white',
                boxShadow: 2,
              }}
            >
              {isTie ? '#' : getPlayerInitials(leader.playerName)}
            </Avatar>

            <Box flex={1}>
              {/* Leader Badge */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <StarIcon sx={{ color: secondaryColor, fontSize: 20 }} />
                <Chip
                  label={isTie ? 'TIE FOR LEAD' : 'LEADER'}
                  size="small"
                  sx={{
                    backgroundColor: secondaryColor,
                    color: theme.palette.secondary.contrastText,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                  }}
                />
              </Box>

              {/* Player Name or Tie Text */}
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 1,
                  lineHeight: 1.2,
                }}
              >
                {leader.playerName}
              </Typography>

              {/* Teams - hide for tie entries */}
              {!isTie && (
                <TeamBadges teams={leader.teams} teamName={leader.teamName} maxVisible={3} />
              )}
            </Box>
          </Box>

          {/* Right Column - Stat Value */}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: 120,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{
                color: theme.palette.text.primary,
                lineHeight: 1,
                mb: 0.5,
                fontSize: { xs: '2rem', sm: '2.75rem' },
              }}
            >
              {formatter(leader.statValue)}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 'medium',
                textTransform: 'uppercase',
                letterSpacing: 1,
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
