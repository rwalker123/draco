'use client';

import React from 'react';
import { Box } from '@mui/material';
import {
  Sports as SportsIcon,
  Leaderboard as LeaderboardIcon,
  PhotoLibrary as PhotoLibraryIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  Forum as ForumIcon,
  Campaign as CampaignIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { LANDING_FEATURES } from '@/config/landing';
import FeatureCard from './FeatureCard';

const iconMap: Record<string, React.ReactNode> = {
  Scoreboard: <SportsIcon />,
  Leaderboard: <LeaderboardIcon />,
  PhotoLibrary: <PhotoLibraryIcon />,
  EmojiEvents: <EmojiEventsIcon />,
  Groups: <GroupsIcon />,
  Forum: <ForumIcon />,
  Campaign: <CampaignIcon />,
  Handshake: <HandshakeIcon />,
};

export default function FeatureShowcaseSection() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 3,
      }}
    >
      {LANDING_FEATURES.map((feature) => (
        <FeatureCard
          key={feature.id}
          icon={iconMap[feature.icon]}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </Box>
  );
}
