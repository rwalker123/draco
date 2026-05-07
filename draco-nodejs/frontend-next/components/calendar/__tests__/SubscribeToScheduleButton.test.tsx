import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { dracoTheme } from '../../../theme';
import SubscribeToScheduleButton from '../SubscribeToScheduleButton';
import { buildCalendarSubscribeUrls } from '../../../utils/calendarSubscribe';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={dracoTheme}>{ui}</ThemeProvider>);

const TEAM_SEASON_ID = 'ts-abc-123';
const TEAM_NAME = 'Springfield Hawks';
const ORIGIN = 'https://app.example.test';

const expectedIcsUrl = `${ORIGIN}/api/calendar/team-season/${encodeURIComponent(TEAM_SEASON_ID)}.ics`;

const setOrigin = (value: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, origin: value },
  });
};

describe('SubscribeToScheduleButton', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    setOrigin(ORIGIN);
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders a trigger button labelled Subscribe', () => {
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('opens menu with all four provider labels when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Apple Calendar')).toBeInTheDocument();
      expect(screen.getByText('Outlook.com')).toBeInTheDocument();
      expect(screen.getByText('Office 365')).toBeInTheDocument();
    });
  });

  it('does not render a Download .ics menu item', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });
    expect(screen.queryByText('Download .ics')).not.toBeInTheDocument();
  });

  it('provider link hrefs are built from window.location.origin', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    const urls = buildCalendarSubscribeUrls(expectedIcsUrl, TEAM_NAME);

    await waitFor(() => {
      const googleLink = screen.getByText('Google Calendar').closest('a');
      expect(googleLink).toHaveAttribute('href', urls.google);

      const appleLink = screen.getByText('Apple Calendar').closest('a');
      expect(appleLink).toHaveAttribute('href', urls.apple);

      const outlookLink = screen.getByText('Outlook.com').closest('a');
      expect(outlookLink).toHaveAttribute('href', urls.outlookCom);

      const officeLink = screen.getByText('Office 365').closest('a');
      expect(officeLink).toHaveAttribute('href', urls.office365);
    });
  });

  it('Apple Calendar link starts with webcal://', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      const appleLink = screen.getByText('Apple Calendar').closest('a');
      expect(appleLink?.getAttribute('href')).toMatch(/^webcal:\/\//);
    });
  });

  it('provider links have target=_blank and rel containing noopener and noreferrer', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      for (const label of ['Google Calendar', 'Apple Calendar', 'Outlook.com', 'Office 365']) {
        const link = screen.getByText(label).closest('a');
        expect(link).toHaveAttribute('target', '_blank');
        const rel = link?.getAttribute('rel') ?? '';
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      }
    });
  });

  it('renders a disabled button when window.location.origin is empty', async () => {
    setOrigin('');
    renderWithTheme(
      <SubscribeToScheduleButton teamSeasonId={TEAM_SEASON_ID} teamName={TEAM_NAME} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeDisabled();
    });
  });
});
