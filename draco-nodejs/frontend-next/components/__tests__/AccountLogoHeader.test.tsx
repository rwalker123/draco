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

describe('AccountLogoHeader', () => {
  it('renders without crashing', () => {
    const mockProps = {
      accountId: 'test-account',
      accountName: 'Test Account',
    };

    render(<AccountLogoHeader {...mockProps} />);
    expect(screen.getByText('Test Account')).toBeInTheDocument();
  });
});
