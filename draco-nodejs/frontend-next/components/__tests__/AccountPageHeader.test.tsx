import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountPageHeader from '../AccountPageHeader';
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

describe('AccountPageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAccountHeader).mockReturnValue({
      accountName: 'Test Title',
      logoUrl: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders account title after loading', async () => {
    render(<AccountPageHeader accountId="test-account" />);
    expect(await screen.findByText('Test Title')).toBeInTheDocument();
  });
});
