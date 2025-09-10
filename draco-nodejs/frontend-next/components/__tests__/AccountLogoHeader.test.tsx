import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AccountLogoHeader from '../AccountLogoHeader';
import { axiosInstance } from '../../utils/axiosConfig';

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
  },
}));

// Mock axios
vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
  },
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe('AccountLogoHeader', () => {
  const mockAxios = axiosInstance as typeof axiosInstance & {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.get.mockResolvedValue({
      data: { success: true, data: { name: 'Test Account', accountLogoUrl: null } },
    });
  });

  it('renders account name after loading', async () => {
    render(<AccountLogoHeader accountId="test-account" />);
    expect(await screen.findByText('Test Account')).toBeInTheDocument();
  });
});
