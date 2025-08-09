import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountPageHeader from '../AccountPageHeader';

// Mock Next.js Image component
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
    {
    }
  },
}));

// Mock fetch to resolve account header
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

describe('AccountPageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { name: 'Test Title', accountLogoUrl: null } }),
    });
  });

  it('renders account title after loading', async () => {
    render(<AccountPageHeader accountId="test-account" />);
    expect(await screen.findByText('Test Title')).toBeInTheDocument();
  });
});
