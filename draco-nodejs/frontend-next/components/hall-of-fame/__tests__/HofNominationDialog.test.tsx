import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { submitAccountHallOfFameNomination } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import HofNominationDialog from '../HofNominationDialog';

vi.mock('@draco/shared-api-client', () => ({
  submitAccountHallOfFameNomination: vi.fn(),
}));

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: vi.fn(),
}));

vi.mock('@/components/security/TurnstileChallenge', () => ({
  __esModule: true,
  default: ({
    onTokenChange,
    loading,
  }: {
    onTokenChange: (token: string | null) => void;
    loading: boolean;
  }) => (
    <button
      type="button"
      data-testid="turnstile-challenge"
      onClick={() => onTokenChange('mock-turnstile-token')}
      disabled={loading}
    >
      Turnstile
    </button>
  ),
}));

describe('HofNominationDialog', () => {
  const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const restoreSiteKey = () => {
    if (originalSiteKey === undefined) {
      delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey;
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApiClient).mockReturnValue({} as never);
    restoreSiteKey();
  });

  afterEach(() => {
    restoreSiteKey();
  });

  afterAll(() => {
    restoreSiteKey();
  });

  const fillRequiredFields = async () => {
    await userEvent.type(screen.getByLabelText(/your name/i), 'Jane Coach');
    await userEvent.type(screen.getByLabelText(/phone number/i), '5551234567');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/nominee name/i), 'Alex Player');
    await userEvent.type(
      screen.getByLabelText(/reason for nomination/i),
      'Outstanding leadership and performance.',
    );
  };

  it('submits a nomination and shows success feedback', async () => {
    vi.mocked(submitAccountHallOfFameNomination).mockResolvedValue(
      {} as Awaited<ReturnType<typeof submitAccountHallOfFameNomination>>,
    );

    const onSubmitted = vi.fn();
    const onClose = vi.fn();

    render(
      <HofNominationDialog
        accountId="abc123"
        open
        onClose={onClose}
        onSubmitted={onSubmitted}
        criteriaText="<p>Be respectful</p>"
      />,
    );

    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit Nomination' }));

    await waitFor(() => expect(submitAccountHallOfFameNomination).toHaveBeenCalledTimes(1));

    const submissionArgs = vi.mocked(submitAccountHallOfFameNomination).mock.calls[0]?.[0];
    expect(submissionArgs?.path).toEqual({ accountId: 'abc123' });
    expect(submissionArgs?.body).toEqual({
      nominator: 'Jane Coach',
      phoneNumber: '(555) 123-4567',
      email: 'jane@example.com',
      nominee: 'Alex Player',
      reason: 'Outstanding leadership and performance.',
    });
    expect(submissionArgs?.headers).toBeUndefined();

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Thank you! Your Hall of Fame nomination has been received.'),
    ).toBeInTheDocument();
  });

  it('requires a Turnstile challenge when a site key is configured', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
    vi.mocked(submitAccountHallOfFameNomination).mockResolvedValue(
      {} as Awaited<ReturnType<typeof submitAccountHallOfFameNomination>>,
    );

    const onSubmitted = vi.fn();
    const onClose = vi.fn();

    render(
      <HofNominationDialog
        accountId="hall-of-fame"
        open
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );

    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Submit Nomination' }));

    expect(
      await screen.findByText('Please verify that you are human before submitting the nomination.'),
    ).toBeInTheDocument();
    expect(submitAccountHallOfFameNomination).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('turnstile-challenge'));
    await userEvent.click(screen.getByRole('button', { name: 'Submit Nomination' }));

    await waitFor(() => expect(submitAccountHallOfFameNomination).toHaveBeenCalledTimes(1));
    const submissionWithChallenge = vi.mocked(submitAccountHallOfFameNomination).mock.calls[0]?.[0];
    expect(submissionWithChallenge?.headers).toEqual({
      'cf-turnstile-token': 'mock-turnstile-token',
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
