import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dracoTheme } from '../../../theme';
import SeasonSummaryWidget from '../SeasonSummaryWidget';
import { GameStatus } from '@/types/schedule';
import type { Game } from '@/types/schedule';
import type { SeasonSummary } from '../hooks/useTeamSeasonSummary';

const makeGame = (overrides: Partial<Game> & { id: string; gameDate: string }): Game => ({
  id: overrides.id,
  gameDate: overrides.gameDate,
  homeTeamId: overrides.homeTeamId ?? 'home-team',
  homeTeamName: overrides.homeTeamName ?? 'Home Team',
  visitorTeamId: overrides.visitorTeamId ?? 'visitor-team',
  visitorTeamName: overrides.visitorTeamName ?? 'Visitor Team',
  homeScore: overrides.homeScore ?? 0,
  visitorScore: overrides.visitorScore ?? 0,
  comment: overrides.comment ?? '',
  gameStatus: overrides.gameStatus ?? GameStatus.Scheduled,
  gameStatusText: overrides.gameStatusText ?? '',
  gameStatusShortText: overrides.gameStatusShortText ?? '',
  gameType: overrides.gameType ?? 0,
  fieldId: overrides.fieldId,
  field: overrides.field,
  league: overrides.league ?? { id: 'l1', name: 'Adult League' },
  season: overrides.season ?? { id: 's1', name: 'Season' },
});

const field = (id: string, name: string) => ({
  id,
  name,
  shortName: name,
  address: '',
  city: '',
  state: '',
});

const games = [
  makeGame({
    id: 'g1',
    gameDate: '2026-05-11T21:00:00Z',
    field: field('f1', 'Berkley'),
    homeTeamName: 'White Sox',
    visitorTeamName: 'Dodgers',
  }),
  makeGame({
    id: 'g2',
    gameDate: '2026-06-01T18:00:00Z',
    field: field('f2', 'Hamtramck'),
    homeTeamName: 'Tigers',
    visitorTeamName: 'Cubs',
  }),
];

const summary: SeasonSummary = {
  totalGames: 2,
  totalPlayed: 0,
  totalScheduled: 2,
  byField: [
    { fieldId: 'f1', fieldName: 'Berkley', upcoming: 1, played: 0, notPlayed: 0 },
    { fieldId: 'f2', fieldName: 'Hamtramck', upcoming: 1, played: 0, notPlayed: 0 },
  ],
  byDayType: {
    weekday: { played: 0, scheduled: 2 },
    weekend: { played: 0, scheduled: 0 },
  },
  byStartTime: [{ bucket: 'lateEvening', played: 0, scheduled: 2 }],
};

const renderWidget = (props: Partial<React.ComponentProps<typeof SeasonSummaryWidget>> = {}) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <SeasonSummaryWidget
        variant="embedded"
        summary={summary}
        loading={false}
        ready
        games={games}
        timeZone="UTC"
        printTitle="Detroit MSBL"
        printSubtitle="2025 Season Full Season Schedule"
        {...props}
      />
    </ThemeProvider>,
  );

interface CapturedDownload {
  filename: string;
  blob: Blob;
}

const downloads: CapturedDownload[] = [];
const printMock = vi.fn();

const readBlobText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

const readDownload = async (index: number): Promise<string[]> => {
  const text = await readBlobText(downloads[index].blob);
  return text
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');
};

beforeEach(() => {
  downloads.length = 0;
  printMock.mockClear();

  let pendingBlob: Blob | null = null;

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      pendingBlob = blob;
      return 'blob:mock';
    }),
    revokeObjectURL: vi.fn(),
  });

  vi.spyOn(window, 'print').mockImplementation(printMock);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (pendingBlob) {
      downloads.push({ filename: this.download, blob: pendingBlob });
      pendingBlob = null;
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SeasonSummaryWidget field exports', () => {
  it('exports every field, grouped in summary order, from the Fields section', async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Export all fields to CSV' }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/^detroit-msbl-field-schedule-\d{8}\.csv$/);

    const rows = await readDownload(0);
    expect(rows[0]).toBe('Field,Date,Time,League,Matchup,Result');
    expect(rows[1]).toContain('Berkley,"Mon, May 11, 2026"');
    expect(rows[1]).toContain('White Sox vs Dodgers,Upcoming');
    expect(rows[2]).toContain('Hamtramck,"Mon, Jun 1, 2026"');
  });

  it('prints every field grouped by field', async () => {
    const user = userEvent.setup();
    const { container } = renderWidget();

    await user.click(screen.getByRole('button', { name: 'Print all fields' }));

    expect(printMock).toHaveBeenCalledTimes(1);

    const printRoot = container.querySelector('.dr-print-root.dr-print-priority');
    expect(printRoot).not.toBeNull();
    const printed = within(printRoot as HTMLElement);
    expect(
      printed.getByText('2025 Season Full Season Schedule · Schedule by Field'),
    ).toBeInTheDocument();

    const printedRows = Array.from(printRoot?.querySelectorAll('tbody tr') ?? []).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => td.textContent),
    );
    expect(printedRows).toEqual([
      [
        'Berkley',
        'Mon, May 11, 2026',
        '9:00 PM',
        'Adult League',
        'White Sox vs Dodgers',
        'Upcoming',
      ],
      ['Hamtramck', 'Mon, Jun 1, 2026', '6:00 PM', 'Adult League', 'Tigers vs Cubs', 'Upcoming'],
    ]);
  });

  it('exports only the selected field from the field dialog', async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Berkley' }));
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/^berkley-field-schedule-\d{8}\.csv$/);

    const rows = await readDownload(0);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toContain('Berkley,"Mon, May 11, 2026"');
    expect(rows[1]).toContain('White Sox vs Dodgers,Upcoming');
  });

  it('prints only the selected field from the field dialog', async () => {
    const user = userEvent.setup();
    const { container } = renderWidget();

    await user.click(screen.getByRole('button', { name: 'Berkley' }));
    await user.click(screen.getByRole('button', { name: 'Print' }));

    expect(printMock).toHaveBeenCalledTimes(1);

    const printRoot = container.querySelector('.dr-print-root.dr-print-priority');
    expect(printRoot).not.toBeNull();
    const printed = within(printRoot as HTMLElement);
    expect(
      printed.getByText('2025 Season Full Season Schedule · Berkley Field Schedule'),
    ).toBeInTheDocument();
    expect(printed.getByText('White Sox vs Dodgers')).toBeInTheDocument();
    expect(printed.queryByText('Tigers vs Cubs')).toBeNull();

    const printedRows = printRoot?.querySelectorAll('tbody tr') ?? [];
    expect(printedRows).toHaveLength(1);
    expect(printedRows[0].querySelectorAll('td')[0].textContent).toBe('Berkley');
  });

  it('clears the print view once the browser finishes printing', async () => {
    const user = userEvent.setup();
    const { container } = renderWidget();

    await user.click(screen.getByRole('button', { name: 'Print all fields' }));
    expect(container.querySelector('.dr-print-priority')).not.toBeNull();

    window.dispatchEvent(new Event('afterprint'));

    await vi.waitFor(() => {
      expect(container.querySelector('.dr-print-priority')).toBeNull();
    });
  });

  it('omits the field actions when no games are supplied', () => {
    renderWidget({ games: [] });

    expect(
      screen.queryByRole('button', { name: 'Export all fields to CSV' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print all fields' })).not.toBeInTheDocument();
  });
});
