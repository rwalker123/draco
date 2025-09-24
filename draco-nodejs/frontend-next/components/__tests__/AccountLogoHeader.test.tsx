import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountLogoHeader from '../AccountLogoHeader';
import { useAccountHeader } from '../../hooks/useAccountHeader';

vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) {
    return <img src={src} alt={alt} {...props} />;
  },
}));

vi.mock('../../hooks/useAccountHeader', () => ({
  useAccountHeader: vi.fn(),
}));

describe('AccountLogoHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAccountHeader).mockReturnValue({
      accountName: 'Test Account',
      logoUrl: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders account name after loading', async () => {
    render(<AccountLogoHeader accountId="test-account" />);
    expect(await screen.findByText('Test Account')).toBeInTheDocument();
  });
});
