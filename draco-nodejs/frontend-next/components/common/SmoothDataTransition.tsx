'use client';

// Smooth Data Transition Component
// Provides seamless fade transitions when data changes
// Single Responsibility: Handle smooth transitions between data states

import React, { useState, useEffect, useRef } from 'react';
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
  data,
  transitionDuration = 300,
  keepPreviousDataVisible = true,
  className,
  sx = {},
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayData, setDisplayData] = useState(data);
  const [showContent, setShowContent] = useState(true);
  const dataRef = useRef(data);
  const loadingRef = useRef(loading);

  // Track data changes and loading state
  useEffect(() => {
    const dataChanged = dataRef.current !== data;

    // Start transition when loading begins (new data requested)
    if (!loadingRef.current && loading && dataChanged) {
      if (keepPreviousDataVisible) {
        // Keep showing old data while loading
        setIsTransitioning(true);
      } else {
        // Fade out immediately
        setShowContent(false);
        setIsTransitioning(true);
      }
    }

    // Complete transition when loading ends (new data available)
    if (loadingRef.current && !loading && dataChanged) {
      if (keepPreviousDataVisible) {
        // Quick fade out then fade in with new data
        setShowContent(false);
        setTimeout(() => {
          setDisplayData(data);
          setShowContent(true);
          setTimeout(() => {
            setIsTransitioning(false);
          }, transitionDuration);
        }, transitionDuration / 3);
      } else {
        // Just fade in with new data
        setDisplayData(data);
        setShowContent(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, transitionDuration);
      }
    }

    // Update refs
    dataRef.current = data;
    loadingRef.current = loading;
  }, [data, loading, transitionDuration, keepPreviousDataVisible]);

  // Initial data setup
  useEffect(() => {
    if (!isTransitioning) {
      setDisplayData(data);
    }
  }, [data, isTransitioning]);

  // Suppress unused variable warning - displayData is used for state management
  void displayData;

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        ...sx,
      }}
    >
      <Fade
        in={showContent}
        timeout={transitionDuration}
        style={{
          transitionDelay: showContent ? '0ms' : '0ms',
        }}
      >
        <Box
          sx={{
            opacity: isTransitioning && loading ? 0.7 : 1,
            transition: `opacity ${transitionDuration}ms ease-in-out`,
            filter: isTransitioning && loading ? 'blur(0.5px)' : 'none',
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
