import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface MemberBusinessPlaceholderProps {
  sx?: Record<string, unknown>;
}

const MemberBusinessPlaceholder: React.FC<MemberBusinessPlaceholderProps> = ({ sx }) => {
  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'primary.light',
        bgcolor: 'grey.50',
        ...sx,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
        Member Business
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          We&apos;re building a streamlined hub for your member business tasks. Soon you&apos;ll be
          able to manage certifications, outstanding requirements, and organization reminders in one
          place.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stay tuned—this section will light up as soon as the feature ships.
        </Typography>
      </Box>
    </Paper>
  );
};

export default MemberBusinessPlaceholder;
