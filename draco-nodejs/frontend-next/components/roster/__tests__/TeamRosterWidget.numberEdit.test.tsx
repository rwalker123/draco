import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import TeamRosterWidget from '../TeamRosterWidget';
import { dracoTheme } from '../../../theme';
import type { TeamRosterMembersType } from '@draco/shared-schemas';

const mockUpdateRosterMember = vi.fn();
const mockGetTeamRosterMembers = vi.fn();
const mockListTeamManagers = vi.fn();
const mockGetPublicTeamRosterMembers = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  updateRosterMember: (...args: unknown[]) => mockUpdateRosterMember(...args),
  getTeamRosterMembers: (...args: unknown[]) => mockGetTeamRosterMembers(...args),
  listTeamManagers: (...args: unknown[]) => mockListTeamManagers(...args),
  getPublicTeamRosterMembers: (...args: unknown[]) => mockGetPublicTeamRosterMembers(...args),
}));

vi.mock('@/hooks/useApiClient', () => {
  const client = {};
  return { useApiClient: () => client };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

vi.mock('@/hooks/useRosterDataManager', () => ({
  useRosterDataManager: () => ({ setError: vi.fn() }),
}));

vi.mock('@/hooks/useRosterPhoto', () => ({
  useRosterPhoto: () => ({ uploadPhoto: vi.fn(), deletePhoto: vi.fn(), loading: false }),
}));

vi.mock('@/hooks/useAccountSettings', () => ({
  useAccountSettings: () => ({
    settings: [
      { definition: { key: 'AllowTeamAdminPlayerEdits' }, effectiveValue: true },
      { definition: { key: 'TrackGamesPlayed' }, effectiveValue: false },
    ],
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/account/1/seasons/2/teams/3',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/users/UserAvatar', () => ({
  default: () => <div data-testid="user-avatar" />,
}));

const buildRoster = (playerNumber: string): TeamRosterMembersType => ({
  teamSeason: { id: '3', name: 'Test Team' },
  rosterMembers: [
    {
      id: '100',
      playerNumber,
      inactive: false,
      dateAdded: null,
      player: {
        id: '200',
        submittedDriversLicense: false,
        firstYear: 2020,
        contact: { id: '300', firstName: 'Jane', lastName: 'Doe' },
      },
    },
  ],
});

const renderWidget = () =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <TeamRosterWidget
        accountId="1"
        seasonId="2"
        teamSeasonId="3"
        canViewSensitiveDetails
        isTeamAdmin
      />
    </ThemeProvider>,
  );

describe('TeamRosterWidget inline player-number editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeamRosterMembers.mockResolvedValue({ data: buildRoster('7') });
    mockListTeamManagers.mockResolvedValue({ data: [] });
  });

  const enterEditMode = async (user: ReturnType<typeof userEvent.setup>) => {
    const editTrigger = await screen.findByRole('button', { name: 'Edit player number' });
    await user.click(editTrigger);
    return screen.findByRole('textbox', { name: 'Player number' });
  };

  it('strips non-digit characters from the input so only numbers can be entered', async () => {
    const user = userEvent.setup();
    renderWidget();

    const input = (await enterEditMode(user)) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'a1b2c');

    expect(input.value).toBe('12');
  });

  it('caps the entered number at two digits', async () => {
    const user = userEvent.setup();
    renderWidget();

    const input = (await enterEditMode(user)) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '12345');

    expect(input.value).toBe('12');
  });

  it('saves a valid number and updates only after the server responds (no optimistic update)', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: { data: unknown }) => void = () => {};
    mockUpdateRosterMember.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    renderWidget();

    const input = await enterEditMode(user);
    await user.clear(input);
    await user.type(input, '23');
    await user.click(screen.getByRole('button', { name: 'Save player number' }));

    expect(mockUpdateRosterMember).toHaveBeenCalledTimes(1);
    expect(mockUpdateRosterMember.mock.calls[0][0]).toMatchObject({
      path: { accountId: '1', seasonId: '2', teamSeasonId: '3', rosterMemberId: '100' },
      body: { playerNumber: '23' },
    });

    // Still in edit mode with no optimistic value applied while the request is pending.
    expect(screen.getByRole('textbox', { name: 'Player number' })).toBeInTheDocument();

    resolveUpdate({ data: { ...buildRoster('23').rosterMembers[0] } });

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Player number' })).not.toBeInTheDocument();
    });
    const editTrigger = await screen.findByRole('button', { name: 'Edit player number' });
    expect(within(editTrigger).getByText('23')).toBeInTheDocument();
  });

  it('cancels editing and restores the original number without calling the API', async () => {
    const user = userEvent.setup();
    renderWidget();

    const input = await enterEditMode(user);
    await user.clear(input);
    await user.type(input, '12');
    await user.click(screen.getByRole('button', { name: 'Cancel editing player number' }));

    const editTrigger = await screen.findByRole('button', { name: 'Edit player number' });
    expect(within(editTrigger).getByText('7')).toBeInTheDocument();
    expect(mockUpdateRosterMember).not.toHaveBeenCalled();
  });
});
