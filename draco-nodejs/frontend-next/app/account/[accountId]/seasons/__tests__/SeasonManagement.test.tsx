import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import BaseballSeasonManagement from '../BaseballSeasonManagement';
import type { LeagueSeasonWithDivisionType } from '@draco/shared-schemas';

const mockListAccountSeasons = vi.fn();
const mockListAccountLeagues = vi.fn();
const mockCopyAccountSeason = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ accountId: '42' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

vi.mock('@/context/RoleContext', () => ({
  useRole: () => ({
    hasRole: () => true,
  }),
}));

const mockApiClient = {};

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApiClient,
}));

vi.mock('@draco/shared-api-client', () => ({
  listAccountSeasons: (...args: unknown[]) => mockListAccountSeasons(...args),
  listAccountLeagues: (...args: unknown[]) => mockListAccountLeagues(...args),
  createLeague: vi.fn(),
  updateLeague: vi.fn(),
  addLeagueToSeason: vi.fn(),
  removeLeagueFromSeason: vi.fn(),
  createAccountSeason: vi.fn(),
  updateAccountSeason: vi.fn(),
  deleteAccountSeason: vi.fn(),
  copyAccountSeason: (...args: unknown[]) => mockCopyAccountSeason(...args),
  setCurrentAccountSeason: vi.fn(),
}));

const theme = createTheme();

const renderComponent = () =>
  render(
    <ThemeProvider theme={theme}>
      <BaseballSeasonManagement />
    </ThemeProvider>,
  );

const createSeasonResponse = (name: string, id: string): LeagueSeasonWithDivisionType => ({
  id,
  name,
  accountId: '42',
  isCurrent: false,
  leagues: [
    {
      id: `ls-${id}`,
      league: { id: `league-${id}`, name: 'Majors' },
      divisions: [],
    },
  ],
});

describe('SeasonManagement copy workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAccountLeagues.mockResolvedValue({ data: [], error: undefined });
  });

  it('shows a success message and refetches seasons when copy succeeds', async () => {
    const springSeason = createSeasonResponse('Spring 2024', '1');
    const copySeason = createSeasonResponse('Spring 2024 Copy', '2');

    mockListAccountSeasons
      .mockResolvedValueOnce({ data: [springSeason], error: undefined })
      .mockResolvedValueOnce({ data: [springSeason, copySeason], error: undefined });
    mockCopyAccountSeason.mockResolvedValue({ data: copySeason, error: undefined });

    renderComponent();

    await screen.findByText('Spring 2024');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /copy spring 2024/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Season copied successfully. All leagues, divisions, teams, active rosters, and managers were duplicated.',
        ),
      ).toBeInTheDocument();
    });

    expect(mockCopyAccountSeason).toHaveBeenCalledTimes(1);
    expect(mockListAccountSeasons).toHaveBeenCalledTimes(2);
  });

  it('surfaces an error message when the copy request fails', async () => {
    const springSeason = createSeasonResponse('Spring 2024', '1');

    mockListAccountSeasons.mockResolvedValue({ data: [springSeason], error: undefined });
    mockCopyAccountSeason.mockResolvedValue({ error: { message: 'Copy failed' } });

    renderComponent();
    await screen.findByText('Spring 2024');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /copy spring 2024/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }));

    await screen.findByText('Copy failed');
    expect(mockListAccountSeasons).toHaveBeenCalledTimes(1);
  });
});
