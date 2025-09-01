import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  actionButton,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      {actionButton && (
        <Button variant="outlined" onClick={actionButton.onClick}>
          {actionButton.label}
        </Button>
      )}
    </Box>
  );
};

export default SectionHeader;
