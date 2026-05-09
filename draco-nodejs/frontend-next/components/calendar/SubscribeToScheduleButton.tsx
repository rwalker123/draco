'use client';
import React, { useId, useState, useSyncExternalStore } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { buildCalendarSubscribeUrls } from '../../utils/calendarSubscribe';

interface SubscribeToScheduleButtonProps {
  teamSeasonId: string;
  teamName: string;
  size?: 'small' | 'medium';
  variant?: 'text' | 'outlined' | 'contained';
}

const subscribeToOrigin = () => () => {};
const getOriginSnapshot = () => window.location.origin;
const getServerOriginSnapshot = () => '';

const SubscribeToScheduleButton: React.FC<SubscribeToScheduleButtonProps> = ({
  teamSeasonId,
  teamName,
  size = 'small',
  variant = 'outlined',
}) => {
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getOriginSnapshot,
    getServerOriginSnapshot,
  );
  const isDisabled = origin === '';

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  if (isDisabled) {
    return (
      <Tooltip title="Subscribe unavailable">
        <span>
          <Button size={size} variant={variant} startIcon={<EventAvailableIcon />} disabled>
            Subscribe
          </Button>
        </span>
      </Tooltip>
    );
  }

  const icsUrl = `${origin}/api/calendar/team-season/${encodeURIComponent(teamSeasonId)}.ics`;
  const urls = buildCalendarSubscribeUrls(icsUrl, teamName);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        startIcon={<EventAvailableIcon />}
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
      >
        Subscribe
      </Button>
      <Menu id={menuId} anchorEl={anchorEl} open={isOpen} onClose={closeMenu}>
        <MenuItem
          component="a"
          href={urls.google}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
          sx={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            whiteSpace: 'normal',
            py: 1,
          }}
        >
          <Typography variant="body2">Google Calendar</Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ maxWidth: 280, lineHeight: 1.3 }}
          >
            Events may take up to a day to appear. Don&apos;t unsubscribe and retry — it restarts
            the wait.
          </Typography>
        </MenuItem>
        <MenuItem
          component="a"
          href={urls.apple}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Apple Calendar
        </MenuItem>
        <MenuItem
          component="a"
          href={urls.outlookCom}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Outlook.com
        </MenuItem>
        <MenuItem
          component="a"
          href={urls.office365}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Office 365
        </MenuItem>
      </Menu>
    </>
  );
};

export default SubscribeToScheduleButton;
