import React from 'react';
import { Button } from '@mui/material';

interface TodayButtonProps {
  onClick: () => void;
  title?: string;
  variant?: 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Reusable Today button component
 * Eliminates duplication of "Today" button patterns across navigation components
 */
const TodayButton: React.FC<TodayButtonProps> = ({
  onClick,
  title = 'Go to today',
  variant = 'outlined',
  size = 'small',
}) => {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      sx={{
        ml: 1,
        color: 'primary.main',
        borderColor: 'primary.main',
        '&:hover': {
          backgroundColor: 'primary.50',
          borderColor: 'primary.dark',
        },
      }}
      title={title}
    >
      Today
    </Button>
  );
};

export default TodayButton;
