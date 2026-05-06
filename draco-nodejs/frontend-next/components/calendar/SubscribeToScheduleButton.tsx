'use client';
import React, { useId, useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { buildCalendarSubscribeUrls } from '../../utils/calendarSubscribe';

interface SubscribeToScheduleButtonProps {
  seasonTeamId: string;
  teamName: string;
  size?: 'small' | 'medium';
  variant?: 'text' | 'outlined' | 'contained';
}

const SubscribeToScheduleButton: React.FC<SubscribeToScheduleButtonProps> = ({
  seasonTeamId,
  teamName,
  size = 'small',
  variant = 'outlined',
}) => {
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const isDisabled = apiUrl === '';

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

  const icsUrl = `${apiUrl}/api/calendar/team-season/${encodeURIComponent(seasonTeamId)}.ics`;
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
        >
          Google Calendar
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
