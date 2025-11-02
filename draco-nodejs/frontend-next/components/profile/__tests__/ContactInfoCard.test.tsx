import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ContactInfoCard from '../ContactInfoCard';
import type { BaseContactType } from '@draco/shared-schemas';

const buildContact = (overrides: Partial<BaseContactType> = {}): BaseContactType => ({
  id: '1024',
  firstName: 'Jamie',
  lastName: 'Rivera',
  middleName: 'A',
  email: 'jamie.rivera@example.com',
  userId: 'user-77',
  photoUrl: undefined,
  contactDetails: {
    phone1: '(512) 555-1234',
    phone2: '(512) 555-4567',
    phone3: '',
    streetAddress: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    dateOfBirth: '1990-05-21',
  },
  ...overrides,
});

describe('ContactInfoCard', () => {
  it('renders contact details when data is available', () => {
    const contact = buildContact();

    render(<ContactInfoCard contact={contact} loading={false} accountName="Austin Tigers" />);

    expect(screen.getByTestId('profile-contact-card')).toBeInTheDocument();
    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument();
    expect(screen.getByText('Austin Tigers')).toBeInTheDocument();
    expect(screen.getByText('jamie.rivera@example.com')).toBeInTheDocument();
    expect(screen.getByText('(512) 555-1234')).toBeInTheDocument();
    expect(screen.getByText('(512) 555-4567')).toBeInTheDocument();
    expect(screen.getByText('05-21-1990')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('123 Main St'))).toBeInTheDocument();
  });

  it('renders edit button when handler supplied', () => {
    const contact = buildContact();
    const handleEdit = vi.fn();

    render(
      <ContactInfoCard
        contact={contact}
        loading={false}
        accountName="Austin Tigers"
        onEdit={handleEdit}
      />,
    );

    const editButton = screen.getByTestId('profile-contact-edit-button');
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('renders survey link when provided', () => {
    const contact = buildContact();

    render(
      <ContactInfoCard
        contact={contact}
        loading={false}
        accountName="Austin Tigers"
        surveyHref="/account/1/surveys"
      />,
    );

    const surveyLink = screen.getByTestId('profile-contact-survey-link');
    expect(surveyLink).toBeInTheDocument();
    expect(surveyLink).toHaveAttribute('href', '/account/1/surveys');
  });

  it('shows skeletons while loading', () => {
    render(<ContactInfoCard contact={null} loading={true} />);

    expect(screen.getByTestId('profile-contact-loading')).toBeInTheDocument();
  });

  it('shows fallback message when no contact is found', () => {
    render(<ContactInfoCard contact={null} loading={false} />);

    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText(/could not find your contact/i)).toBeInTheDocument();
  });
});
