import React from 'react';
import { render, screen } from '@testing-library/react';
import OrganizationsWidget from '../OrganizationsWidget';

// Mock the useAuth hook
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', firstname: 'Test', lastname: 'User' },
    token: 'test-token',
  }),
}));

// Mock the useRouter hook
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('OrganizationsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default title', () => {
    render(<OrganizationsWidget />);
    expect(screen.getByText('Organizations')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<OrganizationsWidget title="My Organizations" />);
    expect(screen.getByText('My Organizations')).toBeInTheDocument();
  });

  it('shows search section when showSearch is true', () => {
    render(<OrganizationsWidget showSearch={true} />);
    expect(
      screen.getByPlaceholderText('Search by organization name, type, or location...'),
    ).toBeInTheDocument();
  });

  it('does not show search section when showSearch is false', () => {
    render(<OrganizationsWidget showSearch={false} />);
    expect(
      screen.queryByPlaceholderText('Search by organization name, type, or location...'),
    ).not.toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    // Mock useAuth to return no user
    vi.doMock('../../context/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        token: null,
      }),
    }));

    const { container } = render(<OrganizationsWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('displays provided organizations when organizations prop is passed', () => {
    const mockOrganizations = [
      {
        id: '1',
        name: 'Test Organization',
        accountType: 'Baseball',
        firstYear: 2020,
        urls: [],
      },
    ];

    render(<OrganizationsWidget organizations={mockOrganizations} />);
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });
});
