'use client';

import type { BaseContactType, CreateContactType } from '@draco/shared-schemas';

const EMPTY_CONTACT_DETAILS: NonNullable<CreateContactType['contactDetails']> = {
  phone1: '',
  phone2: '',
  phone3: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  dateOfBirth: '',
};

const EMPTY_CONTACT_VALUES: CreateContactType = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  contactDetails: EMPTY_CONTACT_DETAILS,
};

export const createEmptyContactValues = (): CreateContactType => ({
  ...EMPTY_CONTACT_VALUES,
  contactDetails: { ...EMPTY_CONTACT_DETAILS },
});

export const mapContactToCreateValues = (contact: BaseContactType | null): CreateContactType => ({
  firstName: contact?.firstName ?? '',
  lastName: contact?.lastName ?? '',
  middleName: contact?.middleName ?? '',
  email: contact?.email ?? '',
  contactDetails: {
    phone1: contact?.contactDetails?.phone1 ?? '',
    phone2: contact?.contactDetails?.phone2 ?? '',
    phone3: contact?.contactDetails?.phone3 ?? '',
    streetAddress: contact?.contactDetails?.streetAddress ?? '',
    city: contact?.contactDetails?.city ?? '',
    state: contact?.contactDetails?.state ?? '',
    zip: contact?.contactDetails?.zip ?? '',
    dateOfBirth: contact?.contactDetails?.dateOfBirth ?? '',
  },
});

export const buildInitialContactValues = (
  mode: 'create' | 'edit',
  contact: BaseContactType | null,
): CreateContactType => (mode === 'edit' && contact ? mapContactToCreateValues(contact) : createEmptyContactValues());
