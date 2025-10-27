import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getAccountHallOfFameNominationSetup } from '@draco/shared-api-client';
import HofNominationWidget from '../HofNominationWidget';

vi.mock('@draco/shared-api-client', () => ({
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

describe('HofNominationWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when nominations are disabled', async () => {
    vi.mocked(getAccountHallOfFameNominationSetup).mockResolvedValue({
      data: {
        accountId: '1',
        enableNomination: false,
        criteriaText: null,
      },
    } as unknown as Awaited<ReturnType<typeof getAccountHallOfFameNominationSetup>>);

    const { container } = render(<HofNominationWidget accountId="account-99" />);

    await waitFor(() => expect(getAccountHallOfFameNominationSetup).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the nomination widget and handles submission', async () => {
    vi.mocked(getAccountHallOfFameNominationSetup).mockResolvedValue({
      data: {
        accountId: '1',
        enableNomination: true,
        criteriaText: '<p>Respect and dedication<script>alert(1)</script></p>',
      },
    } as unknown as Awaited<ReturnType<typeof getAccountHallOfFameNominationSetup>>);

    const { container } = render(<HofNominationWidget accountId="account-42" />);

    expect(await screen.findByText('Nominate a Hall of Fame Member')).toBeInTheDocument();
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
