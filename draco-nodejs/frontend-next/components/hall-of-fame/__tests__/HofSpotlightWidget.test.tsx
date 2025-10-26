import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  listAccountHallOfFameClasses,
  getAccountHallOfFameRandomMember,
  getAccountHallOfFameNominationSetup,
} from '@draco/shared-api-client';
import HofSpotlightWidget from '../HofSpotlightWidget';

vi.mock('@draco/shared-api-client', () => ({
  listAccountHallOfFameClasses: vi.fn(),
  getAccountHallOfFameRandomMember: vi.fn(),
  getAccountHallOfFameNominationSetup: vi.fn(),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(),
}));

vi.mock('../HofNominationDialog', () => ({
  __esModule: true,
  default: ({
    open,
    onClose,
    onSubmitted,
  }: {
    open: boolean;
    onClose: () => void;
    onSubmitted?: () => void;
  }) =>
    open ? (
      <div data-testid="hof-nomination-dialog">
        <button
          type="button"
          onClick={() => {
            onSubmitted?.();
            onClose();
          }}
        >
          Confirm Nomination
        </button>
      </div>
    ) : null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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

  it('shows spotlight details and handles nomination submission', async () => {
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

    vi.mocked(getAccountHallOfFameNominationSetup).mockResolvedValue({
      data: {
        accountId: '1',
        enableNomination: true,
        criteriaText: '<p>Respect and dedication<script>alert(1)</script></p>',
      },
    } as unknown as Awaited<ReturnType<typeof getAccountHallOfFameNominationSetup>>);

    const { container } = render(<HofSpotlightWidget accountId="account-42" />);

    expect(await screen.findByText('Hall of Fame Spotlight')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alex Morgan', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Nomination' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Submit Nomination' }));
    expect(await screen.findByTestId('hof-nomination-dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm Nomination' }));
    await waitFor(() =>
      expect(
        screen.getByText('Thanks for the nomination! Our administrators will review it shortly.'),
      ).toBeInTheDocument(),
    );
  });
});
