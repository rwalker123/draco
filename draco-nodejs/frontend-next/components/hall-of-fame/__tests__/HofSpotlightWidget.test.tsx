import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  listAccountHallOfFameClasses,
  getAccountHallOfFameRandomMember,
} from '@draco/shared-api-client';
import HofSpotlightWidget from '../HofSpotlightWidget';

vi.mock('@draco/shared-api-client', () => ({
  listAccountHallOfFameClasses: vi.fn(),
  getAccountHallOfFameRandomMember: vi.fn(),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(),
}));

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('HofSpotlightWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no Hall of Fame classes exist', async () => {
    vi.mocked(listAccountHallOfFameClasses).mockResolvedValue({ data: [] } as unknown as Awaited<
      ReturnType<typeof listAccountHallOfFameClasses>
    >);

    const { container } = render(<HofSpotlightWidget accountId="abc" />);

    await waitFor(() => expect(listAccountHallOfFameClasses).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(getAccountHallOfFameRandomMember).not.toHaveBeenCalled();
  });

  it('shows spotlight details and links to the hall of fame page', async () => {
    vi.mocked(listAccountHallOfFameClasses).mockResolvedValue({
      data: [
        {
          year: 2022,
          memberCount: 3,
        },
      ],
    } as unknown as Awaited<ReturnType<typeof listAccountHallOfFameClasses>>);

    vi.mocked(getAccountHallOfFameRandomMember).mockResolvedValue({
      data: {
        id: BigInt(1),
        accountId: BigInt(1),
        contactId: BigInt(10),
        yearInducted: 2022,
        biographyHtml: '<p>Consistent leader</p>',
        contact: {
          id: '10',
          firstName: 'Alex',
          lastName: 'Morgan',
          displayName: 'Alex Morgan',
          photoUrl: null,
        },
      },
    } as unknown as Awaited<ReturnType<typeof getAccountHallOfFameRandomMember>>);

    render(<HofSpotlightWidget accountId="account-42" />);

    expect(await screen.findByText('Hall of Fame Spotlight')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alex Morgan', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Hall of Fame' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit Nomination' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'View Hall of Fame' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/account/account-42/hall-of-fame'));
  });
});
