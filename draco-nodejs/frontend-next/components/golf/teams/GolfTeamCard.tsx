'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { Groups as TeamIcon, Person as PlayerIcon } from '@mui/icons-material';
import type { GolfTeamType, GolfTeamWithRosterType } from '@draco/shared-schemas';

interface GolfTeamCardProps {
  team: GolfTeamType | GolfTeamWithRosterType;
  onClick?: () => void;
  selected?: boolean;
  showPlayerCount?: boolean;
  showFlightInfo?: boolean;
}

const isTeamWithRoster = (
  team: GolfTeamType | GolfTeamWithRosterType,
): team is GolfTeamWithRosterType => {
  return 'playerCount' in team;
};

const GolfTeamCard: React.FC<GolfTeamCardProps> = ({
  team,
  onClick,
  selected = false,
  showPlayerCount = true,
  showFlightInfo = true,
}) => {
  const playerCount = isTeamWithRoster(team) ? team.playerCount : null;
  const hasNoFlight = !team.flight;

  const cardContent = (
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
          }}
        >
          <TeamIcon />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {team.name}
            </Typography>
            {hasNoFlight && showFlightInfo && (
              <Chip
                label="Unassigned"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 20 }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {showFlightInfo && team.flight && (
              <Typography variant="body2" color="text.secondary">
                {team.flight.name}
              </Typography>
            )}
            {showPlayerCount && playerCount !== null && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PlayerIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {playerCount} player{playerCount !== 1 ? 's' : ''}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>
    </CardContent>
  );

  return (
    <Card
      elevation={selected ? 4 : 1}
      sx={{
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              borderColor: 'primary.light',
              boxShadow: 2,
            }
          : undefined,
      }}
    >
      {onClick ? <CardActionArea onClick={onClick}>{cardContent}</CardActionArea> : cardContent}
    </Card>
  );
};

export default GolfTeamCard;
