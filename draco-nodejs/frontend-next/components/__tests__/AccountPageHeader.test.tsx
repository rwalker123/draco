import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AccountPageHeader from '../AccountPageHeader';

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

describe('AccountPageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display account name and page content when no logo is provided', async () => {
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

    render(
      <AccountPageHeader accountId="123">
        <div>Page Content</div>
      </AccountPageHeader>,
    );

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After fetch, should show account name and page content
    await waitFor(() => {
      expect(screen.getByText('Test League')).toBeInTheDocument();
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/accounts/123/header');
  });

  it('should display logo and page content when logo URL is provided', async () => {
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

    render(
      <AccountPageHeader accountId="123" accountLogoUrl="https://example.com/logo.png">
        <div>Page Content</div>
      </AccountPageHeader>,
    );

    // Wait for the component to load
    await waitFor(() => {
      const logo = screen.getByAltText('Account Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('https://example.com/logo.png'));
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/accounts/123/header');
  });

  it('should hide logo when showLogo is false', async () => {
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

    render(
      <AccountPageHeader accountId="123" showLogo={false}>
        <div>Page Content</div>
      </AccountPageHeader>,
    );

    // Should not show loading or account name
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Test League')).not.toBeInTheDocument();

    // Should show page content
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('should use custom background when provided', async () => {
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

    const customBackground = 'linear-gradient(135deg, #ff0000 0%, #00ff00 100%)';

    render(
      <AccountPageHeader accountId="123" background={customBackground}>
        <div>Page Content</div>
      </AccountPageHeader>,
    );

    await waitFor(() => {
      const header = screen.getByText('Test League').closest('div');
      expect(header).toHaveStyle(`background: ${customBackground}`);
    });
  });
});
