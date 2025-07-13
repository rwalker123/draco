import * as React from 'react';

const GameRecapIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#1e3a8a',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Baseball */}
    <circle cx="20" cy="20" r="16" fill="#fff" stroke={color} strokeWidth="2" />
    {/* Stitches */}
    <path d="M10 14 Q13 20 10 26" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M30 14 Q27 20 30 26" stroke={color} strokeWidth="1.2" fill="none" />
    {/* Notepad/Recap lines */}
    <rect
      x="14"
      y="24"
      width="12"
      height="8"
      rx="2"
      fill="#f3f4f6"
      stroke={color}
      strokeWidth="1"
    />
    <line x1="16" y1="27" x2="26" y2="27" stroke={color} strokeWidth="0.8" />
    <line x1="16" y1="29" x2="26" y2="29" stroke={color} strokeWidth="0.8" />
    {/* Pencil */}
    <rect
      x="22.5"
      y="31"
      width="5"
      height="1.2"
      rx="0.6"
      fill="#f59e42"
      stroke={color}
      strokeWidth="0.5"
    />
    <polygon points="27.5,31.6 28.5,32 27.5,32.4" fill="#fbbf24" />
  </svg>
);

export default GameRecapIcon;
