import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const iconBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: iconBg,
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.widget.headerText }}>
          {title}
        </Typography>
        <Typography variant="body2" color={theme.palette.widget.supportingText}>
          {description}
        </Typography>
        {actionButton ? (
          <Button
            variant="outlined"
            onClick={actionButton.onClick}
            size="small"
            color="primary"
            sx={{ mt: 1.5 }}
          >
            {actionButton.label}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

export default SectionHeader;
