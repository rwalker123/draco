'use client';

// Smooth Data Transition Component
// Provides seamless fade transitions when data changes
// Single Responsibility: Handle smooth transitions between data states

import React from 'react';
import { Box, Fade } from '@mui/material';

export interface SmoothDataTransitionProps {
  children: React.ReactNode;
  loading: boolean;
  data: unknown; // Use this to detect when data changes
  transitionDuration?: number;
  keepPreviousDataVisible?: boolean;
  className?: string;
  sx?: object;
}

const SmoothDataTransition: React.FC<SmoothDataTransitionProps> = ({
  children,
  loading,
  data: _data,
  transitionDuration = 300,
  keepPreviousDataVisible = true,
  className,
  sx = {},
}) => {
  const shouldHideContent = !keepPreviousDataVisible && loading;
  const shouldDimContent = keepPreviousDataVisible && loading;

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        ...sx,
      }}
    >
      <Fade in={!shouldHideContent} timeout={transitionDuration} style={{ transitionDelay: '0ms' }}>
        <Box
          sx={{
            opacity: shouldDimContent ? 0.7 : 1,
            transition: `opacity ${transitionDuration}ms ease-in-out`,
            filter: shouldDimContent ? 'blur(0.5px)' : 'none',
          }}
        >
          {children}
        </Box>
      </Fade>

      {/* Loading overlay with subtle visual feedback */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'transparent',
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(25, 118, 210, 0.6) 50%, 
                transparent 100%)`,
              animation: 'slideProgress 1s ease-in-out infinite',
            },
            '@keyframes slideProgress': {
              '0%': {
                transform: 'translateX(-100%)',
              },
              '100%': {
                transform: 'translateX(100%)',
              },
            },
          }}
        />
      )}
    </Box>
  );
};

export default SmoothDataTransition;
