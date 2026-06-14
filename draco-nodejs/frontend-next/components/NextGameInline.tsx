import React from 'react';
import { Box } from '@mui/material';
import Link from 'next/link';
import { formatDateInTimezone, formatGameTime } from '../utils/dateUtils';

interface NextGameInlineProps {
  accountId: string;
  seasonId: string;
  gameDate: string;
  isHome: boolean;
  opponent: { id: string; name?: string | null };
  timeZone: string;
  showTime?: boolean;
  opponentMaxWidth?: string;
}

const NextGameInline: React.FC<NextGameInlineProps> = ({
  accountId,
  seasonId,
  gameDate,
  isHome,
  opponent,
  timeZone,
  showTime = false,
  opponentMaxWidth,
}) => {
  const dateLabel = formatDateInTimezone(gameDate, timeZone, {
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = showTime ? formatGameTime(gameDate, timeZone) : null;

  const linkStyle: React.CSSProperties = opponentMaxWidth
    ? {
        display: 'inline-block',
        maxWidth: opponentMaxWidth,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'bottom',
      }
    : {};

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        },
      }}
    >
      <span>
        {dateLabel}
        {timeLabel ? `, ${timeLabel}` : ''}
        {isHome ? ' vs. ' : ' @ '}
      </span>
      <Link
        href={`/account/${accountId}/seasons/${seasonId}/teams/${opponent.id}`}
        title={opponent.name ?? undefined}
        style={linkStyle}
      >
        {opponent.name ?? 'Unnamed Team'}
      </Link>
    </Box>
  );
};

export default NextGameInline;
