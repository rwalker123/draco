'use client';

import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

interface UserCardSkeletonProps {
  cards?: number;
  cardSize?: 'compact' | 'comfortable' | 'spacious';
}

const UserCardSkeleton: React.FC<UserCardSkeletonProps> = ({
  cards = 6,
  cardSize = 'comfortable',
}) => {
  // Card size configurations
  const sizeConfig = {
    compact: { width: 280, height: 120 },
    comfortable: { width: 320, height: 140 },
    spacious: { width: 360, height: 160 },
  };

  const { width, height } = sizeConfig[cardSize];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {Array.from({ length: cards }).map((_, index) => (
          <Box key={index}>
            <Card sx={{ width, height }}>
              <CardContent sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Skeleton variant="text" width="90%" height={16} />
                  <Skeleton variant="text" width="80%" height={16} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Skeleton variant="rounded" width={32} height={32} />
                  <Skeleton variant="rounded" width={32} height={32} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserCardSkeleton;
