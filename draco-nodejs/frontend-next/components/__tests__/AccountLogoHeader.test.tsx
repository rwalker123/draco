import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AccountLogoHeader from '../AccountLogoHeader';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('AccountLogoHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display account name when no logo is provided', async () => {
    const mockAccountData = {
      success: true,
      data: {
        name: 'Test League',
        accountLogoUrl: null,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockAccountData),
    });

    render(<AccountLogoHeader accountId="123" />);

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After fetch, should show account name
    await waitFor(() => {
      expect(screen.getByText('Test League')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/accounts/123/header');
  });

  it('should display logo when logo URL is provided', async () => {
    const mockAccountData = {
      success: true,
      data: {
        account: {
          name: 'Test League',
          accountLogoUrl: null,
        },
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockAccountData),
    });

    render(<AccountLogoHeader accountId="123" accountLogoUrl="https://example.com/logo.png" />);

    // Wait for the component to load
    await waitFor(() => {
      const logo = screen.getByAltText('Account Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('https://example.com/logo.png'));
    });

    expect(fetch).toHaveBeenCalledWith('/api/accounts/123');
  });

  it('should display account name when logo fails to load', async () => {
    const mockAccountData = {
      success: true,
      data: {
        name: 'Test League',
        accountLogoUrl: 'https://example.com/logo.png',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockAccountData),
    });

    render(<AccountLogoHeader accountId="123" />);

    // Wait for the component to load
    await waitFor(() => {
      const logo = screen.getByAltText('Account Logo');
      expect(logo).toBeInTheDocument();
    });

    // Simulate image load error
    const logo = screen.getByAltText('Account Logo');
    fireEvent.error(logo);

    // Should show account name after error
    await waitFor(() => {
      expect(screen.getByText('Test League')).toBeInTheDocument();
    });
  });
});
