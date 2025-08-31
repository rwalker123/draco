'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { getCharacterCountColor } from '../../utils/characterValidation';

interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  className?: string;
  sx?: object;
}

/**
 * Reusable character counter component with color-coded feedback
 *
 * Features:
 * - Real-time character count display
 * - Color-coded visual feedback (green → orange → red)
 * - Consistent styling across all forms
 * - Responsive design
 *
 * @param currentLength - Current number of characters
 * @param maxLength - Maximum allowed characters
 * @param className - Optional CSS class name
 * @param sx - Optional Material-UI sx prop for custom styling
 */
const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentLength,
  maxLength,
  className,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 0.5,
        ...sx,
      }}
      className={className}
    >
      <Typography
        variant="caption"
        sx={{
          color: getCharacterCountColor(currentLength, maxLength),
          fontSize: '0.75rem',
        }}
      >
        {currentLength} / {maxLength} characters
      </Typography>
    </Box>
  );
};

export default CharacterCounter;
