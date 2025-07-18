import * as React from 'react';
import { useTheme } from '@mui/material/styles';

const NewspaperRecapIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color }) => {
  const theme = useTheme();
  const iconColor = color || theme.palette.primary.main;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Newspaper body */}
      <rect
        x="6"
        y="10"
        width="28"
        height="20"
        rx="3"
        fill="#fff"
        stroke={iconColor}
        strokeWidth="2"
      />
      {/* Headline bar */}
      <rect x="9" y="13" width="22" height="3" rx="1.2" fill={iconColor} opacity="0.15" />
      {/* Text lines */}
      <rect x="9" y="18" width="16" height="1.2" rx="0.6" fill={iconColor} opacity="0.25" />
      <rect x="9" y="21" width="14" height="1.2" rx="0.6" fill={iconColor} opacity="0.25" />
      <rect x="9" y="24" width="18" height="1.2" rx="0.6" fill={iconColor} opacity="0.25" />
      {/* Small baseball in the lower right */}
      <circle cx="29" cy="26.5" r="3" fill="#fff" stroke={iconColor} strokeWidth="1" />
      <path d="M27.5 25 Q28 26.5 27.5 28" stroke={iconColor} strokeWidth="0.6" fill="none" />
      <path d="M30.5 25 Q30 26.5 30.5 28" stroke={iconColor} strokeWidth="0.6" fill="none" />
    </svg>
  );
};

export default NewspaperRecapIcon;
