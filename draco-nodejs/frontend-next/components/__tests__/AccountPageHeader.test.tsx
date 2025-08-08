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
    return <img src={src} alt={alt} {...props}/>;
  },
}));

describe('AccountPageHeader', () => {
  it('renders without crashing', () => {
    const mockProps = {
      accountId: 'test-account',
      title: 'Test Title',
    };
    
    render(<AccountPageHeader {...mockProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
