import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountLogoHeader from '../AccountLogoHeader';

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

describe('AccountLogoHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { name: 'Test Account', accountLogoUrl: null } }),
    });
  });

  it('renders account name after loading', async () => {
    render(<AccountLogoHeader accountId="test-account" />);
    expect(await screen.findByText('Test Account')).toBeInTheDocument();
  });
});
