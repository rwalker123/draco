import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import TodayButton from './TodayButton';

interface NavigationHeaderProps {
  title: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  todayTitle?: string;
  isNavigating?: boolean;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  titleColor?: 'white' | 'primary.main';
}

/**
 * Reusable navigation header component
 * Eliminates duplication of navigation header patterns across different views
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  onPrevious,
  onNext,
  onToday,
  todayTitle = 'Go to today',
  isNavigating = false,
  previousDisabled = false,
  nextDisabled = false,
  titleColor = 'white',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
        backgroundColor: 'primary.main',
        borderRadius: 1,
      }}
    >
      <IconButton
        size="small"
        onClick={onPrevious}
        disabled={previousDisabled || isNavigating}
        sx={{ color: 'primary.main' }}
        title="Previous"
      >
        <ChevronLeftIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: titleColor }}>
          {title}
        </Typography>

        <TodayButton onClick={onToday} title={todayTitle} />
      </Box>

      <IconButton
        size="small"
        onClick={onNext}
        disabled={nextDisabled || isNavigating}
        sx={{ color: 'primary.main' }}
        title="Next"
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};

export default NavigationHeader;
