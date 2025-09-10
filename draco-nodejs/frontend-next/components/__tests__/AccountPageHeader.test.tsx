import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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
  },
}));

// Mock the axiosConfig module - component imports axiosInstance as default
vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AccountPageHeader', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the mocked module and set up the response
    const axiosConfigMock = await import('../../utils/axiosConfig');
    const mockAxios = vi.mocked(axiosConfigMock.default);

    mockAxios.get.mockResolvedValue({
      data: { success: true, data: { name: 'Test Title', accountLogoUrl: null } },
    });
  });

  it('renders account title after loading', async () => {
    render(<AccountPageHeader accountId="test-account" />);
    expect(await screen.findByText('Test Title')).toBeInTheDocument();
  });
});
